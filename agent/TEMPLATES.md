# PPTX Template Feature

The template feature allows you to convert existing PowerPoint presentations into reusable JSON templates. These templates can then be used to generate new presentations with dynamic content, maintaining the original layout and styling.

## Overview

The template system is built on top of [pptxtojson](https://github.com/pipipi-pikachu/pptxtojson), which converts PPTX files into structured JSON data. This enables:

- **Template Reusability**: Convert any PPTX file once and use it multiple times
- **Content Replacement**: Replace text, images, tables, and charts dynamically
- **Layout Preservation**: Maintain the original design, styling, and structure
- **Batch Generation**: Create multiple presentations from a single template efficiently

## Workflow

### 1. Create or Obtain a Template PPTX

Start with an existing PowerPoint presentation that will serve as your template. This can be:
- A presentation created with this MCP server
- Any existing PPTX file from PowerPoint or other tools

### 2. Convert PPTX to JSON Template

```javascript
const result = await callTool("convert_pptx_to_template", {
  filePath: "/path/to/template.pptx"
});

const templateData = result.templateData;
```

This converts the PPTX file into a JSON structure containing:
- Slide layouts and backgrounds
- Text elements with formatting
- Shapes and their properties
- Images and media
- Tables and charts
- Speaker notes

### 3. Save the Template

```javascript
await callTool("save_template", {
  templateId: "quarterly-report",
  templateData: templateData,
  name: "Quarterly Report Template",
  description: "Standard template for quarterly business reports"
});
```

Templates are stored in memory with metadata for easy retrieval.

### 4. Create Presentations from Template

```javascript
await callTool("create_from_template", {
  templateId: "quarterly-report",
  contentMapping: {
    "slide_0_element_0": { text: "Q1 2025 Results" },
    "slide_1_element_2": { text: "Revenue: $45.2M" },
    "slide_2_element_1": { text: "Record breaking quarter" }
  }
});
```

## Content Mapping

The `contentMapping` parameter allows you to replace content in specific elements. The key identifies the element, and the value specifies the replacement content.

### Element Identifiers

You can identify elements in two ways:

1. **Position-based**: `"slide_X_element_Y"` format
   - `X` is the slide index (0-based)
   - `Y` is the element index on that slide (0-based)
   - Example: `"slide_0_element_1"` refers to the second element on the first slide

2. **Name-based**: Use the element's name from the original presentation
   - Example: `"Company Logo"`, `"Title Text"`, `"Revenue Chart"`

### Replacement Content by Element Type

#### Text Elements
```javascript
{
  "slide_0_element_0": {
    text: "New text content\nWith multiple lines"
  }
}
```

#### Shape Elements (with text)
```javascript
{
  "slide_1_element_2": {
    text: "Shape text content"
  }
}
```

#### Image Elements
```javascript
{
  "Company Logo": {
    path: "https://example.com/new-logo.png"
    // or
    data: "image/png;base64,iVBORw0KGg..."
  }
}
```

#### Table Elements
```javascript
{
  "slide_2_element_0": {
    rows: [
      ["Header 1", "Header 2", "Header 3"],
      ["Data 1", "Data 2", "Data 3"],
      ["Data 4", "Data 5", "Data 6"]
    ]
  }
}
```

#### Chart Elements
```javascript
{
  "Revenue Chart": {
    chartType: "bar",
    data: [
      {
        name: "Sales",
        labels: ["Q1", "Q2", "Q3", "Q4"],
        values: [15, 28, 35, 42]
      }
    ]
  }
}
```

## Template Management

### List All Templates

```javascript
const result = await callTool("list_templates", {});
console.log(result.templates);
```

Returns an array of templates with:
- `id`: Template identifier
- `name`: Human-readable name
- `description`: Template description
- `slideCount`: Number of slides in template
- `createdAt`: Creation timestamp

### Load a Template

```javascript
const result = await callTool("load_template", {
  templateId: "quarterly-report"
});
console.log(result.template);
```

Returns the complete template object including all data and metadata.

### Delete a Template

```javascript
await callTool("delete_template", {
  templateId: "quarterly-report"
});
```

Removes the template from storage.

## Complete Example

Here's a complete workflow demonstrating the template system:

```javascript
// Step 1: Create a template presentation
const createResult = await callTool("create_presentation", {
  layout: "LAYOUT_16x9",
  title: "Company Template"
});
const presentationId = createResult.presentationId;

// Add slides with content
await callTool("add_slide", { presentationId, backgroundColor: "1A1A2E" });
await callTool("add_text", {
  presentationId,
  text: "{{TITLE}}",
  x: 1, y: 2, w: 8, h: 1.5,
  fontSize: 44, bold: true, align: "center", color: "FFFFFF"
});

await callTool("add_slide", { presentationId, backgroundColor: "F8F9FA" });
await callTool("add_text", {
  presentationId,
  text: "{{CONTENT}}",
  x: 0.5, y: 1, w: 9, h: 4,
  fontSize: 20, color: "2C3E50"
});

// Step 2: Save as PPTX
await callTool("save_presentation", {
  presentationId,
  fileName: "company-template.pptx"
});

// Step 3: Convert to JSON template
const convertResult = await callTool("convert_pptx_to_template", {
  filePath: "company-template.pptx"
});

// Step 4: Save template
await callTool("save_template", {
  templateId: "company-standard",
  templateData: convertResult.templateData,
  name: "Company Standard Template",
  description: "Standard company presentation template"
});

// Step 5: Create presentations from template
// Q1 Report
await callTool("create_from_template", {
  templateId: "company-standard",
  contentMapping: {
    "slide_0_element_0": { text: "Q1 2025 Report" },
    "slide_1_element_0": { text: "Strong growth in Q1\nRevenue up 25%\nNew markets entered" }
  }
});

// Q2 Report
await callTool("create_from_template", {
  templateId: "company-standard",
  contentMapping: {
    "slide_0_element_0": { text: "Q2 2025 Report" },
    "slide_1_element_0": { text: "Continued success in Q2\nRevenue up 30%\nProduct launches" }
  }
});
```

## Best Practices

### 1. Design Templates with Placeholders
Use placeholder text like `{{TITLE}}`, `{{CONTENT}}`, or `{{DATE}}` in your template designs to make it clear which elements should be replaced.

### 2. Keep Element Positions Consistent
When creating presentations from templates, try to identify elements by name rather than position when possible, as this is more maintainable.

### 3. Test Templates Before Production Use
Always test your templates with sample content to ensure:
- Content fits within the designated areas
- Fonts and colors are preserved correctly
- Images scale appropriately

### 4. Document Your Templates
Add clear descriptions when saving templates to help users understand what the template is for and what content can be replaced.

### 5. Use Descriptive Template IDs
Choose meaningful template IDs like `"quarterly-report"` or `"sales-deck"` rather than generic names.

## Limitations

The template system has some limitations to be aware of:

1. **Complex Animations**: Animations and transitions from the original PPTX may not be preserved
2. **Custom Themes**: PowerPoint themes are converted to inline styling
3. **Embedded Objects**: Some embedded objects may not convert perfectly
4. **Fonts**: Ensure that fonts used in templates are available on the system where presentations are generated

## Technical Details

### JSON Structure

The JSON template structure follows the pptxtojson format:

```json
{
  "slides": [
    {
      "fill": {
        "type": "color",
        "value": "#FF0000"
      },
      "elements": [
        {
          "type": "text",
          "left": 72,
          "top": 144,
          "width": 576,
          "height": 108,
          "content": "<p>Text content</p>",
          "name": "Title Text"
        }
      ],
      "note": "Speaker notes"
    }
  ]
}
```

### Coordinate System

All dimensions in the JSON template are in points (pt):
- 72 points = 1 inch
- The template conversion function automatically converts pt to inches for PptxGenJS

### Element Processing

When creating presentations from templates:
1. Slides are processed in order
2. Elements on each slide are processed sequentially
3. Content mapping is applied by matching keys to element positions or names
4. Original styling is preserved unless overridden
5. Elements without replacements retain their original content

## Troubleshooting

### Template Conversion Fails

**Problem**: `convert_pptx_to_template` fails with an error

**Solutions**:
- Verify the file path is correct and accessible
- Ensure the file is a valid PPTX (not PPT or other format)
- Check that the file isn't corrupted
- Try opening the file in PowerPoint to verify it's valid

### Content Not Replacing

**Problem**: Content mapping doesn't replace elements

**Solutions**:
- Verify element identifiers using `load_template` to inspect the structure
- Check that the element exists at the specified position
- Ensure the content type matches the element type (text for text elements, etc.)
- Use name-based mapping if position-based isn't working

### Layout Issues

**Problem**: Generated presentation layout differs from template

**Solutions**:
- Check that coordinate conversions are correct (pt to inches)
- Verify font availability on the system
- Ensure images are accessible at specified paths
- Test with simpler templates first to isolate issues

## Support

For issues or questions about the template feature:
1. Check this documentation first
2. Review the `test-templates.cjs` file for working examples
3. Open an issue on the GitHub repository with details about your use case
