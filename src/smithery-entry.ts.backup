/**
 * Smithery Entry Point for PptxGenJS MCP Server
 * 
 * This file exports the required createServer function for Smithery deployment.
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  McpError,
  ErrorCode,
} from "@modelcontextprotocol/sdk/types.js";
import * as PptxGenJSModule from "pptxgenjs";
import { addSlidesFromMarkdown } from "./markdown.js";
import { z } from "zod";

// PptxGenJS is exported as default but TypeScript needs help with the type
const PptxGenJS = (PptxGenJSModule as any).default || PptxGenJSModule;

// Store active presentations per session
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

// Configuration schema (optional for Smithery)
export const configSchema = z.object({
  CLOUDFLARE_ACCOUNT_ID: z.string().optional().describe("Cloudflare Account ID for R2 storage (optional)"),
  PUBLIC_BUCKET_URL: z.string().optional().describe("Public bucket URL for file access (optional)"),
});

// Required: Export default createServer function
export default function createServer({ config }: { config?: z.infer<typeof configSchema> }) {
  const server = new Server(
    {
      name: "pptxgenjs-mcp",
      version: "1.0.0",
    },
    {
      capabilities: {
        tools: {},
      },
    }
  );

  // Register list_tools handler
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
              title: { type: "string", description: "Presentation title" },
              author: { type: "string", description: "Presentation author name" },
              subject: { type: "string", description: "Presentation subject" },
              company: { type: "string", description: "Company name" },
              layout: {
                type: "string",
                description: "Presentation layout: 'LAYOUT_4x3', 'LAYOUT_16x9' (default), 'LAYOUT_16x10', or 'LAYOUT_WIDE'",
                enum: ["LAYOUT_4x3", "LAYOUT_16x9", "LAYOUT_16x10", "LAYOUT_WIDE"],
              },
              rtlMode: { type: "boolean", description: "Enable right-to-left mode" },
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
              backgroundImage: {
                type: "object",
                description: "Background image configuration",
                properties: {
                  path: { type: "string", description: "Image path (URL or local file path)" },
                  data: {
                    type: "string",
                    description: "Base64 encoded image data (e.g., 'image/png;base64,iVBOR...')",
                  },
                },
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
              presentationId: { type: "string", description: "Presentation ID" },
              text: {
                description: "Text content. Can be a string or array of text objects with individual formatting",
                oneOf: [{ type: "string" }, { type: "array" }],
              },
              x: {
                description: "X position in inches or percentage (e.g., 1.5 or '50%')",
                oneOf: [{ type: "number" }, { type: "string" }],
              },
              y: {
                description: "Y position in inches or percentage",
                oneOf: [{ type: "number" }, { type: "string" }],
              },
              w: {
                description: "Width in inches or percentage",
                oneOf: [{ type: "number" }, { type: "string" }],
              },
              h: {
                description: "Height in inches or percentage",
                oneOf: [{ type: "number" }, { type: "string" }],
              },
              fontSize: { type: "number", description: "Font size in points" },
              fontFace: { type: "string", description: "Font family name (e.g., 'Arial', 'Calibri')" },
              bold: { type: "boolean", description: "Bold text" },
              italic: { type: "boolean", description: "Italic text" },
              underline: {
                description: "Underline text. Can be true/false or object with style",
                oneOf: [{ type: "boolean" }, { type: "object" }],
              },
              color: { type: "string", description: "Text color as 6-digit hex (e.g., '000000')" },
              align: {
                type: "string",
                description: "Horizontal alignment",
                enum: ["left", "center", "right", "justify"],
              },
              valign: {
                type: "string",
                description: "Vertical alignment",
                enum: ["top", "middle", "bottom"],
              },
              bullet: {
                description: "Enable bullet points. Can be true/false or object with custom bullet options",
                oneOf: [{ type: "boolean" }, { type: "object" }],
              },
              lineSpacing: { type: "number", description: "Line spacing (e.g., 1.5 for 1.5x spacing)" },
            },
            required: ["presentationId", "text"],
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
              data: {
                type: "string",
                description: "Base64 encoded image data (e.g., 'image/png;base64,iVBOR...')",
              },
              x: {
                description: "X position in inches or percentage",
                oneOf: [{ type: "number" }, { type: "string" }],
              },
              y: {
                description: "Y position in inches or percentage",
                oneOf: [{ type: "number" }, { type: "string" }],
              },
              w: {
                description: "Width in inches or percentage",
                oneOf: [{ type: "number" }, { type: "string" }],
              },
              h: {
                description: "Height in inches or percentage",
                oneOf: [{ type: "number" }, { type: "string" }],
              },
              sizing: {
                type: "object",
                description: "Image sizing options",
                properties: {
                  type: {
                    type: "string",
                    description: "Sizing type",
                    enum: ["contain", "cover", "crop"],
                  },
                  w: { type: "number", description: "Target width" },
                  h: { type: "number", description: "Target height" },
                },
              },
              hyperlink: {
                type: "object",
                description: "Add hyperlink to image",
                properties: {
                  url: { type: "string", description: "Target URL" },
                  tooltip: { type: "string", description: "Tooltip text" },
                },
              },
              rounding: { type: "boolean", description: "Round image corners" },
              transparency: { type: "number", description: "Image transparency (0-100)" },
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
              },
              x: {
                description: "X position in inches or percentage",
                oneOf: [{ type: "number" }, { type: "string" }],
              },
              y: {
                description: "Y position in inches or percentage",
                oneOf: [{ type: "number" }, { type: "string" }],
              },
              w: {
                description: "Table width in inches or percentage",
                oneOf: [{ type: "number" }, { type: "string" }],
              },
              h: {
                description: "Table height in inches or percentage",
                oneOf: [{ type: "number" }, { type: "string" }],
              },
              colW: {
                type: "array",
                items: { type: "number" },
                description: "Array of column widths in inches",
              },
              rowH: {
                type: "array",
                items: { type: "number" },
                description: "Array of row heights in inches",
              },
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
              },
              x: {
                description: "X position in inches or percentage",
                oneOf: [{ type: "number" }, { type: "string" }],
              },
              y: {
                description: "Y position in inches or percentage",
                oneOf: [{ type: "number" }, { type: "string" }],
              },
              w: {
                description: "Width in inches or percentage",
                oneOf: [{ type: "number" }, { type: "string" }],
              },
              h: {
                description: "Height in inches or percentage",
                oneOf: [{ type: "number" }, { type: "string" }],
              },
              title: { type: "string", description: "Chart title" },
              showTitle: { type: "boolean", description: "Show title" },
              showLegend: { type: "boolean", description: "Show legend" },
              showLabel: { type: "boolean", description: "Show data labels" },
              showValue: { type: "boolean", description: "Show values on data points" },
            },
            required: ["presentationId", "type", "data"],
          },
        },
        {
          name: "import_markdown_presentation",
          description: "Create slides from Markdown input. Supports headings, paragraphs, lists (nested), images, code blocks, tables (basic), quotes, and horizontal rules.",
          inputSchema: {
            type: "object",
            properties: {
              presentationId: { type: "string", description: "Presentation ID" },
              markdown: { type: "string", description: "Markdown content" },
              options: {
                type: "object",
                description: "Import options and defaults",
              },
            },
            required: ["presentationId", "markdown"],
          },
        },
        {
          name: "save_presentation",
          description: "Save the presentation to a file or return as base64. For Smithery deployment, returns base64 encoded data.",
          inputSchema: {
            type: "object",
            properties: {
              presentationId: { type: "string", description: "Presentation ID" },
              fileName: {
                type: "string",
                description: "Output filename (should end with .pptx)",
              },
              compression: {
                type: "boolean",
                description: "Enable compression to reduce file size (can save up to 30%)",
              },
            },
            required: ["presentationId", "fileName"],
          },
        },
        {
          name: "list_presentations",
          description: "List all active presentations in memory.",
          inputSchema: {
            type: "object",
            properties: {},
          },
        },
      ],
    };
  });

  // Register call_tool handler
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: rawArgs } = request.params;

    if (!rawArgs) {
      throw new McpError(ErrorCode.InvalidParams, "Missing arguments");
    }

    const args = rawArgs as any;

    try {
      switch (name) {
        case "create_presentation": {
          const { pptx, id } = getPresentation(args.presentationId);
          
          if (args.title) pptx.title = args.title;
          if (args.author) pptx.author = args.author;
          if (args.subject) pptx.subject = args.subject;
          if (args.company) pptx.company = args.company;
          if (args.layout) pptx.layout = args.layout;
          if (args.rtlMode) pptx.rtlMode = args.rtlMode;

          return {
            content: [
              {
                type: "text",
                text: JSON.stringify({
                  success: true,
                  presentationId: id,
                  message: "Presentation created successfully",
                }),
              },
            ],
          };
        }

        case "add_slide": {
          const { pptx } = getPresentation(args.presentationId);
          const slideOptions: any = {};
          
          if (args.backgroundColor) slideOptions.bkgd = args.backgroundColor;
          if (args.backgroundImage?.path) slideOptions.bkgd = { path: args.backgroundImage.path };
          if (args.backgroundImage?.data) slideOptions.bkgd = { data: args.backgroundImage.data };

          const slide = pptx.addSlide();
          if (Object.keys(slideOptions).length > 0) {
            slide.background = slideOptions.bkgd;
          }

          return {
            content: [
              {
                type: "text",
                text: JSON.stringify({
                  success: true,
                  slideIndex: pptx.slides.length - 1,
                  message: "Slide added successfully",
                }),
              },
            ],
          };
        }

        case "add_text": {
          const { pptx } = getPresentation(args.presentationId);
          const currentSlide = pptx.slides[pptx.slides.length - 1];
          
          if (!currentSlide) {
            throw new McpError(ErrorCode.InvalidRequest, "No slides in presentation. Add a slide first.");
          }

          const textOptions: any = {};
          if (args.x !== undefined) textOptions.x = args.x;
          if (args.y !== undefined) textOptions.y = args.y;
          if (args.w !== undefined) textOptions.w = args.w;
          if (args.h !== undefined) textOptions.h = args.h;
          if (args.fontSize) textOptions.fontSize = args.fontSize;
          if (args.fontFace) textOptions.fontFace = args.fontFace;
          if (args.bold) textOptions.bold = args.bold;
          if (args.italic) textOptions.italic = args.italic;
          if (args.underline) textOptions.underline = args.underline;
          if (args.color) textOptions.color = args.color;
          if (args.align) textOptions.align = args.align;
          if (args.valign) textOptions.valign = args.valign;
          if (args.bullet !== undefined) textOptions.bullet = args.bullet;
          if (args.lineSpacing) textOptions.lineSpacing = args.lineSpacing;

          currentSlide.addText(args.text, textOptions);

          return {
            content: [
              {
                type: "text",
                text: JSON.stringify({
                  success: true,
                  message: "Text added to slide",
                }),
              },
            ],
          };
        }

        case "add_image": {
          const { pptx } = getPresentation(args.presentationId);
          const currentSlide = pptx.slides[pptx.slides.length - 1];
          
          if (!currentSlide) {
            throw new McpError(ErrorCode.InvalidRequest, "No slides in presentation. Add a slide first.");
          }

          const imageOptions: any = {};
          if (args.path) imageOptions.path = args.path;
          if (args.data) imageOptions.data = args.data;
          if (args.x !== undefined) imageOptions.x = args.x;
          if (args.y !== undefined) imageOptions.y = args.y;
          if (args.w !== undefined) imageOptions.w = args.w;
          if (args.h !== undefined) imageOptions.h = args.h;
          if (args.sizing) imageOptions.sizing = args.sizing;
          if (args.hyperlink) imageOptions.hyperlink = args.hyperlink;
          if (args.rounding) imageOptions.rounding = args.rounding;
          if (args.transparency) imageOptions.transparency = args.transparency;

          currentSlide.addImage(imageOptions);

          return {
            content: [
              {
                type: "text",
                text: JSON.stringify({
                  success: true,
                  message: "Image added to slide",
                }),
              },
            ],
          };
        }

        case "add_table": {
          const { pptx } = getPresentation(args.presentationId);
          const currentSlide = pptx.slides[pptx.slides.length - 1];
          
          if (!currentSlide) {
            throw new McpError(ErrorCode.InvalidRequest, "No slides in presentation. Add a slide first.");
          }

          const tableOptions: any = {};
          if (args.x !== undefined) tableOptions.x = args.x;
          if (args.y !== undefined) tableOptions.y = args.y;
          if (args.w !== undefined) tableOptions.w = args.w;
          if (args.h !== undefined) tableOptions.h = args.h;
          if (args.colW) tableOptions.colW = args.colW;
          if (args.rowH) tableOptions.rowH = args.rowH;

          currentSlide.addTable(args.rows, tableOptions);

          return {
            content: [
              {
                type: "text",
                text: JSON.stringify({
                  success: true,
                  message: "Table added to slide",
                }),
              },
            ],
          };
        }

        case "add_chart": {
          const { pptx } = getPresentation(args.presentationId);
          const currentSlide = pptx.slides[pptx.slides.length - 1];
          
          if (!currentSlide) {
            throw new McpError(ErrorCode.InvalidRequest, "No slides in presentation. Add a slide first.");
          }

          const chartOptions: any = { chartType: args.type };
          if (args.x !== undefined) chartOptions.x = args.x;
          if (args.y !== undefined) chartOptions.y = args.y;
          if (args.w !== undefined) chartOptions.w = args.w;
          if (args.h !== undefined) chartOptions.h = args.h;
          if (args.title) chartOptions.title = args.title;
          if (args.showTitle !== undefined) chartOptions.showTitle = args.showTitle;
          if (args.showLegend !== undefined) chartOptions.showLegend = args.showLegend;
          if (args.showLabel !== undefined) chartOptions.showLabel = args.showLabel;
          if (args.showValue !== undefined) chartOptions.showValue = args.showValue;

          currentSlide.addChart(args.type, args.data, chartOptions);

          return {
            content: [
              {
                type: "text",
                text: JSON.stringify({
                  success: true,
                  message: "Chart added to slide",
                }),
              },
            ],
          };
        }

        case "import_markdown_presentation": {
          const { pptx } = getPresentation(args.presentationId);
          await addSlidesFromMarkdown(pptx, args.markdown, args.options || {});

          return {
            content: [
              {
                type: "text",
                text: JSON.stringify({
                  success: true,
                  slideCount: pptx.slides.length,
                  message: "Markdown imported successfully",
                }),
              },
            ],
          };
        }

        case "save_presentation": {
          const { pptx } = getPresentation(args.presentationId);
          
          // For Smithery deployment, return as base64
          const outputType = "base64";
          const base64Data = await pptx.write({ outputType, compression: args.compression || false });

          return {
            content: [
              {
                type: "text",
                text: JSON.stringify({
                  success: true,
                  fileName: args.fileName,
                  format: "base64",
                  data: base64Data,
                  message: "Presentation saved as base64",
                }),
              },
            ],
          };
        }

        case "list_presentations": {
          const list = Array.from(presentations.keys());
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify({
                  presentations: list,
                  count: list.length,
                }),
              },
            ],
          };
        }

        default:
          throw new McpError(ErrorCode.MethodNotFound, `Unknown tool: ${name}`);
      }
    } catch (error: any) {
      if (error instanceof McpError) {
        throw error;
      }
      throw new McpError(
        ErrorCode.InternalError,
        `Error executing tool ${name}: ${error.message}`
      );
    }
  });

  return server;
}
