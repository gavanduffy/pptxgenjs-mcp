# PptxGenJS MCP Server - Usage Examples

This document provides practical examples of using the PptxGenJS MCP server to create PowerPoint presentations.

## Basic Example: Simple Presentation

Create a basic presentation with a title slide and content slide:

```javascript
// 1. Create presentation
{
  "name": "create_presentation",
  "arguments": {
    "layout": "LAYOUT_16x9",
    "title": "My First Presentation",
    "author": "Your Name"
  }
}
// Returns: { presentationId: "pres_1" }

// 2. Add title slide
{
  "name": "add_slide",
  "arguments": {
    "presentationId": "pres_1"
  }
}

{
  "name": "add_text",
  "arguments": {
    "presentationId": "pres_1",
    "text": "Welcome",
    "x": 1,
    "y": 2.5,
    "w": 8,
    "h": 1,
    "fontSize": 48,
    "bold": true,
    "align": "center"
  }
}

// 3. Add content slide
{
  "name": "add_slide",
  "arguments": {
    "presentationId": "pres_1"
  }
}

{
  "name": "add_text",
  "arguments": {
    "presentationId": "pres_1",
    "text": "Introduction\nKey Point 1\nKey Point 2\nKey Point 3",
    "x": 1,
    "y": 1.5,
    "w": 8,
    "h": 3,
    "fontSize": 24,
    "bullet": true
  }
}

// 4. Save
{
  "name": "save_presentation",
  "arguments": {
    "presentationId": "pres_1",
    "fileName": "my-presentation.pptx"
  }
}
```

## Business Report with Charts

Create a professional business report with data visualizations:

```javascript
// 1. Create presentation
{
  "name": "create_presentation",
  "arguments": {
    "layout": "LAYOUT_16x9",
    "title": "Q4 Business Review",
    "author": "Finance Team",
    "company": "Acme Corp"
  }
}

// 2. Title slide
{
  "name": "add_slide",
  "arguments": {
    "presentationId": "pres_1",
    "backgroundColor": "1A1A2E"
  }
}

{
  "name": "add_text",
  "arguments": {
    "presentationId": "pres_1",
    "text": "Q4 2024 Business Review",
    "x": 1,
    "y": 2,
    "w": 8,
    "h": 1.5,
    "fontSize": 44,
    "bold": true,
    "align": "center",
    "color": "FFFFFF"
  }
}

// 3. Revenue chart slide
{
  "name": "add_slide",
  "arguments": {
    "presentationId": "pres_1"
  }
}

{
  "name": "add_text",
  "arguments": {
    "presentationId": "pres_1",
    "text": "Revenue Growth",
    "x": 0.5,
    "y": 0.5,
    "w": 9,
    "h": 0.75,
    "fontSize": 32,
    "bold": true
  }
}

{
  "name": "add_chart",
  "arguments": {
    "presentationId": "pres_1",
    "type": "line",
    "data": [
      {
        "name": "Revenue",
        "labels": ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
        "values": [150, 165, 180, 175, 190, 210, 225, 240, 255, 270, 290, 310]
      }
    ],
    "x": 1,
    "y": 1.5,
    "w": 8,
    "h": 4,
    "title": "Monthly Revenue (in thousands)",
    "showLegend": true,
    "showValue": true
  }
}

// 4. Comparison chart
{
  "name": "add_slide",
  "arguments": {
    "presentationId": "pres_1"
  }
}

{
  "name": "add_chart",
  "arguments": {
    "presentationId": "pres_1",
    "type": "bar",
    "data": [
      {
        "name": "2023",
        "labels": ["Q1", "Q2", "Q3", "Q4"],
        "values": [580, 620, 650, 710]
      },
      {
        "name": "2024",
        "labels": ["Q1", "Q2", "Q3", "Q4"],
        "values": [650, 720, 780, 870]
      }
    ],
    "x": 1,
    "y": 1,
    "w": 8,
    "h": 4.5,
    "title": "Year-over-Year Comparison",
    "showLegend": true,
    "barGrouping": "clustered",
    "catAxisTitle": "Quarter",
    "valAxisTitle": "Revenue ($K)"
  }
}

{
  "name": "save_presentation",
  "arguments": {
    "presentationId": "pres_1",
    "fileName": "business-review.pptx",
    "compression": true
  }
}
```

## Infographic with Shapes and Icons

Create a visually appealing infographic:

