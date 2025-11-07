#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  McpError,
  ErrorCode,
} from "@modelcontextprotocol/sdk/types.js";
import { createRequire } from "module";
import { z } from "zod";

const require = createRequire(import.meta.url);
const PptxGenJS = require("pptxgenjs");

// Store active presentations in memory
const presentations = new Map<string, any>();
let presentationCounter = 0;

// Helper to get or create presentation
function getPresentation(presentationId?: string): { pptx: any; id: string } {
  if (presentationId && presentations.has(presentationId)) {
    return { pptx: presentations.get(presentationId)!, id: presentationId };
  }
  
  // Create new presentation
  const id = presentationId || `pres_${++presentationCounter}`;
  const pptx = new PptxGenJS();
  presentations.set(id, pptx);
  return { pptx, id };
}

// Validation schemas
const PositionSchema = z.object({
  x: z.union([z.number(), z.string()]).optional(),
  y: z.union([z.number(), z.string()]).optional(),
  w: z.union([z.number(), z.string()]).optional(),
  h: z.union([z.number(), z.string()]).optional(),
});

const ColorSchema = z.string().regex(/^[0-9A-Fa-f]{6}$/).optional();

const TextPropsSchema = z.object({
  text: z.string().optional(),
  options: z.object({
    fontSize: z.number().optional(),
    fontFace: z.string().optional(),
    color: ColorSchema,
    bold: z.boolean().optional(),
    italic: z.boolean().optional(),
    underline: z.union([z.boolean(), z.object({ style: z.string().optional() })]).optional(),
    align: z.enum(['left', 'center', 'right', 'justify']).optional(),
    valign: z.enum(['top', 'middle', 'bottom']).optional(),
  }).optional(),
});

// Create MCP server
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

