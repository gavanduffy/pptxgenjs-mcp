# PptxGenJS MCP Server

A Model Context Protocol (MCP) server that provides comprehensive PowerPoint presentation creation capabilities using [PptxGenJS](https://gitbrent.github.io/PptxGenJS/). This server exposes the entire feature set of PptxGenJS through an LLM-friendly interface.

## Features

This MCP server provides tools for:

- **Presentation Management**: Create presentations with custom layouts, metadata, and properties
- **Slide Operations**: Add slides with backgrounds, sections, and custom layouts
- **Text Content**: Add formatted text with rich styling options (fonts, colors, alignment, bullets, etc.)
- **Shapes**: Insert various shapes including rectangles, circles, arrows, flowchart elements, and more
- **Images**: Add images from URLs, local paths, or base64 data
- **Image Search**: Search for images via SearXNG and automatically add them to slides
- **Tables**: Create formatted tables with custom styling, borders, and cell properties
- **HTML Table Import**: Import HTML tables and convert them to PowerPoint tables with styling preservation
- **Charts**: Generate various chart types (bar, line, pie, area, scatter, bubble, radar, doughnut)
- **Speaker Notes**: Add presenter notes to slides
- **Batch Operations**: Add slides with multiple content items in a single operation for efficiency
- **Slide Master Templates**: Define and reuse slide templates for consistent presentation design
- **PPTX Templates**: Convert existing PPTX files to JSON templates and create new presentations from them with dynamic content replacement
- **Export**: Save presentations to files or export as base64/binary data

## Installation

```bash
npm install
npm run build
```

## Usage

### With Claude Desktop

Add this to your Claude Desktop configuration file:

**MacOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
**Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "pptxgenjs": {
      "command": "node",
      "args": ["/path/to/pptxgenjs-mcp/dist/index.js"]
    }
  }
}
```

### With MCP Client

```javascript
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

const transport = new StdioClientTransport({
  command: "node",
  args: ["/path/to/pptxgenjs-mcp/dist/index.js"]
});

const client = new Client({
  name: "example-client",
  version: "1.0.0"
}, {
  capabilities: {}
});

