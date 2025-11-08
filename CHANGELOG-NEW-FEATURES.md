# Changelog - New Features

## Version 1.1.0 - New Features Release

### Overview
This release adds three major features to significantly improve presentation creation efficiency and design consistency:

1. **HTML Table Import** - Import and convert HTML tables to PowerPoint
2. **Batch Operations** - Add slides with multiple content items in one call
3. **Slide Master Templates** - Define and reuse slide templates

### New Tools

#### `import_html_table`
Import HTML tables and automatically convert them to PowerPoint tables while preserving styling.

**Features:**
- Parses standard HTML table markup (`<table>`, `<tr>`, `<th>`, `<td>`)
- Preserves text formatting (bold, italic)
- Maintains colors (background and text colors)
- Respects alignment (left, center, right)
- Handles colspan and rowspan attributes
- Secure HTML parsing with proper sanitization

**Use Cases:**
- Copy tables from web pages or HTML reports
- Import data from HTML exports
- Convert formatted spreadsheet data

**Example:**
```javascript
await callTool("import_html_table", {
  presentationId: "pres_1",
  html: `<table>
    <tr><th bgcolor="#2C3E50">Product</th><th>Sales</th></tr>
    <tr><td><b>Product A</b></td><td align="right">$150K</td></tr>
  </table>`,
  x: 1, y: 1.5, w: 8, h: 2
});
```

#### `add_slide_with_content`
Add a slide and multiple content items (text, shapes, images, tables, charts) in a single operation.

**Benefits:**
- **Reduced tool calls** - Up to 10x fewer calls for complex slides
- **Atomic operations** - All content added together
- **Cleaner code** - One call instead of many sequential calls

**Supported Content Types:**
- Text with full formatting
- Shapes (rectangles, circles, arrows, etc.)
- Images (URLs, paths, base64)
- Tables with styling
- Charts (all types)

**Example:**
```javascript
await callTool("add_slide_with_content", {
  presentationId: "pres_1",
  backgroundColor: "F8F9FA",
  content: [
    { type: "text", data: { text: "Title", x: 1, y: 0.5, w: 8, h: 0.75, fontSize: 32 } },
    { type: "shape", data: { shape: "ellipse", x: 2, y: 2, w: 2, h: 2, fill: { color: "3498DB" } } },
    { type: "chart", data: { chartType: "bar", chartData: [...], x: 1, y: 1.5, w: 8, h: 3 } }
  ]
});
```

#### `define_slide_master`
Create reusable slide templates with predefined layouts and styling.

**Features:**
- Define placeholders with positions and styling
- Set default backgrounds (colors or images)
- Create consistent slide types (title, content, section headers)
- Store templates for reuse throughout presentation

**Example:**
```javascript
await callTool("define_slide_master", {
  masterId: "corporate-title",
  name: "Corporate Title Slide",
  backgroundColor: "1A1A2E",
  placeholders: [
    {
      id: "title",
      type: "text",
      x: 1, y: 2, w: 8, h: 1.5,
      fontSize: 48, bold: true, align: "center", color: "FFFFFF"
    },
    {
      id: "subtitle",
      type: "text",
      x: 1, y: 3.5, w: 8, h: 0.75,
      fontSize: 24, align: "center", color: "BDC3C7"
    }
  ]
});
```

#### `add_slide_from_master`
Create slides using predefined slide masters.

**Benefits:**
- **Consistent design** - All slides follow the same layout
- **Faster creation** - Just fill in placeholder content
- **Easy updates** - Change master to update all slides

**Example:**
```javascript
await callTool("add_slide_from_master", {
  presentationId: "pres_1",
  masterId: "corporate-title",
  placeholderContent: {
    title: { text: "Q4 Results" },
    subtitle: { text: "Financial Overview" }
  }
});
```

#### `list_slide_masters`
List all defined slide masters.

**Example:**
```javascript
await callTool("list_slide_masters", {});
// Returns: { masters: [...], count: 4 }
```

### Performance Improvements

**Before (Traditional Approach):**
```javascript
// 5 separate tool calls to create a slide with title, 2 shapes, and a chart
await callTool("add_slide", { presentationId });
await callTool("add_text", { presentationId, text: "Title", ... });
await callTool("add_shape", { presentationId, shape: "rect", ... });
await callTool("add_shape", { presentationId, shape: "ellipse", ... });
await callTool("add_chart", { presentationId, type: "bar", ... });
```

**After (Batch Operation):**
```javascript
// 1 tool call to create the same slide
await callTool("add_slide_with_content", {
  presentationId,
  content: [
    { type: "text", data: { text: "Title", ... } },
    { type: "shape", data: { shape: "rect", ... } },
    { type: "shape", data: { shape: "ellipse", ... } },
    { type: "chart", data: { chartType: "bar", ... } }
  ]
});
```

### Documentation

New documentation files:

1. **AGENT_PROMPT.md** - Comprehensive guide for AI agents using this server
   - Design principles and UI/UX best practices
   - Typography and color theory
   - Layout patterns and common designs
   - Tips for efficient use of new features

2. **EXAMPLES-NEW-FEATURES.md** - Complete examples for all new features
   - HTML table import examples
   - Batch operation patterns
   - Slide master workflows
   - Real-world use cases

### Testing

New test suite: `test-new-features.cjs`
- Tests HTML table import with various styling
- Tests batch operations with multiple content types
- Tests slide master definition and usage
- Validates all new tools work correctly

### Security

All new features have been security-reviewed:
- ✅ HTML parsing uses secure multi-pass tag removal
- ✅ Proper HTML entity decoding (prevents double-unescaping)
- ✅ No injection vulnerabilities
- ✅ CodeQL scan: 0 alerts

### Backward Compatibility

All existing tools remain unchanged and fully compatible. The new features are additive:
- Existing workflows continue to work
- No breaking changes to API
- All existing tests pass

### Migration Guide

You can start using the new features alongside existing code:

**Scenario 1: You have repetitive slide structures**
→ Define slide masters and use `add_slide_from_master`

**Scenario 2: You're adding multiple items to slides**
→ Use `add_slide_with_content` instead of multiple calls

**Scenario 3: You have HTML tables to import**
→ Use `import_html_table` instead of manually creating tables

### Known Limitations

1. **HTML Table Import:**
   - Basic CSS styling only (colors, alignment, bold, italic)
   - Complex CSS or JavaScript-generated tables not supported
   - Nested tables not supported

2. **Slide Masters:**
   - Stored in memory (not persisted to presentation file)
   - Must be redefined when server restarts
   - Text and image placeholders only (no chart/table placeholders)

3. **Batch Operations:**
   - All content added to the same slide
   - Cannot reference previously added items in the same batch

### Future Enhancements

Potential future additions:
- Export/import slide masters to JSON
- Chart and table placeholders in masters
- CSS parsing for more HTML styles
- Batch operations across multiple slides

### Getting Help

- See **EXAMPLES-NEW-FEATURES.md** for usage examples
- See **AGENT_PROMPT.md** for design guidance
- Check **README.md** for tool documentation
- Run **test-new-features.cjs** to see features in action

### Credits

These features were designed to address common presentation creation workflows:
- Reduce tool call overhead
- Improve design consistency
- Simplify data import from web sources