// Define available tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      // Presentation Management
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
            author: {
              type: "string",
              description: "Presentation author name",
            },
            company: {
              type: "string",
              description: "Company name",
            },
            title: {
              type: "string",
              description: "Presentation title",
            },
            subject: {
              type: "string",
              description: "Presentation subject",
            },
            rtlMode: {
              type: "boolean",
              description: "Enable right-to-left mode",
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
            backgroundImage: {
              type: "object",
              description: "Background image configuration",
              properties: {
                path: {
                  type: "string",
                  description: "Image path (URL or local file path)",
                },
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
            fontFace: {
              type: "string",
              description: "Font family name (e.g., 'Arial', 'Calibri')",
            },
            color: {
              type: "string",
              description: "Text color as 6-digit hex (e.g., '000000')",
            },
            bold: {
              type: "boolean",
              description: "Bold text",
            },
            italic: {
              type: "boolean",
              description: "Italic text",
            },
            underline: {
              type: ["boolean", "object"],
              description: "Underline text. Can be true/false or object with style",
            },
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
              type: ["boolean", "object"],
              description: "Enable bullet points. Can be true/false or object with custom bullet options",
            },
            lineSpacing: {
              type: "number",
              description: "Line spacing (e.g., 1.5 for 1.5x spacing)",
            },
          },
          required: ["presentationId", "text"],
        },
      },
      {
        name: "add_shape",
        description: "Add a shape to the current slide. Supports rectangles, circles, arrows, flowchart elements, and many more.",
        inputSchema: {
          type: "object",
          properties: {
            presentationId: {
              type: "string",
              description: "Presentation ID",
            },
            shape: {
              type: "string",
              description: "Shape type (e.g., 'rect', 'ellipse', 'roundRect', 'triangle', 'rightArrow', 'leftArrow', 'upArrow', 'downArrow', 'star', 'heart', 'cloud', 'flowChartProcess', 'flowChartDecision'). See pptxgenjs.ShapeType for full list",
            },
            x: {
              type: ["number", "string"],
              description: "X position in inches or percentage",
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
            fill: {
              type: "object",
              description: "Fill configuration",
              properties: {
                color: {
                  type: "string",
                  description: "Fill color as 6-digit hex",
                },
                transparency: {
                  type: "number",
                  description: "Transparency percentage (0-100)",
                },
              },
            },
            line: {
              type: "object",
              description: "Line/border configuration",
              properties: {
                color: {
                  type: "string",
                  description: "Line color as 6-digit hex",
                },
                width: {
                  type: "number",
                  description: "Line width in points",
                },
                dashType: {
                  type: "string",
                  description: "Line dash type",
                  enum: ["solid", "dash", "dashDot", "lgDash", "lgDashDot", "lgDashDotDot", "sysDash", "sysDot"],
                },
              },
            },
          },
          required: ["presentationId", "shape"],
        },
      },
      {
        name: "add_image",
        description: "Add an image to the current slide. Supports URLs, local paths, and base64 data.",
        inputSchema: {
          type: "object",
          properties: {
            presentationId: {
              type: "string",
              description: "Presentation ID",
            },
            path: {
              type: "string",
              description: "Image path (URL or local file path)",
            },
            data: {
              type: "string",
              description: "Base64 encoded image data (e.g., 'image/png;base64,iVBOR...')",
            },
            x: {
              type: ["number", "string"],
              description: "X position in inches or percentage",
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
            sizing: {
              type: "object",
              description: "Image sizing options",
              properties: {
                type: {
                  type: "string",
                  description: "Sizing type",
                  enum: ["contain", "cover", "crop"],
                },
                w: {
                  type: "number",
                  description: "Target width",
                },
                h: {
                  type: "number",
                  description: "Target height",
                },
              },
            },
            hyperlink: {
              type: "object",
              description: "Add hyperlink to image",
              properties: {
                url: {
                  type: "string",
                  description: "Target URL",
                },
                tooltip: {
                  type: "string",
                  description: "Tooltip text",
                },
              },
            },
            rounding: {
              type: "boolean",
              description: "Round image corners",
            },
            transparency: {
              type: "number",
              description: "Image transparency (0-100)",
            },
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
            presentationId: {
              type: "string",
              description: "Presentation ID",
            },
            rows: {
              type: "array",
              description: "Array of rows, where each row is an array of cells. Each cell can be a string or an object with text and styling options",
              items: {
                type: "array",
                items: {
                  oneOf: [
                    { type: "string" },
                    {
                      type: "object",
                      properties: {
                        text: { type: "string" },
                        options: {
                          type: "object",
                          properties: {
                            fontSize: { type: "number" },
                            fontFace: { type: "string" },
                            color: { type: "string" },
                            bold: { type: "boolean" },
                            italic: { type: "boolean" },
                            align: { type: "string", enum: ["left", "center", "right"] },
                            valign: { type: "string", enum: ["top", "middle", "bottom"] },
                            fill: { type: "string" },
                            colspan: { type: "number" },
                            rowspan: { type: "number" },
                            border: {
                              type: "array",
                              items: {
                                type: "object",
                                properties: {
                                  type: { type: "string" },
                                  color: { type: "string" },
                                  pt: { type: "number" },
                                },
                              },
                            },
                          },
                        },
                      },
                    },
                  ],
                },
              },
            },
            x: {
              type: ["number", "string"],
              description: "X position in inches or percentage",
            },
            y: {
              type: ["number", "string"],
              description: "Y position in inches or percentage",
            },
            w: {
              type: ["number", "string"],
              description: "Table width in inches or percentage",
            },
            h: {
              type: ["number", "string"],
              description: "Table height in inches or percentage",
            },
            colW: {
              type: "array",
              description: "Array of column widths in inches",
              items: { type: "number" },
            },
            rowH: {
              type: "array",
              description: "Array of row heights in inches",
              items: { type: "number" },
            },
            fontSize: {
              type: "number",
              description: "Default font size for all cells",
            },
            fontFace: {
              type: "string",
              description: "Default font face for all cells",
            },
            color: {
              type: "string",
              description: "Default text color for all cells",
            },
            fill: {
              type: "string",
              description: "Default fill color for all cells",
            },
            border: {
              type: "array",
              description: "Default border for all cells",
              items: {
                type: "object",
                properties: {
                  type: { type: "string", enum: ["solid", "dash", "none"] },
                  color: { type: "string" },
                  pt: { type: "number" },
                },
              },
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
            presentationId: {
              type: "string",
              description: "Presentation ID",
            },
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
            x: {
              type: ["number", "string"],
              description: "X position in inches or percentage",
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
            title: {
              type: "string",
              description: "Chart title",
            },
            showLabel: {
              type: "boolean",
              description: "Show data labels",
            },
            showLegend: {
              type: "boolean",
              description: "Show legend",
            },
            showTitle: {
              type: "boolean",
              description: "Show title",
            },
            showValue: {
              type: "boolean",
              description: "Show values on data points",
            },
            legendPos: {
              type: "string",
              description: "Legend position",
              enum: ["b", "t", "l", "r", "tr"],
            },
            barDir: {
              type: "string",
              description: "Bar direction (for bar charts)",
              enum: ["bar", "col"],
            },
            barGrouping: {
              type: "string",
              description: "Bar grouping style",
              enum: ["clustered", "stacked", "percentStacked"],
            },
            catAxisTitle: {
              type: "string",
              description: "Category axis title",
            },
            valAxisTitle: {
              type: "string",
              description: "Value axis title",
            },
          },
          required: ["presentationId", "type", "data"],
        },
      },
      {
        name: "add_notes",
        description: "Add speaker notes to the current slide.",
        inputSchema: {
          type: "object",
          properties: {
            presentationId: {
              type: "string",
              description: "Presentation ID",
            },
            notes: {
              type: "string",
              description: "Speaker notes text",
            },
          },
          required: ["presentationId", "notes"],
        },
      },
      {
        name: "save_presentation",
        description: "Save the presentation to a file. The file will be saved in the current directory.",
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
            compression: {
              type: "boolean",
              description: "Enable compression to reduce file size (can save up to 30%)",
            },
          },
          required: ["presentationId", "fileName"],
        },
      },
      {
        name: "export_presentation",
        description: "Export the presentation as base64 string for transfer or storage.",
        inputSchema: {
          type: "object",
          properties: {
            presentationId: {
              type: "string",
              description: "Presentation ID",
            },
            outputType: {
              type: "string",
              description: "Output format type",
              enum: ["base64", "arraybuffer", "blob", "nodebuffer", "uint8array"],
              default: "base64",
            },
          },
          required: ["presentationId"],
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
      {
        name: "define_layout",
        description: "Define a custom slide layout with specific dimensions.",
        inputSchema: {
          type: "object",
          properties: {
            presentationId: {
              type: "string",
              description: "Presentation ID",
            },
            name: {
              type: "string",
              description: "Layout name (e.g., 'A4', 'CUSTOM')",
            },
            width: {
              type: "number",
              description: "Width in inches",
            },
            height: {
              type: "number",
              description: "Height in inches",
            },
          },
          required: ["presentationId", "name", "width", "height"],
        },
      },
      {
        name: "add_section",
        description: "Add a named section to organize slides.",
        inputSchema: {
          type: "object",
          properties: {
            presentationId: {
              type: "string",
              description: "Presentation ID",
            },
            title: {
              type: "string",
              description: "Section title",
            },
          },
          required: ["presentationId", "title"],
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
        const { presentationId, layout, author, company, title, subject, rtlMode } = args as any;
        const { pptx, id } = getPresentation(presentationId);
        
        if (layout) pptx.layout = layout;
        if (author) pptx.author = author;
        if (company) pptx.company = company;
        if (title) pptx.title = title;
        if (subject) pptx.subject = subject;
        if (rtlMode !== undefined) pptx.rtlMode = rtlMode;

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
                  author: pptx.author,
                  company: pptx.company,
                  title: pptx.title,
                },
              }, null, 2),
            },
          ],
        };
      }

      case "add_slide": {
        const { presentationId, backgroundColor, backgroundImage } = args as any;
        if (!presentationId) {
          throw new McpError(ErrorCode.InvalidParams, "presentationId is required");
        }
        
        const { pptx } = getPresentation(presentationId);
        const slideOptions: any = {};
        
        if (backgroundColor || backgroundImage) {
          const bg: any = {};
          if (backgroundColor) {
            bg.color = backgroundColor;
          }
          if (backgroundImage?.path) {
            bg.path = backgroundImage.path;
          }
          if (backgroundImage?.data) {
            bg.data = backgroundImage.data;
          }
          slideOptions.background = bg;
        }
        
        const slide = pptx.addSlide(slideOptions);
        
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

      case "add_shape": {
        const { presentationId, shape, ...options } = args as any;
        if (!presentationId) {
          throw new McpError(ErrorCode.InvalidParams, "presentationId is required");
        }
        
        const { pptx } = getPresentation(presentationId);
        const slides = (pptx as any).slides;
        if (!slides || slides.length === 0) {
          throw new McpError(ErrorCode.InvalidParams, "No slides in presentation. Add a slide first.");
        }
        
        const currentSlide = slides[slides.length - 1];
        currentSlide.addShape(shape, options);
        
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                success: true,
                message: `Shape '${shape}' added to slide`,
                presentationId,
              }, null, 2),
            },
          ],
        };
      }

      case "add_image": {
        const { presentationId, ...options } = args as any;
        if (!presentationId) {
          throw new McpError(ErrorCode.InvalidParams, "presentationId is required");
        }
        
        const { pptx } = getPresentation(presentationId);
        const slides = (pptx as any).slides;
        if (!slides || slides.length === 0) {
          throw new McpError(ErrorCode.InvalidParams, "No slides in presentation. Add a slide first.");
        }
        
        const currentSlide = slides[slides.length - 1];
        currentSlide.addImage(options);
        
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
        const { presentationId, rows, ...options } = args as any;
        if (!presentationId) {
          throw new McpError(ErrorCode.InvalidParams, "presentationId is required");
        }
        
        const { pptx } = getPresentation(presentationId);
        const slides = (pptx as any).slides;
        if (!slides || slides.length === 0) {
          throw new McpError(ErrorCode.InvalidParams, "No slides in presentation. Add a slide first.");
        }
        
        const currentSlide = slides[slides.length - 1];
        currentSlide.addTable(rows, options);
        
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                success: true,
                message: `Table with ${rows.length} rows added to slide`,
                presentationId,
              }, null, 2),
            },
          ],
        };
      }

      case "add_chart": {
        const { presentationId, type, data, ...options } = args as any;
        if (!presentationId) {
          throw new McpError(ErrorCode.InvalidParams, "presentationId is required");
        }
        
        const { pptx } = getPresentation(presentationId);
        const slides = (pptx as any).slides;
        if (!slides || slides.length === 0) {
          throw new McpError(ErrorCode.InvalidParams, "No slides in presentation. Add a slide first.");
        }
        
        const currentSlide = slides[slides.length - 1];
        currentSlide.addChart(type, data, options);
        
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                success: true,
                message: `${type} chart added to slide`,
                presentationId,
              }, null, 2),
            },
          ],
        };
      }

      case "add_notes": {
        const { presentationId, notes } = args as any;
        if (!presentationId) {
          throw new McpError(ErrorCode.InvalidParams, "presentationId is required");
        }
        
        const { pptx } = getPresentation(presentationId);
        const slides = (pptx as any).slides;
        if (!slides || slides.length === 0) {
          throw new McpError(ErrorCode.InvalidParams, "No slides in presentation. Add a slide first.");
        }
        
        const currentSlide = slides[slides.length - 1];
        currentSlide.addNotes(notes);
        
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                success: true,
                message: "Notes added to slide",
                presentationId,
              }, null, 2),
            },
          ],
        };
      }

      case "save_presentation": {
        const { presentationId, fileName, compression } = args as any;
        if (!presentationId || !fileName) {
          throw new McpError(ErrorCode.InvalidParams, "presentationId and fileName are required");
        }
        
        const { pptx } = getPresentation(presentationId);
        await pptx.writeFile({ fileName, compression: compression || false });
        
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                success: true,
                message: `Presentation saved to ${fileName}`,
                presentationId,
                fileName,
              }, null, 2),
            },
          ],
        };
      }

      case "export_presentation": {
        const { presentationId, outputType = "base64" } = args as any;
        if (!presentationId) {
          throw new McpError(ErrorCode.InvalidParams, "presentationId is required");
        }
        
        const { pptx } = getPresentation(presentationId);
        const output = await pptx.write({ outputType: outputType as any });
        
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                success: true,
                message: `Presentation exported as ${outputType}`,
                presentationId,
                outputType,
                data: typeof output === 'string' ? output.substring(0, 100) + '...' : '[Binary Data]',
                size: typeof output === 'string' ? output.length : output.byteLength || 0,
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
            author: pptx.author,
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

      case "define_layout": {
        const { presentationId, name, width, height } = args as any;
        if (!presentationId || !name || !width || !height) {
          throw new McpError(ErrorCode.InvalidParams, "presentationId, name, width, and height are required");
        }
        
        const { pptx } = getPresentation(presentationId);
        pptx.defineLayout({ name, width, height });
        pptx.layout = name;
        
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                success: true,
                message: `Custom layout '${name}' defined (${width}" x ${height}")`,
                presentationId,
                layout: { name, width, height },
              }, null, 2),
            },
          ],
        };
      }

      case "add_section": {
        const { presentationId, title } = args as any;
        if (!presentationId || !title) {
          throw new McpError(ErrorCode.InvalidParams, "presentationId and title are required");
        }
        
        const { pptx } = getPresentation(presentationId);
        pptx.addSection({ title });
        
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                success: true,
                message: `Section '${title}' added`,
                presentationId,
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

// Start the server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("PptxGenJS MCP Server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error in main():", error);
  process.exit(1);
});