await client.connect(transport);
```

## Available Tools

### Presentation Management

#### `create_presentation`
Create a new PowerPoint presentation.

**Parameters:**
- `presentationId` (optional): Custom ID for the presentation
- `layout` (optional): Layout type ('LAYOUT_4x3', 'LAYOUT_16x9', 'LAYOUT_16x10', 'LAYOUT_WIDE')
- `author` (optional): Author name
- `company` (optional): Company name
- `title` (optional): Presentation title
- `subject` (optional): Presentation subject
- `rtlMode` (optional): Enable right-to-left mode

**Returns:** Presentation ID for use in subsequent operations

#### `list_presentations`
List all active presentations in memory.

#### `define_layout`
Create a custom slide layout with specific dimensions.

**Parameters:**
- `presentationId`: Presentation ID
- `name`: Layout name (e.g., 'A4')
- `width`: Width in inches
- `height`: Height in inches

### Slide Operations

#### `add_slide`
Add a new slide to the presentation.

**Parameters:**
- `presentationId`: Presentation ID
- `backgroundColor` (optional): 6-digit hex color (e.g., 'FF0000')
- `backgroundImage` (optional): Image path or base64 data

#### `add_section`
Add a named section to organize slides.

**Parameters:**
- `presentationId`: Presentation ID
- `title`: Section title

### Content Tools

#### `add_text`
Add text to the current slide with rich formatting.

**Parameters:**
- `presentationId`: Presentation ID
- `text`: Text content (string or array of text objects)
- `x`, `y`, `w`, `h`: Position and size (inches or percentage)
- `fontSize`: Font size in points
- `fontFace`: Font family name
- `color`: Text color (6-digit hex)
- `bold`, `italic`, `underline`: Text styling
- `align`: Horizontal alignment ('left', 'center', 'right', 'justify')
- `valign`: Vertical alignment ('top', 'middle', 'bottom')
- `bullet`: Enable bullet points
- `lineSpacing`: Line spacing multiplier

#### `add_shape`
Add a shape to the current slide.

**Parameters:**
- `presentationId`: Presentation ID
- `shape`: Shape type (e.g., 'rect', 'ellipse', 'roundRect', 'triangle', 'rightArrow', 'star')
- `x`, `y`, `w`, `h`: Position and size
- `fill`: Fill configuration (color, transparency)
- `line`: Border configuration (color, width, dashType)

**Supported shapes include:**
- Basic: rectangle, ellipse, triangle, diamond, star, heart, cloud
- Arrows: rightArrow, leftArrow, upArrow, downArrow, bentArrow
- Flowchart: flowChartProcess, flowChartDecision, flowChartDocument, etc.
- And many more...

#### `add_image`
Add an image to the current slide.

**Parameters:**
- `presentationId`: Presentation ID
- `path` or `data`: Image source (URL, local path, or base64)
- `x`, `y`, `w`, `h`: Position and size
- `sizing`: Sizing options (contain, cover, crop)
- `hyperlink`: Add clickable link
- `rounding`: Round corners
- `transparency`: Image transparency (0-100)

#### `search_and_add_image`
Search for images via SearXNG and optionally add them to a presentation slide.

**Parameters:**
- `query`: Search query for images (e.g., 'medieval castle architecture', 'Industrial Revolution factory')
- `maxResults` (optional): Maximum number of results to return (default: 10)
- `presentationId` (optional): Presentation ID to add image to (required if autoAdd is true)
- `slideIndex` (optional): Target slide index for image placement (0-based, uses last slide if not provided)
- `position` (optional): Position and size object with properties:
  - `x`, `y`: Position in inches or percentage
  - `w`, `h`: Width and height in inches or percentage
- `autoAdd` (optional): If true, automatically add the first search result to the specified slide (default: false)

**Returns:**
- `results`: Array of image search results with `description` and `sourceUrl`
- `addedToSlide` (when autoAdd is true): Information about the added image including `presentationId`, `slideIndex`, `imageUrl`, and `description`

**Examples:**

Search only:
```javascript
await callTool("search_and_add_image", {
  query: "medieval castle architecture",
  maxResults: 5
});
```

Search and auto-add:
```javascript
await callTool("search_and_add_image", {
  query: "Industrial Revolution factory",
  presentationId: "pres_123",
  slideIndex: 2,
  position: { x: 5, y: 2, w: 4, h: 3 },
  autoAdd: true
});
```

#### `add_table`
Add a table with customizable styling.

**Parameters:**
- `presentationId`: Presentation ID
- `rows`: Array of rows (each row is array of cells)
- `x`, `y`, `w`, `h`: Position and size
- `colW`: Column widths array
- `rowH`: Row heights array
- `fontSize`, `fontFace`, `color`: Default text styling
- `fill`: Default cell background color
- `border`: Default cell borders

Each cell can be:
- A simple string
- An object with `text` and `options` for individual cell styling

#### `add_chart`
Add a chart to the current slide.

**Parameters:**
- `presentationId`: Presentation ID
- `type`: Chart type ('bar', 'bar3D', 'line', 'pie', 'area', 'scatter', 'bubble', 'radar', 'doughnut')
- `data`: Array of data series (each with name, labels, values)
- `x`, `y`, `w`, `h`: Position and size
- `title`: Chart title
- `showLabel`, `showLegend`, `showTitle`, `showValue`: Display options
- `legendPos`: Legend position ('b', 't', 'l', 'r', 'tr')
- `barDir`: Bar direction ('bar', 'col')
- `barGrouping`: Grouping style ('clustered', 'stacked', 'percentStacked')
- `catAxisTitle`, `valAxisTitle`: Axis titles

#### `add_notes`
Add speaker notes to the current slide.

**Parameters:**
- `presentationId`: Presentation ID
- `notes`: Notes text

### Advanced Tools

#### `import_html_table`
Import an HTML table and convert it to a PowerPoint table. Automatically preserves styling including bold, italic, colors, alignment, colspan, and rowspan.

**Parameters:**
- `presentationId`: Presentation ID
- `html`: HTML table markup (should include `<table>` tag)
- `x`, `y`, `w`, `h`: Position and size (inches or percentage)
- `fontSize` (optional): Default font size for cells
- `border` (optional): Default border configuration

**Example:**
```javascript
await callTool("import_html_table", {
  presentationId: "pres_1",
  html: `<table>
    <tr>
      <th bgcolor="#2C3E50">Header</th>
      <td>Data</td>
    </tr>
  </table>`,
  x: 1,
  y: 1.5,
  w: 8,
  h: 3
});
```

#### `add_slide_with_content`
Add a new slide with multiple content items (text, shapes, images, tables, charts) in a single operation. More efficient than multiple separate calls.

**Parameters:**
- `presentationId`: Presentation ID
- `backgroundColor` (optional): Slide background color
- `backgroundImage` (optional): Background image configuration
- `content`: Array of content items, each with `type` ('text', 'shape', 'image', 'table', 'chart') and `data` (same parameters as individual tools)

**Example:**
```javascript
await callTool("add_slide_with_content", {
  presentationId: "pres_1",
  backgroundColor: "F8F9FA",
  content: [
    {
      type: "text",
      data: { text: "Title", x: 1, y: 0.5, w: 8, h: 0.75, fontSize: 32, bold: true }
    },
    {
      type: "shape",
      data: { shape: "ellipse", x: 2, y: 2, w: 2, h: 2, fill: { color: "3498DB" } }
    }
  ]
});
```

#### `define_slide_master`
Define a reusable slide master template with predefined layouts and styling for consistent presentation design.

**Parameters:**
- `masterId`: Unique identifier for the slide master
- `name`: Human-readable name (e.g., 'Title Slide', 'Content Slide')
- `backgroundColor` (optional): Default background color
- `backgroundImage` (optional): Default background image
- `placeholders`: Array of placeholder definitions with `id`, `type`, position, and styling

**Example:**
```javascript
await callTool("define_slide_master", {
  masterId: "title-slide",
  name: "Title Slide",
  backgroundColor: "1A1A2E",
  placeholders: [
    {
      id: "title",
      type: "text",
      x: 1, y: 2, w: 8, h: 1.5,
      fontSize: 44, bold: true, align: "center", color: "FFFFFF"
    }
  ]
});
```

#### `add_slide_from_master`
Add a new slide based on a predefined slide master template.

**Parameters:**
- `presentationId`: Presentation ID
- `masterId`: Slide master ID to apply
- `placeholderContent` (optional): Object with placeholder IDs as keys and content as values

**Example:**
```javascript
await callTool("add_slide_from_master", {
  presentationId: "pres_1",
  masterId: "title-slide",
  placeholderContent: {
    title: { text: "My Presentation Title" }
  }
});
```

#### `list_slide_masters`
List all defined slide masters.

**Returns:** Array of slide masters with their IDs, names, and placeholder counts.

### Template Tools

The template system allows you to convert existing PPTX presentations into reusable JSON templates. These templates preserve the layout, styling, and structure of the original presentation while allowing dynamic content replacement when creating new presentations.

#### `convert_pptx_to_template`
Convert an existing PPTX file to a JSON template format.

**Parameters:**
- `filePath`: Path to the PPTX file to convert

**Returns:** JSON template data with slide structure and elements

**Example:**
```javascript
const result = await callTool("convert_pptx_to_template", {
  filePath: "/path/to/template.pptx"
});
// Returns templateData that can be saved
```

#### `save_template`
Save a JSON template with metadata for later use.

**Parameters:**
- `templateData`: JSON template data (from convert_pptx_to_template or custom)
- `templateId` (optional): Custom ID for the template (auto-generated if not provided)
- `name` (optional): Human-readable name for the template
- `description` (optional): Description of what the template is for

**Returns:** Template ID and metadata

**Example:**
```javascript
await callTool("save_template", {
  templateId: "quarterly-report",
  templateData: convertedData,
  name: "Quarterly Report Template",
  description: "Standard template for quarterly business reports"
});
```

#### `list_templates`
List all saved templates with their metadata.

**Returns:** Array of templates with IDs, names, descriptions, slide counts, and creation dates

**Example:**
```javascript
const result = await callTool("list_templates", {});
// Returns: { templates: [...], count: N }
```

#### `load_template`
Load a saved template by its ID to inspect or modify it.

**Parameters:**
- `templateId`: ID of the template to load

**Returns:** Complete template object with data and metadata

#### `delete_template`
Delete a saved template by its ID.

**Parameters:**
- `templateId`: ID of the template to delete

#### `create_from_template`
Create a new presentation from a saved template with optional content replacement.

**Parameters:**
- `templateId`: ID of the template to use
- `contentMapping` (optional): Object mapping element identifiers to replacement content

**Content Mapping Format:**
The `contentMapping` object allows you to replace content in template elements. Keys can be:
- Element positions: `"slide_0_element_1"` (slide index, element index)
- Element names: The name of the element in the original presentation

Values are objects with properties based on element type:
- **Text/Shape elements**: `{ text: "New text content" }`
- **Image elements**: `{ path: "url/or/path" }` or `{ data: "base64..." }`
- **Table elements**: `{ rows: [[...]] }`
- **Chart elements**: `{ chartType: "bar", data: [...] }`

**Returns:** New presentation ID

**Example:**
```javascript
await callTool("create_from_template", {
  templateId: "quarterly-report",
  contentMapping: {
    "slide_0_element_0": { text: "Q1 2025 Report" },
    "slide_1_element_2": { text: "Revenue: $52.8M" },
    "Company Logo": { path: "https://example.com/logo.png" },
  }
});
```

**Complete Workflow Example:**
```javascript
// 1. Create and save a template presentation
const pres = await callTool("create_presentation", { layout: "LAYOUT_16x9" });
// ... add slides and content ...
await callTool("save_presentation", {
  presentationId: pres.presentationId,
  fileName: "template.pptx"
});

