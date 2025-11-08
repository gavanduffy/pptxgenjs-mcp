/**
 * Tool definitions for Cloudflare Workers MCP Server
 * This file contains all the MCP tool schemas and handlers
 */

export const toolSchemas = [
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
        company: {
          type: "string",
          description: "Company name",
        },
        subject: {
          type: "string",
          description: "Presentation subject",
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
          description: "Enable bullet points",
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
          description: "Shape type (e.g., 'rect', 'ellipse', 'roundRect', 'triangle', 'rightArrow', 'star')",
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
          },
        },
      },
      required: ["presentationId", "shape"],
    },
  },
  {
    name: "add_image",
    description: "Add an image to the current slide. Supports URLs and base64 data.",
    inputSchema: {
      type: "object",
      properties: {
        presentationId: {
          type: "string",
          description: "Presentation ID",
        },
        path: {
          type: "string",
          description: "Image URL",
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
          description: "Array of rows, where each row is an array of cells",
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
      },
      required: ["presentationId", "rows"],
    },
  },
  {
    name: "add_chart",
    description: "Add a chart to the current slide. Supports bar, line, pie, area, and more chart types.",
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
          enum: ["bar", "bar3D", "line", "pie", "area", "scatter", "bubble", "doughnut", "radar"],
        },
        data: {
          type: "array",
          description: "Chart data series",
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
      },
      required: ["presentationId", "type", "data"],
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
];
