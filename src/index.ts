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

// SearXNG configuration
const SEARXNG_CONFIG = {
  baseUrl: "https://searchx.euan.live",
  imageSearchPath: "/search",
  defaultMaxResults: 10,
  timeout: 10000,
};

// Helper function to search images via SearXNG
async function searchImages(query: string, maxResults: number = SEARXNG_CONFIG.defaultMaxResults): Promise<Array<{ description: string; sourceUrl: string }>> {
  const url = new URL(SEARXNG_CONFIG.imageSearchPath, SEARXNG_CONFIG.baseUrl);
  url.searchParams.set('q', query);
  url.searchParams.set('format', 'json');
  url.searchParams.set('categories', 'images');

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), SEARXNG_CONFIG.timeout);

    const response = await fetch(url.toString(), {
      headers: {
        'Accept': 'application/json',
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`SearXNG API returned status ${response.status}`);
    }

    const data = await response.json();
    
    // Parse SearXNG response
    const results: Array<{ description: string; sourceUrl: string }> = [];
    
    if (data.results && Array.isArray(data.results)) {
      for (const item of data.results) {
        // Extract only title and url fields
        if (item.url && typeof item.url === 'string') {
          results.push({
            description: item.title || '',
            sourceUrl: item.url,
          });
          
          if (results.length >= maxResults) {
            break;
          }
        }
      }
    }

    return results;
  } catch (error: any) {
    if (error.name === 'AbortError') {
      throw new Error('Image search request timed out. Please try again.');
    }
    throw new Error(`Failed to search images: ${error.message}`);
  }
}

// Store slide masters
const slideMasters = new Map<string, any>();

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