// 2. Convert to template
const converted = await callTool("convert_pptx_to_template", {
  filePath: "template.pptx"
});

// 3. Save as reusable template
await callTool("save_template", {
  templateId: "my-template",
  templateData: converted.templateData,
  name: "My Template"
});

// 4. Create presentations from template
await callTool("create_from_template", {
  templateId: "my-template",
  contentMapping: {
    "slide_0_element_0": { text: "Custom Title" }
  }
});
```

### Export Tools

#### `save_presentation`
Save the presentation to a file.

**Parameters:**
- `presentationId`: Presentation ID
- `fileName`: Output filename (should end with .pptx)
- `compression` (optional): Enable compression to reduce file size

#### `export_presentation`
Export presentation as base64 or other format.

**Parameters:**
- `presentationId`: Presentation ID
- `outputType`: Format type ('base64', 'arraybuffer', 'blob', 'nodebuffer', 'uint8array')

## Example Usage

Here's an example workflow for creating a presentation:

```javascript
// 1. Create a presentation
const createResult = await callTool("create_presentation", {
  layout: "LAYOUT_16x9",
  title: "My Presentation",
  author: "John Doe"
});
const presentationId = createResult.presentationId;

// 2. Add a title slide
await callTool("add_slide", { presentationId });
await callTool("add_text", {
  presentationId,
  text: "Welcome to My Presentation",
  x: 1,
  y: 2,
  w: 8,
  h: 1.5,
  fontSize: 44,
  bold: true,
  align: "center"
});