```javascript
// 1. Create presentation
{
  "name": "create_presentation",
  "arguments": {
    "layout": "LAYOUT_16x9"
  }
}

// 2. Process flow slide
{
  "name": "add_slide",
  "arguments": {
    "presentationId": "pres_1",
    "backgroundColor": "F8F9FA"
  }
}

{
  "name": "add_text",
  "arguments": {
    "presentationId": "pres_1",
    "text": "Our Process",
    "x": 0.5,
    "y": 0.5,
    "w": 9,
    "h": 0.75,
    "fontSize": 36,
    "bold": true,
    "align": "center"
  }
}

// Step 1 - Circle
{
  "name": "add_shape",
  "arguments": {
    "presentationId": "pres_1",
    "shape": "ellipse",
    "x": 1,
    "y": 2,
    "w": 1.5,
    "h": 1.5,
    "fill": { "color": "3498DB" }
  }
}

{
  "name": "add_text",
  "arguments": {
    "presentationId": "pres_1",
    "text": "1",
    "x": 1,
    "y": 2,
    "w": 1.5,
    "h": 1.5,
    "fontSize": 48,
    "bold": true,
    "color": "FFFFFF",
    "align": "center",
    "valign": "middle"
  }
}

{
  "name": "add_text",
  "arguments": {
    "presentationId": "pres_1",
    "text": "Planning",
    "x": 0.5,
    "y": 3.75,
    "w": 2.5,
    "h": 0.5,
    "fontSize": 18,
    "align": "center"
  }
}

// Arrow
{
  "name": "add_shape",
  "arguments": {
    "presentationId": "pres_1",
    "shape": "rightArrow",
    "x": 2.75,
    "y": 2.5,
    "w": 1,
    "h": 0.5,
    "fill": { "color": "95A5A6" }
  }
}

// Step 2 - Circle
{
  "name": "add_shape",
  "arguments": {
    "presentationId": "pres_1",
    "shape": "ellipse",
    "x": 4,
    "y": 2,
    "w": 1.5,
    "h": 1.5,
    "fill": { "color": "2ECC71" }
  }
}

{
  "name": "add_text",
  "arguments": {
    "presentationId": "pres_1",
    "text": "2",
    "x": 4,
    "y": 2,
    "w": 1.5,
    "h": 1.5,
    "fontSize": 48,
    "bold": true,
    "color": "FFFFFF",
    "align": "center",
    "valign": "middle"
  }
}

{
  "name": "add_text",
  "arguments": {
    "presentationId": "pres_1",
    "text": "Execution",
    "x": 3.5,
    "y": 3.75,
    "w": 2.5,
    "h": 0.5,
    "fontSize": 18,
    "align": "center"
  }
}

// Arrow
{
  "name": "add_shape",
  "arguments": {
    "presentationId": "pres_1",
    "shape": "rightArrow",
    "x": 5.75,
    "y": 2.5,
    "w": 1,
    "h": 0.5,
    "fill": { "color": "95A5A6" }
  }
}

// Step 3 - Circle
{
  "name": "add_shape",
  "arguments": {
    "presentationId": "pres_1",
    "shape": "ellipse",
    "x": 7,
    "y": 2,
    "w": 1.5,
    "h": 1.5,
    "fill": { "color": "E74C3C" }
  }
}

{
  "name": "add_text",
  "arguments": {
    "presentationId": "pres_1",
    "text": "3",
    "x": 7,
    "y": 2,
    "w": 1.5,
    "h": 1.5,
    "fontSize": 48,
    "bold": true,
    "color": "FFFFFF",
    "align": "center",
    "valign": "middle"
  }
}

{
  "name": "add_text",
  "arguments": {
    "presentationId": "pres_1",
    "text": "Review",
    "x": 6.5,
    "y": 3.75,
    "w": 2.5,
    "h": 0.5,
    "fontSize": 18,
    "align": "center"
  }
}

{
  "name": "save_presentation",
  "arguments": {
    "presentationId": "pres_1",
    "fileName": "infographic.pptx"
  }
}
```

## Data Table Presentation

Create a presentation with formatted tables:

```javascript
// 1. Create presentation
{
  "name": "create_presentation",
  "arguments": {
    "layout": "LAYOUT_16x9",
    "title": "Product Comparison"
  }
}

// 2. Table slide
{
  "name": "add_slide",
  "arguments": {
    "presentationId": "pres_1"
  }
}

{
  "name": "add_text",
  "arguments": {
    "presentationId": "pres_1",
    "text": "Product Feature Comparison",
    "x": 0.5,
    "y": 0.5,
    "w": 9,
    "h": 0.75,
    "fontSize": 32,
    "bold": true
  }
}

{
  "name": "add_table",
  "arguments": {
    "presentationId": "pres_1",
    "rows": [
      [
        { "text": "Feature", "options": { "bold": true, "fill": "2C3E50", "color": "FFFFFF", "align": "center" } },
        { "text": "Basic", "options": { "bold": true, "fill": "3498DB", "color": "FFFFFF", "align": "center" } },
        { "text": "Pro", "options": { "bold": true, "fill": "2ECC71", "color": "FFFFFF", "align": "center" } },
        { "text": "Enterprise", "options": { "bold": true, "fill": "E74C3C", "color": "FFFFFF", "align": "center" } }
      ],
      [
        "Storage",
        "10 GB",
        "100 GB",
        "Unlimited"
      ],
      [
        "Users",
        "1",
        "10",
        "Unlimited"
      ],
      [
        "Support",
        "Email",
        "Email + Chat",
        "24/7 Phone"
      ],
      [
        "Price",
        "$9/mo",
        "$29/mo",
        "Custom"
      ]
    ],
    "x": 1,
    "y": 1.5,
    "w": 8,
    "h": 3.5,
    "fontSize": 16,
    "border": [
      { "type": "solid", "color": "BDC3C7", "pt": 1 }
    ]
  }
}

{
  "name": "save_presentation",
  "arguments": {
    "presentationId": "pres_1",
    "fileName": "comparison.pptx"
  }
}
```

