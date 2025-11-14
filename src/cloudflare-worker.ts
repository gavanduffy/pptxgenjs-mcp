/**
 * Cloudflare Workers MCP Server for PptxGenJS
 * 
 * This is an HTTP/SSE-based MCP server that runs on Cloudflare Workers.
 * It uses Cloudflare R2 for storing generated presentations.
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  McpError,
  ErrorCode,
} from "@modelcontextprotocol/sdk/types.js";
import * as PptxGenJSModule from "pptxgenjs";
import { addSlidesFromMarkdown } from "./markdown.js";

// PptxGenJS is exported as default but TypeScript needs help with the type
const PptxGenJS = (PptxGenJSModule as any).default || PptxGenJSModule;

// Cloudflare Workers environment bindings
interface Env {
  PPTX_BUCKET: any; // R2Bucket type - will be available in Cloudflare Workers runtime
  CLOUDFLARE_ACCOUNT_ID?: string;
  PUBLIC_BUCKET_URL?: string;
}

// Store active presentations per session (using Durable Objects would be better for production)
// For now, we use a simple Map that will be session-specific
const presentations = new Map<string, any>();
let presentationCounter = 0;

const templates = new Map<string, any>();
let templateCounter = 0;

const slideMasters = new Map<string, any>();

// Helper to get or create presentation
function getPresentation(presentationId?: string): { pptx: any; id: string } {
  if (presentationId && presentations.has(presentationId)) {
    return { pptx: presentations.get(presentationId)!, id: presentationId };
  }
  
  const id = presentationId || `pres_${++presentationCounter}`;
  const pptx = new PptxGenJS();
  presentations.set(id, pptx);
  return { pptx, id };
}

// Helper function to upload PPTX to R2 and get public URL
async function uploadToR2(
  bucket: any, // R2Bucket - runtime type
  fileName: string,
  data: ArrayBuffer,
  accountId?: string,
  publicBucketUrl?: string
): Promise<string> {
  // Upload to R2
  await bucket.put(fileName, data, {
    httpMetadata: {
      contentType: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    },
  });

  // Generate public URL
  // If PUBLIC_BUCKET_URL is set, use it; otherwise construct from R2 public domain
  if (publicBucketUrl) {
    return `${publicBucketUrl}/${fileName}`;
  } else if (accountId) {
    // Use R2.dev subdomain (note: this requires public bucket access to be enabled)
    const bucketName = 'pptx'; // This should match wrangler.toml
    return `https://${bucketName}.${accountId}.r2.dev/${fileName}`;
  } else {
    // Fallback - return a relative URL
    return `/files/${fileName}`;
  }
}

// Create the MCP server instance and shared transport
let sharedServer: Server | null = null;
let sharedTransport: StreamableHTTPServerTransport | null = null;

function createMcpServer(env: Env) {
  const server = new Server(
    {
      name: "pptxgenjs-mcp-cloudflare",
      version: "1.0.0",
    },
    {
      capabilities: {
        tools: {},
      },
    }
  );

  // Define tools (simplified version - we'll add the complete implementation)
  server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
      tools: [
        {
          name: "create_presentation",
          description: "Create a new PowerPoint presentation. Returns a presentation ID that should be used in subsequent operations.",
          inputSchema: {
            type: "object",
            properties: {
              presentationId: {
                type: "string",
                description: "Optional custom ID for the presentation. If not provided, one will be generated.",
              },
              layout: {
                type: "string",
                description: "Presentation layout: 'LAYOUT_4x3', 'LAYOUT_16x9' (default), 'LAYOUT_16x10', or 'LAYOUT_WIDE'",
                enum: ["LAYOUT_4x3", "LAYOUT_16x9", "LAYOUT_16x10", "LAYOUT_WIDE"],
              },
              title: {
                type: "string",
                description: "Presentation title",
              },
              author: {
                type: "string",
                description: "Presentation author name",
              },
            },
          },
        },
        {
          name: "add_slide",
          description: "Add a new slide to a presentation. Returns the slide index.",
          inputSchema: {
            type: "object",
            properties: {
              presentationId: {
                type: "string",
                description: "Presentation ID (returned from create_presentation)",
              },
              backgroundColor: {
                type: "string",
                description: "Slide background color as 6-digit hex (e.g., 'FF0000' for red)",
              },
            },
            required: ["presentationId"],
          },
        },
        {
          name: "add_text",
          description: "Add text to the current slide. Supports rich text formatting.",
          inputSchema: {
            type: "object",
            properties: {
              presentationId: {
                type: "string",
                description: "Presentation ID",
              },
              text: {
                type: ["string", "array"],
                description: "Text content. Can be a string or array of text objects with individual formatting",
              },
              x: {
                type: ["number", "string"],
                description: "X position in inches or percentage (e.g., 1.5 or '50%')",
              },
              y: {
                type: ["number", "string"],
                description: "Y position in inches or percentage",
              },
              w: {
                type: ["number", "string"],
                description: "Width in inches or percentage",
              },
              h: {
                type: ["number", "string"],
                description: "Height in inches or percentage",
              },
              fontSize: {
                type: "number",
                description: "Font size in points",
              },
              bold: {
                type: "boolean",
                description: "Bold text",
              },
              align: {
                type: "string",
                description: "Horizontal alignment",
                enum: ["left", "center", "right", "justify"],
              },
            },
            required: ["presentationId", "text"],
          },
        },
        {
          name: "save_presentation",
          description: "Save the presentation to R2 storage and return a public download URL.",
          inputSchema: {
            type: "object",
            properties: {
              presentationId: {
                type: "string",
                description: "Presentation ID",
              },
              fileName: {
                type: "string",
                description: "Output filename (should end with .pptx)",
              },
            },
            required: ["presentationId", "fileName"],
          },
        },
        {
          name: "add_image",
          description: "Add an image to the current slide. Supports URLs, local paths, and base64 data.",
          inputSchema: {
            type: "object",
            properties: {
              presentationId: { type: "string", description: "Presentation ID" },
              path: { type: "string", description: "Image path (URL or local file path)" },
              data: { type: "string", description: "Base64 encoded image data (e.g., 'image/png;base64,iVBOR...')" },
              x: { type: ["number", "string"], description: "X position in inches or percentage" },
              y: { type: ["number", "string"], description: "Y position in inches or percentage" },
              w: { type: ["number", "string"], description: "Width in inches or percentage" },
              h: { type: ["number", "string"], description: "Height in inches or percentage" },
            },
            required: ["presentationId"],
          },
        },
        {
          name: "add_table",
          description: "Add a table to the current slide with customizable rows, columns, and styling.",
          inputSchema: {
            type: "object",
            properties: {
              presentationId: { type: "string", description: "Presentation ID" },
              rows: {
                type: "array",
                description: "Array of rows, where each row is an array of cells. Each cell can be a string or an object with text and styling options",
                items: { type: "array", items: {} },
              },
              x: { type: ["number", "string"], description: "X position in inches or percentage" },
              y: { type: ["number", "string"], description: "Y position in inches or percentage" },
              w: { type: ["number", "string"], description: "Table width in inches or percentage" },
              h: { type: ["number", "string"], description: "Table height in inches or percentage" },
              colW: { type: "array", items: { type: "number" }, description: "Array of column widths in inches" },
            },
            required: ["presentationId", "rows"],
          },
        },
        {
          name: "add_chart",
          description: "Add a chart to the current slide. Supports bar, line, pie, area, scatter, bubble, radar, and doughnut charts.",
          inputSchema: {
            type: "object",
            properties: {
              presentationId: { type: "string", description: "Presentation ID" },
              type: {
                type: "string",
                description: "Chart type",
                enum: ["bar", "bar3D", "line", "pie", "area", "scatter", "bubble", "bubble3D", "doughnut", "radar"],
              },
              data: {
                type: "array",
                description: "Chart data series. Each series is an object with name, labels, and values",
                items: {
                  type: "object",
                  properties: {
                    name: { type: "string" },
                    labels: { type: "array", items: { type: "string" } },
                    values: { type: "array", items: { type: "number" } },
                  },
                },
              },
              x: { type: ["number", "string"], description: "X position in inches or percentage" },
              y: { type: ["number", "string"], description: "Y position in inches or percentage" },
              w: { type: ["number", "string"], description: "Width in inches or percentage" },
              h: { type: ["number", "string"], description: "Height in inches or percentage" },
              title: { type: "string", description: "Chart title" },
              showLegend: { type: "boolean", description: "Show legend" },
            },
            required: ["presentationId", "type", "data"],
          },
        },
        {
          name: "import_markdown_presentation",
          description: "Create slides from Markdown input. Supports headings, paragraphs, lists (nested), images, code blocks, quotes, and horizontal rules.",
          inputSchema: {
            type: "object",
            properties: {
              presentationId: { type: "string", description: "Presentation ID" },
              markdown: { type: "string", description: "Markdown content" },
              options: {
                type: "object",
                description: "Import options and defaults",
                properties: {
                  splitLevel: { type: "number", enum: [1,2] },
                  titleSlide: { type: "boolean", default: true },
                  defaults: {
                    type: "object",
                    properties: {
                      titleFontSize: { type: "number" },
                      bodyFontSize: { type: "number" },
                      codeFontFace: { type: "string" },
                      codeFontSize: { type: "number" },
                      textColor: { type: "string" },
                    },
                  },
                  layout: {
                    type: "object",
                    properties: {
                      marginX: { type: "number" },
                      marginY: { type: "number" },
                      contentWidth: { type: "number" },
                    },
                  },
                  image: {
                    type: "object",
                    properties: {
                      defaultWidth: { type: "number" },
                      defaultHeight: { type: "number" },
                    },
                  },
                },
              },
            },
            required: ["presentationId", "markdown"],
          },
        },
        {
          name: "list_presentations",
          description: "List all active presentations in the current session.",
          inputSchema: {
            type: "object",
            properties: {},
          },
        },
      ],
    };
  });

  // Handle tool execution
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    try {
      switch (name) {
        case "create_presentation": {
          const { presentationId, layout, title, author } = args as any;
          const { pptx, id } = getPresentation(presentationId);
          
          if (layout) pptx.layout = layout;
          if (title) pptx.title = title;
          if (author) pptx.author = author;

          return {
            content: [
              {
                type: "text",
                text: JSON.stringify({
                  success: true,
                  presentationId: id,
                  message: `Presentation created with ID: ${id}`,
                  metadata: {
                    layout: pptx.layout,
                    title: pptx.title,
                    author: pptx.author,
                  },
                }, null, 2),
              },
            ],
          };
        }

        case "add_slide": {
          const { presentationId, backgroundColor } = args as any;
          if (!presentationId) {
            throw new McpError(ErrorCode.InvalidParams, "presentationId is required");
          }
          
          const { pptx } = getPresentation(presentationId);
          const slideOptions: any = {};
          
          if (backgroundColor) {
            slideOptions.background = { color: backgroundColor };
          }
          
          pptx.addSlide(slideOptions);
          
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify({
                  success: true,
                  message: "Slide added successfully",
                  presentationId,
                }, null, 2),
              },
            ],
          };
        }

        case "add_text": {
          const { presentationId, text, ...options } = args as any;
          if (!presentationId) {
            throw new McpError(ErrorCode.InvalidParams, "presentationId is required");
          }
          
          const { pptx } = getPresentation(presentationId);
          const slides = (pptx as any).slides;
          if (!slides || slides.length === 0) {
            throw new McpError(ErrorCode.InvalidParams, "No slides in presentation. Add a slide first.");
          }
          
          const currentSlide = slides[slides.length - 1];
          currentSlide.addText(text, options);
          
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify({
                  success: true,
                  message: "Text added to slide",
                  presentationId,
                }, null, 2),
              },
            ],
          };
        }

        case "save_presentation": {
          const { presentationId, fileName } = args as any;
          if (!presentationId || !fileName) {
            throw new McpError(ErrorCode.InvalidParams, "presentationId and fileName are required");
          }
          
          const { pptx } = getPresentation(presentationId);
          
          // Generate the PPTX file as ArrayBuffer
          const arrayBuffer = await pptx.write({ outputType: 'arraybuffer' });
          
          // Upload to R2 and get public URL
          const publicUrl = await uploadToR2(
            env.PPTX_BUCKET,
            fileName,
            arrayBuffer,
            env.CLOUDFLARE_ACCOUNT_ID,
            env.PUBLIC_BUCKET_URL
          );
          
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify({
                  success: true,
                  message: `Presentation saved to R2 storage`,
                  presentationId,
                  fileName,
                  downloadUrl: publicUrl,
                  size: arrayBuffer.byteLength,
                }, null, 2),
              },
            ],
          };
        }

        case "list_presentations": {
          const list = Array.from(presentations.keys()).map(id => {
            const pptx = presentations.get(id)!;
            const slides = (pptx as any).slides || [];
            return {
              id,
              layout: pptx.layout,
              title: pptx.title,
              slideCount: slides.length,
            };
          });
          
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify({
                  success: true,
                  presentations: list,
                  count: list.length,
                }, null, 2),
              },
            ],
          };
        }

        case "add_image": {
          const { presentationId, path, data, x, y, w, h, ...otherOptions } = args as any;
          if (!presentationId) {
            throw new McpError(ErrorCode.InvalidParams, "presentationId is required");
          }
          if (!path && !data) {
            throw new McpError(ErrorCode.InvalidParams, "Either path or data is required");
          }
          
          const { pptx } = getPresentation(presentationId);
          const slides = (pptx as any).slides;
          if (!slides || slides.length === 0) {
            throw new McpError(ErrorCode.InvalidParams, "No slides in presentation. Add a slide first.");
          }
          
          const currentSlide = slides[slides.length - 1];
          const imageOptions: any = { ...otherOptions };
          if (x !== undefined) imageOptions.x = x;
          if (y !== undefined) imageOptions.y = y;
          if (w !== undefined) imageOptions.w = w;
          if (h !== undefined) imageOptions.h = h;
          if (path) imageOptions.path = path;
          if (data) imageOptions.data = data;
          
          currentSlide.addImage(imageOptions);
          
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify({
                  success: true,
                  message: "Image added to slide",
                  presentationId,
                }, null, 2),
              },
            ],
          };
        }

        case "add_table": {
          const { presentationId, rows, x, y, w, h, colW, ...otherOptions } = args as any;
          if (!presentationId || !rows) {
            throw new McpError(ErrorCode.InvalidParams, "presentationId and rows are required");
          }
          
          const { pptx } = getPresentation(presentationId);
          const slides = (pptx as any).slides;
          if (!slides || slides.length === 0) {
            throw new McpError(ErrorCode.InvalidParams, "No slides in presentation. Add a slide first.");
          }
          
          const currentSlide = slides[slides.length - 1];
          const tableOptions: any = { rows, ...otherOptions };
          if (x !== undefined) tableOptions.x = x;
          if (y !== undefined) tableOptions.y = y;
          if (w !== undefined) tableOptions.w = w;
          if (h !== undefined) tableOptions.h = h;
          if (colW) tableOptions.colW = colW;
          
          currentSlide.addTable(tableOptions);
          
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify({
                  success: true,
                  message: "Table added to slide",
                  presentationId,
                  rows: rows.length,
                  cols: rows[0]?.length || 0,
                }, null, 2),
              },
            ],
          };
        }

        case "add_chart": {
          const { presentationId, type, data, x, y, w, h, title, showLegend, ...otherOptions } = args as any;
          if (!presentationId || !type || !data) {
            throw new McpError(ErrorCode.InvalidParams, "presentationId, type, and data are required");
          }
          
          const { pptx } = getPresentation(presentationId);
          const slides = (pptx as any).slides;
          if (!slides || slides.length === 0) {
            throw new McpError(ErrorCode.InvalidParams, "No slides in presentation. Add a slide first.");
          }
          
          const currentSlide = slides[slides.length - 1];
          const chartOptions: any = { chartType: type, data, ...otherOptions };
          if (x !== undefined) chartOptions.x = x;
          if (y !== undefined) chartOptions.y = y;
          if (w !== undefined) chartOptions.w = w;
          if (h !== undefined) chartOptions.h = h;
          if (title) chartOptions.title = title;
          if (showLegend !== undefined) chartOptions.showLegend = showLegend;
          
          currentSlide.addChart(chartOptions);
          
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify({
                  success: true,
                  message: "Chart added to slide",
                  presentationId,
                  chartType: type,
                }, null, 2),
              },
            ],
          };
        }

        case "import_markdown_presentation": {
          const { presentationId, markdown, options } = args as any;
          if (!presentationId || !markdown) {
            throw new McpError(ErrorCode.InvalidParams, "presentationId and markdown are required");
          }
          const { pptx } = getPresentation(presentationId);
          addSlidesFromMarkdown(pptx, markdown, options || {});
          const slides = (pptx as any).slides || [];
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify({
                  success: true,
                  message: "Slides created from Markdown",
                  presentationId,
                  slideCount: slides.length,
                }, null, 2),
              },
            ],
          };
        }

        default:
          throw new McpError(
            ErrorCode.MethodNotFound,
            `Unknown tool: ${name}`
          );
      }
    } catch (error: any) {
      if (error instanceof McpError) {
        throw error;
      }
      throw new McpError(
        ErrorCode.InternalError,
        `Error executing ${name}: ${error.message}`
      );
    }
  });

  return server;
}

// Adapters to approximate Node req/res for StreamableHTTPServerTransport
class CfReq {
  method: string;
  headers: Record<string, string>;
  auth: any;
  constructor(request: Request) {
    this.method = request.method;
    this.headers = {};
    request.headers.forEach((v, k) => { this.headers[k.toLowerCase()] = v; });
    this.auth = undefined;
  }
}

class CfRes {
  status = 200;
  headers: Record<string, string> = {};
  private stream = new TransformStream();
  private writer = this.stream.writable.getWriter();
  private encoder = new TextEncoder();
  private _onclose: (() => void) | undefined;
  private _onerror: ((e: any) => void) | undefined;
  writeHead(status: number, headers: Record<string, string>) {
    this.status = status;
    Object.assign(this.headers, headers);
    return this;
  }
  flushHeaders() { /* no-op for Workers */ }
  write(chunk: any) {
    try {
      if (typeof chunk === 'string') this.writer.write(this.encoder.encode(chunk));
      else if (chunk instanceof Uint8Array) this.writer.write(chunk);
      else this.writer.write(this.encoder.encode(String(chunk)));
      return true;
    } catch (e) {
      this._onerror?.(e);
      return false;
    }
  }
  end(chunk?: any) {
    if (chunk) this.write(chunk);
    this.writer.close();
    this._onclose?.();
  }
  on(event: 'close' | 'error', handler: any) {
    if (event === 'close') this._onclose = handler; else if (event === 'error') this._onerror = handler;
  }
  toResponse(): Response {
    return new Response(this.stream.readable, { status: this.status, headers: this.headers });
  }
}