// Helper function to parse HTML table
function parseHTMLTable(html: string): any[][] {
  // Simple HTML table parser - extracts text content and basic styling
  const rows: any[][] = [];
  
  // Remove extra whitespace and newlines
  html = html.replace(/\s+/g, ' ').trim();
  
  // Extract all rows (including thead and tbody)
  const rowMatches = html.matchAll(/<tr[^>]*>(.*?)<\/tr>/gi);
  
  for (const rowMatch of rowMatches) {
    const rowContent = rowMatch[1];
    const cells: any[] = [];
    
    // Match both th and td cells
    const cellMatches = rowContent.matchAll(/<(th|td)([^>]*)>(.*?)<\/\1>/gi);
    
    for (const cellMatch of cellMatches) {
      const cellTag = cellMatch[1];
      const cellAttrs = cellMatch[2];
      let cellContent = cellMatch[3];
      
      // Remove HTML tags from content but preserve text
      cellContent = cellContent.replace(/<[^>]+>/g, '').trim();
      
      // Parse attributes for styling
      const options: any = {};
      
      // Check for bold (th tags are bold by default)
      if (cellTag.toLowerCase() === 'th') {
        options.bold = true;
      }
      
      // Check for bold in content tags
      if (cellMatch[3].includes('<b>') || cellMatch[3].includes('<strong>')) {
        options.bold = true;
      }
      
      // Check for italic
      if (cellMatch[3].includes('<i>') || cellMatch[3].includes('<em>')) {
        options.italic = true;
      }
      
      // Parse colspan
      const colspanMatch = cellAttrs.match(/colspan=["']?(\d+)["']?/i);
      if (colspanMatch) {
        options.colspan = parseInt(colspanMatch[1]);
      }
      
      // Parse rowspan
      const rowspanMatch = cellAttrs.match(/rowspan=["']?(\d+)["']?/i);
      if (rowspanMatch) {
        options.rowspan = parseInt(rowspanMatch[1]);
      }
      
      // Parse text alignment
      const alignMatch = cellAttrs.match(/align=["']?(left|center|right)["']?/i);
      if (alignMatch) {
        options.align = alignMatch[1].toLowerCase();
      }
      
      // Parse background color from style or bgcolor attribute
      const bgcolorMatch = cellAttrs.match(/bgcolor=["']?#?([0-9a-f]{6})["']?/i);
      const styleMatch = cellAttrs.match(/background-color:\s*#?([0-9a-f]{6})/i);
      if (bgcolorMatch) {
        options.fill = bgcolorMatch[1].toUpperCase();
      } else if (styleMatch) {
        options.fill = styleMatch[1].toUpperCase();
      }
      
      // Parse text color
      const colorMatch = cellAttrs.match(/color:\s*#?([0-9a-f]{6})/i);
      if (colorMatch) {
        options.color = colorMatch[1].toUpperCase();
      }
      
      // If we have styling options, create an object; otherwise just use the text
      if (Object.keys(options).length > 0) {
        cells.push({ text: cellContent, options });
      } else {
        cells.push(cellContent);
      }
    }
    
    if (cells.length > 0) {
      rows.push(cells);
    }
  }
  
  return rows;
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
      {
        name: "search_and_add_image",
        description: "Search for images via SearXNG and optionally add them to a presentation slide. Returns image search results with descriptions and URLs. Can automatically add the first result to a slide when autoAdd is true.",
        inputSchema: {
          type: "object",
          properties: {
            query: {
              type: "string",
              description: "Search query for images (e.g., 'medieval castle architecture', 'Industrial Revolution factory')",
            },
            maxResults: {
              type: "number",
              description: "Maximum number of results to return (default: 10)",
              default: 10,
            },
            presentationId: {
              type: "string",
              description: "Optional: Presentation ID to add image to (required if autoAdd is true)",
            },
            slideIndex: {
              type: "number",
              description: "Optional: Target slide index for image placement (0-based, uses last slide if not provided)",
            },
            position: {
              type: "object",
              description: "Optional: Position and size of the image on the slide",
              properties: {
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
              },
            },
            autoAdd: {
              type: "boolean",
              description: "If true, automatically add the first search result to the specified slide",
              default: false,
            },
          },
          required: ["query"],
        },
      },
      {
        name: "import_html_table",
        description: "Import an HTML table and convert it to a PowerPoint table. Preserves basic styling including bold, italic, colors, alignment, colspan, and rowspan.",
        inputSchema: {
          type: "object",
          properties: {
            presentationId: {
              type: "string",
              description: "Presentation ID",
            },
            html: {
              type: "string",
              description: "HTML table markup (should include <table> tag)",
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
            fontSize: {
              type: "number",
              description: "Default font size for cells (can be overridden by inline styles)",
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
          required: ["presentationId", "html"],
        },
      },
      {
        name: "add_slide_with_content",
        description: "Add a new slide with content (text, shapes, images, tables, or charts) in a single operation. This is more efficient than calling add_slide followed by multiple content operations.",
        inputSchema: {
          type: "object",
          properties: {
            presentationId: {
              type: "string",
              description: "Presentation ID",
            },
            backgroundColor: {
              type: "string",
              description: "Slide background color as 6-digit hex",
            },
            backgroundImage: {
              type: "object",
              description: "Background image configuration",
              properties: {
                path: { type: "string" },
                data: { type: "string" },
              },
            },
            content: {
              type: "array",
              description: "Array of content items to add to the slide",
              items: {
                type: "object",
                properties: {
                  type: {
                    type: "string",
                    enum: ["text", "shape", "image", "table", "chart"],
                    description: "Type of content to add",
                  },
                  data: {
                    type: "object",
                    description: "Content-specific data (same as individual tool parameters)",
                  },
                },
                required: ["type", "data"],
              },
            },
          },
          required: ["presentationId"],
        },
      },
      {
        name: "define_slide_master",
        description: "Define a reusable slide master template with predefined layouts and styling. Once defined, it can be applied to new slides for consistent presentation design.",
        inputSchema: {
          type: "object",
          properties: {
            masterId: {
              type: "string",
              description: "Unique identifier for this slide master",
            },
            name: {
              type: "string",
              description: "Human-readable name for the master (e.g., 'Title Slide', 'Content Slide', 'Two Column')",
            },
            backgroundColor: {
              type: "string",
              description: "Default background color as 6-digit hex",
            },
            backgroundImage: {
              type: "object",
              description: "Default background image",
              properties: {
                path: { type: "string" },
                data: { type: "string" },
              },
            },
            placeholders: {
              type: "array",
              description: "Predefined placeholders for content",
              items: {
                type: "object",
                properties: {
                  id: {
                    type: "string",
                    description: "Placeholder identifier (e.g., 'title', 'content', 'subtitle')",
                  },
                  type: {
                    type: "string",
                    enum: ["text", "image", "shape"],
                    description: "Type of placeholder",
                  },
                  x: { type: ["number", "string"] },
                  y: { type: ["number", "string"] },
                  w: { type: ["number", "string"] },
                  h: { type: ["number", "string"] },
                  fontSize: { type: "number" },
                  fontFace: { type: "string" },
                  color: { type: "string" },
                  bold: { type: "boolean" },
                  italic: { type: "boolean" },
                  align: { type: "string", enum: ["left", "center", "right", "justify"] },
                  valign: { type: "string", enum: ["top", "middle", "bottom"] },
                },
                required: ["id", "type", "x", "y", "w", "h"],
              },
            },
          },
          required: ["masterId", "name"],
        },
      },
      {
        name: "add_slide_from_master",
        description: "Add a new slide based on a predefined slide master template. Content can be provided to fill the placeholders defined in the master.",
        inputSchema: {
          type: "object",
          properties: {
            presentationId: {
              type: "string",
              description: "Presentation ID",
            },
            masterId: {
              type: "string",
              description: "Slide master ID to apply",
            },
            placeholderContent: {
              type: "object",
              description: "Content to fill placeholders (keys are placeholder IDs from the master)",
              additionalProperties: {
                type: "object",
                properties: {
                  text: { type: "string" },
                  path: { type: "string" },
                  data: { type: "string" },
                },
              },
            },
          },
          required: ["presentationId", "masterId"],
        },
      },
      {
        name: "list_slide_masters",
        description: "List all defined slide masters.",
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

      case "search_and_add_image": {
        const { query, maxResults = 10, presentationId, slideIndex, position, autoAdd = false } = args as any;
        
        if (!query) {
          throw new McpError(ErrorCode.InvalidParams, "query is required");
        }

        // Search for images
        let results;
        try {
          results = await searchImages(query, maxResults);
        } catch (error: any) {
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify({
                  success: false,
                  error: error.message,
                  message: "Failed to search for images. Please check your network connection and try again.",
                }, null, 2),
              },
            ],
          };
        }

        // If no results found
        if (results.length === 0) {
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify({
                  success: true,
                  results: [],
                  message: `No images found for query: "${query}". Try a different search term.`,
                }, null, 2),
              },
            ],
          };
        }

        // If autoAdd is requested
        if (autoAdd) {
          if (!presentationId) {
            throw new McpError(ErrorCode.InvalidParams, "presentationId is required when autoAdd is true");
          }

          // Check if presentation exists
          if (!presentations.has(presentationId)) {
            throw new McpError(ErrorCode.InvalidParams, `Presentation '${presentationId}' not found`);
          }

          const { pptx } = getPresentation(presentationId);
          const slides = (pptx as any).slides;
          
          if (!slides || slides.length === 0) {
            throw new McpError(ErrorCode.InvalidParams, "No slides in presentation. Add a slide first.");
          }

          // Determine which slide to use
          let targetSlide;
          if (slideIndex !== undefined) {
            if (slideIndex < 0 || slideIndex >= slides.length) {
              throw new McpError(ErrorCode.InvalidParams, `Invalid slideIndex ${slideIndex}. Must be between 0 and ${slides.length - 1}`);
            }
            targetSlide = slides[slideIndex];
          } else {
            // Use last slide if no index provided
            targetSlide = slides[slides.length - 1];
          }

          // Get the first result to add
          const imageToAdd = results[0];
          
          // Build image options
          const imageOptions: any = {
            path: imageToAdd.sourceUrl,
          };

          // Add position if provided
          if (position) {
            if (position.x !== undefined) imageOptions.x = position.x;
            if (position.y !== undefined) imageOptions.y = position.y;
            if (position.w !== undefined) imageOptions.w = position.w;
            if (position.h !== undefined) imageOptions.h = position.h;
          }

          // Add image to slide
          try {
            targetSlide.addImage(imageOptions);
          } catch (error: any) {
            throw new McpError(ErrorCode.InternalError, `Failed to add image to slide: ${error.message}`);
          }

          return {
            content: [
              {
                type: "text",
                text: JSON.stringify({
                  success: true,
                  results,
                  addedToSlide: {
                    presentationId,
                    slideIndex: slideIndex !== undefined ? slideIndex : slides.length - 1,
                    imageUrl: imageToAdd.sourceUrl,
                    description: imageToAdd.description,
                  },
                  message: `Image added to slide successfully. Found ${results.length} total results.`,
                }, null, 2),
              },
            ],
          };
        }

        // Return search results only
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                success: true,
                results,
                message: `Found ${results.length} images for query: "${query}"`,
              }, null, 2),
            },
          ],
        };
      }

      case "import_html_table": {
        const { presentationId, html, ...options } = args as any;
        if (!presentationId || !html) {
          throw new McpError(ErrorCode.InvalidParams, "presentationId and html are required");
        }
        
        const { pptx } = getPresentation(presentationId);
        const slides = (pptx as any).slides;
        if (!slides || slides.length === 0) {
          throw new McpError(ErrorCode.InvalidParams, "No slides in presentation. Add a slide first.");
        }
        
        try {
          const rows = parseHTMLTable(html);
          
          if (rows.length === 0) {
            throw new Error("No valid table data found in HTML");
          }
          
          const currentSlide = slides[slides.length - 1];
          currentSlide.addTable(rows, options);
          
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify({
                  success: true,
                  message: `HTML table imported with ${rows.length} rows`,
                  presentationId,
                  rowCount: rows.length,
                  columnCount: rows[0]?.length || 0,
                }, null, 2),
              },
            ],
          };
        } catch (error: any) {
          throw new McpError(ErrorCode.InvalidParams, `Failed to parse HTML table: ${error.message}`);
        }
      }

      case "add_slide_with_content": {
        const { presentationId, backgroundColor, backgroundImage, content } = args as any;
        if (!presentationId) {
          throw new McpError(ErrorCode.InvalidParams, "presentationId is required");
        }
        
        const { pptx } = getPresentation(presentationId);
        
        // Add the slide
        const slideOptions: any = {};
        if (backgroundColor || backgroundImage) {
          const bg: any = {};
          if (backgroundColor) bg.color = backgroundColor;
          if (backgroundImage?.path) bg.path = backgroundImage.path;
          if (backgroundImage?.data) bg.data = backgroundImage.data;
          slideOptions.background = bg;
        }
        
        const slide = pptx.addSlide(slideOptions);
        
        // Add content items if provided
        let contentCount = 0;
        if (content && Array.isArray(content)) {
          for (const item of content) {
            const { type, data } = item;
            
            switch (type) {
              case "text":
                slide.addText(data.text, data);
                contentCount++;
                break;
              case "shape":
                const { shape, ...shapeOpts } = data;
                slide.addShape(shape, shapeOpts);
                contentCount++;
                break;
              case "image":
                slide.addImage(data);
                contentCount++;
                break;
              case "table":
                const { rows, ...tableOpts } = data;
                slide.addTable(rows, tableOpts);
                contentCount++;
                break;
              case "chart":
                const { chartType, chartData, ...chartOpts } = data;
                slide.addChart(chartType, chartData, chartOpts);
                contentCount++;
                break;
            }
          }
        }
        
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                success: true,
                message: `Slide added with ${contentCount} content items`,
                presentationId,
                contentCount,
              }, null, 2),
            },
          ],
        };
      }

      case "define_slide_master": {
        const { masterId, name, backgroundColor, backgroundImage, placeholders } = args as any;
        if (!masterId || !name) {
          throw new McpError(ErrorCode.InvalidParams, "masterId and name are required");
        }
        
        // Store the slide master definition
        const master = {
          id: masterId,
          name,
          backgroundColor,
          backgroundImage,
          placeholders: placeholders || [],
        };
        
        slideMasters.set(masterId, master);
        
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                success: true,
                message: `Slide master '${name}' defined with ID '${masterId}'`,
                masterId,
                placeholderCount: master.placeholders.length,
              }, null, 2),
            },
          ],
        };
      }

      case "add_slide_from_master": {
        const { presentationId, masterId, placeholderContent } = args as any;
        if (!presentationId || !masterId) {
          throw new McpError(ErrorCode.InvalidParams, "presentationId and masterId are required");
        }
        
        if (!slideMasters.has(masterId)) {
          throw new McpError(ErrorCode.InvalidParams, `Slide master '${masterId}' not found. Use define_slide_master first.`);
        }
        
        const { pptx } = getPresentation(presentationId);
        const master = slideMasters.get(masterId)!;
        
        // Add slide with master's background
        const slideOptions: any = {};
        if (master.backgroundColor || master.backgroundImage) {
          const bg: any = {};
          if (master.backgroundColor) bg.color = master.backgroundColor;
          if (master.backgroundImage?.path) bg.path = master.backgroundImage.path;
          if (master.backgroundImage?.data) bg.data = master.backgroundImage.data;
          slideOptions.background = bg;
        }
        
        const slide = pptx.addSlide(slideOptions);
        
        // Add content from placeholders
        let filledCount = 0;
        for (const placeholder of master.placeholders) {
          const content = placeholderContent?.[placeholder.id];
          
          if (placeholder.type === "text") {
            const textOptions: any = {
              x: placeholder.x,
              y: placeholder.y,
              w: placeholder.w,
              h: placeholder.h,
            };
            
            // Copy styling from placeholder
            if (placeholder.fontSize) textOptions.fontSize = placeholder.fontSize;
            if (placeholder.fontFace) textOptions.fontFace = placeholder.fontFace;
            if (placeholder.color) textOptions.color = placeholder.color;
            if (placeholder.bold !== undefined) textOptions.bold = placeholder.bold;
            if (placeholder.italic !== undefined) textOptions.italic = placeholder.italic;
            if (placeholder.align) textOptions.align = placeholder.align;
            if (placeholder.valign) textOptions.valign = placeholder.valign;
            
            // Use provided content or default placeholder text
            const text = content?.text || `[${placeholder.id}]`;
            slide.addText(text, textOptions);
            if (content?.text) filledCount++;
          } else if (placeholder.type === "image" && content) {
            const imageOptions: any = {
              x: placeholder.x,
              y: placeholder.y,
              w: placeholder.w,
              h: placeholder.h,
            };
            
            if (content.path) imageOptions.path = content.path;
            if (content.data) imageOptions.data = content.data;
            
            slide.addImage(imageOptions);
            filledCount++;
          }
        }
        
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                success: true,
                message: `Slide created from master '${master.name}' with ${filledCount} placeholders filled`,
                presentationId,
                masterId,
                masterName: master.name,
                filledPlaceholders: filledCount,
                totalPlaceholders: master.placeholders.length,
              }, null, 2),
            },
          ],
        };
      }

      case "list_slide_masters": {
        const masters = Array.from(slideMasters.entries()).map(([id, master]) => ({
          id,
          name: master.name,
          placeholderCount: master.placeholders.length,
          hasBackground: !!(master.backgroundColor || master.backgroundImage),
        }));
        
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                success: true,
                masters,
                count: masters.length,
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
