/**
 * Cloudflare Workers MCP Server for PptxGenJS
 * 
 * This is an HTTP/SSE-based MCP server that runs on Cloudflare Workers.
 * It uses Cloudflare R2 for storing generated presentations.
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  McpError,
  ErrorCode,
} from "@modelcontextprotocol/sdk/types.js";
import { createRequire } from "module";

const require = createRequire(import.meta.url);
const PptxGenJS = require("pptxgenjs");

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
  folder: 'output' | 'template',
  accountId?: string,
  publicBucketUrl?: string
): Promise<string> {
  // Construct full path with folder
  const fullPath = `${folder}/${fileName}`;
  
  // Upload to R2
  await bucket.put(fullPath, data, {
    httpMetadata: {
      contentType: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    },
  });

  // Generate public URL
  // If PUBLIC_BUCKET_URL is set, use it; otherwise construct from R2 public domain
  if (publicBucketUrl) {
    return `${publicBucketUrl}/${fullPath}`;
  } else if (accountId) {
    // Use R2.dev subdomain (note: this requires public bucket access to be enabled)
    const bucketName = 'pptx'; // This should match wrangler.toml
    return `https://${bucketName}.${accountId}.r2.dev/${fullPath}`;
  } else {
    // Fallback - return a relative URL
    return `/files/${fullPath}`;
  }
}

// Helper function to save template to R2
async function saveTemplateToR2(
  bucket: any,
  templateId: string,
  templateData: any,
  accountId?: string,
  publicBucketUrl?: string
): Promise<string> {
  const fileName = `${templateId}.json`;
  const fullPath = `template/${fileName}`;
  const jsonData = JSON.stringify(templateData);
  const encoder = new TextEncoder();
  const data = encoder.encode(jsonData);
  
  await bucket.put(fullPath, data, {
    httpMetadata: {
      contentType: 'application/json',
    },
  });
  
  // Generate public URL
  if (publicBucketUrl) {
    return `${publicBucketUrl}/${fullPath}`;
  } else if (accountId) {
    const bucketName = 'pptx';
    return `https://${bucketName}.${accountId}.r2.dev/${fullPath}`;
  } else {
    return `/files/${fullPath}`;
  }
}

// Helper function to load template from R2
async function loadTemplateFromR2(
  bucket: any,
  templateId: string
): Promise<any> {
  const fileName = `${templateId}.json`;
  const fullPath = `template/${fileName}`;
  
  const object = await bucket.get(fullPath);
  if (!object) {
    throw new Error(`Template ${templateId} not found in R2`);
  }
  
  const text = await object.text();
  return JSON.parse(text);
}

// Create the MCP server instance
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
          
          // Upload to R2 in the 'output' folder and get public URL
          const publicUrl = await uploadToR2(
            env.PPTX_BUCKET,
            fileName,
            arrayBuffer,
            'output',
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

    // SSE endpoint for establishing the stream
    if (url.pathname === '/mcp' && request.method === 'GET') {
      // Create a new server instance for this session
      const server = createMcpServer(env);
      
      // Create SSE transport
      const { readable, writable } = new TransformStream();
      const writer = writable.getWriter();
      
      // Simple SSE implementation
      const transport = new SSEServerTransport('/messages', {
        setHeader: () => {},
        write: (data: string) => {
          writer.write(new TextEncoder().encode(data));
        },
        end: () => {
          writer.close();
        },
      } as any);

      // Connect server to transport
      await server.connect(transport);

      return new Response(readable, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }

    // Messages endpoint for receiving client JSON-RPC requests
    if (url.pathname === '/messages' && request.method === 'POST') {
      // For now, return a simple response
      // In a full implementation, this would handle the message routing
      return new Response(
        JSON.stringify({ error: 'Not implemented yet' }),
        {
          status: 501,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        }
      );
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