// 3. Add a content slide with bullet points
await callTool("add_slide", { 
  presentationId,
  backgroundColor: "F0F0F0"
});
await callTool("add_text", {
  presentationId,
  text: "Key Points",
  x: 0.5,
  y: 0.5,
  w: 9,
  h: 0.75,
  fontSize: 32,
  bold: true
});
await callTool("add_text", {
  presentationId,
  text: "First point\nSecond point\nThird point",
  x: 0.5,
  y: 1.5,
  w: 9,
  h: 3,
  fontSize: 20,
  bullet: true
});

// 4. Add a chart slide
await callTool("add_slide", { presentationId });
await callTool("add_chart", {
  presentationId,
  type: "bar",
  data: [
    {
      name: "Sales",
      labels: ["Q1", "Q2", "Q3", "Q4"],
      values: [15, 28, 35, 42]
    }
  ],
  x: 1,
  y: 1.5,
  w: 8,
  h: 4,
  title: "Quarterly Sales",
  showLegend: true
});

// 5. Add a slide with an image from search
await callTool("add_slide", { presentationId });
await callTool("add_text", {
  presentationId,
  text: "Historical Context",
  x: 0.5,
  y: 0.5,
  w: 9,
  h: 0.75,
  fontSize: 32,
  bold: true
});
// Search and add an image automatically
await callTool("search_and_add_image", {
  query: "industrial revolution historical photo",
  presentationId,
  maxResults: 5,
  position: { x: 1.5, y: 1.5, w: 7, h: 4 },
  autoAdd: true
});

// 6. Save the presentation
await callTool("save_presentation", {
  presentationId,
  fileName: "output.pptx",
  compression: true
});
```

## Development

```bash
# Build the project
npm run build

# Watch mode for development
npm run watch

# Start the server
npm start

# Test template features
node test-templates.cjs
```

The `test-templates.cjs` script demonstrates the complete template workflow:
1. Creating a sample presentation
2. Saving it as a PPTX file
3. Converting the PPTX to a JSON template
4. Saving the template for reuse
5. Creating multiple presentations from the template with different content
6. Managing and inspecting templates

## License

ISC

## Credits

This MCP server uses:
- [PptxGenJS](https://gitbrent.github.io/PptxGenJS/) for PowerPoint generation capabilities
- [pptxtojson](https://github.com/pipipi-pikachu/pptxtojson) for converting PPTX files to JSON templates