## Multi-Chart Dashboard

Create a dashboard with multiple charts:

```javascript
// 1. Create presentation
{
  "name": "create_presentation",
  "arguments": {
    "layout": "LAYOUT_16x9",
    "title": "Sales Dashboard"
  }
}

// 2. Dashboard slide
{
  "name": "add_slide",
  "arguments": {
    "presentationId": "pres_1",
    "backgroundColor": "ECF0F1"
  }
}

{
  "name": "add_text",
  "arguments": {
    "presentationId": "pres_1",
    "text": "Sales Dashboard - Q4 2024",
    "x": 0.5,
    "y": 0.25,
    "w": 9,
    "h": 0.5,
    "fontSize": 28,
    "bold": true,
    "align": "center"
  }
}

// Top left - Pie chart
{
  "name": "add_chart",
  "arguments": {
    "presentationId": "pres_1",
    "type": "pie",
    "data": [
      {
        "name": "Market Share",
        "labels": ["Product A", "Product B", "Product C", "Product D"],
        "values": [35, 30, 20, 15]
      }
    ],
    "x": 0.5,
    "y": 1,
    "w": 4.5,
    "h": 2.5,
    "title": "Market Share by Product",
    "showLegend": true,
    "showValue": true
  }
}

// Top right - Bar chart
{
  "name": "add_chart",
  "arguments": {
    "presentationId": "pres_1",
    "type": "bar",
    "data": [
      {
        "name": "Revenue",
        "labels": ["Jan", "Feb", "Mar"],
        "values": [120, 145, 168]
      }
    ],
    "x": 5.5,
    "y": 1,
    "w": 4,
    "h": 2.5,
    "title": "Monthly Revenue Trend",
    "showLegend": false,
    "barDir": "col"
  }
}

// Bottom - Line chart
{
  "name": "add_chart",
  "arguments": {
    "presentationId": "pres_1",
    "type": "line",
    "data": [
      {
        "name": "Customers",
        "labels": ["Week 1", "Week 2", "Week 3", "Week 4"],
        "values": [245, 267, 289, 312]
      }
    ],
    "x": 0.5,
    "y": 3.75,
    "w": 9,
    "h": 2,
    "title": "Customer Growth",
    "showValue": true
  }
}

{
  "name": "save_presentation",
  "arguments": {
    "presentationId": "pres_1",
    "fileName": "dashboard.pptx"
  }
}
```

## Tips for Best Results

### Positioning and Sizing
- Use inches for absolute positioning (e.g., `x: 1`, `y: 2`)
- Use percentages for relative positioning (e.g., `x: "10%"`, `w: "80%"`)
- Standard 16:9 slide dimensions: 10" wide × 5.625" tall

### Colors
- Always use 6-digit hex colors without the `#` symbol
- Examples: `"FF0000"` (red), `"00FF00"` (green), `"0000FF"` (blue)

### Text Formatting
- Font sizes are in points (typical range: 12-48)
- Common fonts: Arial, Calibri, Times New Roman, Verdana
- Use `bullet: true` for bullet points

### Charts
- Provide clear labels and values for data series
- Use appropriate chart types for your data
- Enable legends for multi-series charts

### Performance
- Large presentations are kept in memory until saved
- Use `compression: true` when saving to reduce file size by up to 30%
- Use `list_presentations` to track active presentations

### Workflow
1. Always create a presentation first and note the `presentationId`
2. Add slides before adding content
3. Content is added to the most recently added slide
4. Save or export when complete

## Common Patterns

### Creating a Title Slide
```javascript
{
  "name": "add_slide",
  "arguments": { "presentationId": "pres_1" }
}

{
  "name": "add_text",
  "arguments": {
    "presentationId": "pres_1",
    "text": "Main Title",
    "x": 1, "y": 2, "w": 8, "h": 1.5,
    "fontSize": 44, "bold": true, "align": "center"
  }
}

{
  "name": "add_text",
  "arguments": {
    "presentationId": "pres_1",
    "text": "Subtitle",
    "x": 1, "y": 3.5, "w": 8, "h": 0.5,
    "fontSize": 24, "align": "center"
  }
}
```

### Creating a Section Header
```javascript
{
  "name": "add_section",
  "arguments": {
    "presentationId": "pres_1",
    "title": "Financial Results"
  }
}
```

### Adding a Background Image
```javascript
{
  "name": "add_slide",
  "arguments": {
    "presentationId": "pres_1",
    "backgroundImage": {
      "path": "https://example.com/background.jpg"
    }
  }
}
```

### Exporting for Transfer
```javascript
{
  "name": "export_presentation",
  "arguments": {
    "presentationId": "pres_1",
    "outputType": "base64"
  }
}
```