// Cloudflare Workers HTTP handler
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        },
      });
    }

    // Initialize shared server and transport once per worker instance
    if (!sharedServer || !sharedTransport) {
      sharedServer = createMcpServer(env);
      sharedTransport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined });
      await sharedServer.connect(sharedTransport);
    }

    // Unified MCP endpoint using Streamable HTTP transport
    if (url.pathname === '/mcp' && (request.method === 'GET' || request.method === 'POST' || request.method === 'DELETE')) {
      const req = new CfReq(request);
      const res = new CfRes();
      let parsedBody: any = undefined;
      if (request.method === 'POST') {
        // Try parse JSON; if fails, leave undefined
        try { parsedBody = await request.json(); } catch {}
      }
      await sharedTransport!.handleRequest(req as any, res as any, parsedBody);
      // Always set CORS headers
      res.headers['Access-Control-Allow-Origin'] = '*';
      return res.toResponse();
    }

    // Health check endpoint
    if (url.pathname === '/health') {
      return new Response(
        JSON.stringify({ status: 'ok', service: 'pptxgenjs-mcp' }),
        {
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        }
      );
    }

    // File download endpoint (if needed)
    if (url.pathname.startsWith('/files/')) {
      const fileName = url.pathname.substring(7);
      const object = await env.PPTX_BUCKET.get(fileName);
      
      if (!object) {
        return new Response('File not found', { status: 404 });
      }

      return new Response(object.body, {
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
          'Content-Disposition': `attachment; filename="${fileName}"`,
          'Access-Control-Allow-Origin': '*',
        },
      });
    }

    return new Response('Not found', { status: 404 });
  },
};
