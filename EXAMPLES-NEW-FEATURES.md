# New Features Examples

This document demonstrates the new features added to PptxGenJS MCP Server: HTML table import, batch operations, and slide master templates.

## HTML Table Import

### Basic HTML Table Import

Import a simple HTML table with header styling:

```javascript
{
  "name": "add_slide",
  "arguments": { "presentationId": "pres_1" }
}

{
  "name": "import_html_table",
  "arguments": {
    "presentationId": "pres_1",
    "html": "<table><tr><th bgcolor='#2C3E50'>Name</th><th bgcolor='#2C3E50'>Role</th></tr><tr><td>Alice</td><td>Manager</td></tr><tr><td>Bob</td><td>Developer</td></tr></table>",
    "x": 1,
    "y": 1.5,
    "w": 8,
    "h": 2,
    "fontSize": 14,
    "border": [{ "type": "solid", "color": "BDC3C7", "pt": 1 }]
  }
}
```

### Advanced HTML Table with Styling

Import a table with colors, alignment, and formatting:

```javascript
{
  "name": "import_html_table",
  "arguments": {
    "presentationId": "pres_1",
    "html": `<table>
      <tr>
        <th bgcolor="#34495E" align="center">Quarter</th>
        <th bgcolor="#34495E" align="center">Revenue</th>
        <th bgcolor="#34495E" align="center">Growth</th>
      </tr>
      <tr style="background-color: #ECF0F1">
        <td><b>Q1</b></td>
        <td align="right">$150,000</td>
        <td align="right" style="color: #27AE60"><b>+15%</b></td>
      </tr>
      <tr>
        <td><b>Q2</b></td>
        <td align="right">$180,000</td>
        <td align="right" style="color: #27AE60"><b>+20%</b></td>
      </tr>
      <tr style="background-color: #ECF0F1">
        <td><b>Q3</b></td>
        <td align="right">$210,000</td>
        <td align="right" style="color: #27AE60"><b>+17%</b></td>
      </tr>
      <tr>
        <td colspan="2" align="right"><b>Total:</b></td>
        <td align="right"><b>$540,000</b></td>
      </tr>
    </table>`,
    "x": 1,
    "y": 1.5,
    "w": 8,
    "h": 3.5,
    "fontSize": 14
  }
}
```

### HTML Table with Colspan and Rowspan

```javascript
{
  "name": "import_html_table",
  "arguments": {
    "presentationId": "pres_1",
    "html": `<table>
      <tr>
        <th colspan="3" bgcolor="#3498DB" align="center">Product Comparison</th>
      </tr>
      <tr>
        <th bgcolor="#95A5A6">Feature</th>
        <th bgcolor="#95A5A6">Basic</th>
        <th bgcolor="#95A5A6">Premium</th>
      </tr>
      <tr>
        <td><b>Storage</b></td>
        <td align="center">10 GB</td>
        <td align="center">Unlimited</td>
      </tr>
      <tr>
        <td><b>Users</b></td>
        <td align="center">1</td>
        <td align="center">10</td>
      </tr>
    </table>`,
    "x": 2,
    "y": 1.5,
    "w": 6,
    "h": 2.5
  }
}
```

## Batch Operations

### Create Content Slide in One Call

Instead of:
- `add_slide` (1 call)
- `add_text` for title (1 call)
- `add_text` for content (1 call)
- `add_shape` for decoration (1 call)

Do this:

```javascript
{
  "name": "add_slide_with_content",
  "arguments": {
    "presentationId": "pres_1",
    "backgroundColor": "F8F9FA",
    "content": [
      {
        "type": "text",
        "data": {
          "text": "Project Timeline",
          "x": 0.5,
          "y": 0.5,
          "w": 9,
          "h": 0.75,
          "fontSize": 32,
          "bold": true,
          "color": "2C3E50"
        }
      },
      {
        "type": "text",
        "data": {
          "text": "Phase 1: Planning (Q1)\nPhase 2: Development (Q2-Q3)\nPhase 3: Testing (Q4)\nPhase 4: Launch (Q1 2025)",
          "x": 0.5,
          "y": 1.5,
          "w": 9,
          "h": 3,
          "fontSize": 18,
          "bullet": true
        }
      },
      {
        "type": "shape",
        "data": {
          "shape": "rect",
          "x": 0.5,
          "y": 0.5,
          "w": 0.1,
          "h": 0.75,
          "fill": { "color": "3498DB" }
        }
      }
    ]
  }
}
```

### Dashboard Slide with Multiple Charts

Create a dashboard with multiple charts in a single call:

```javascript
{
  "name": "add_slide_with_content",
  "arguments": {
    "presentationId": "pres_1",
    "backgroundColor": "FFFFFF",
    "content": [
      {
        "type": "text",
        "data": {
          "text": "Q4 Dashboard",
          "x": 0.5,
          "y": 0.25,
          "w": 9,
          "h": 0.5,
          "fontSize": 28,
          "bold": true,
          "align": "center"
        }
      },
      {
        "type": "chart",
        "data": {
          "chartType": "pie",
          "chartData": [
            {
              "name": "Market Share",
              "labels": ["Product A", "Product B", "Product C"],
              "values": [45, 30, 25]
            }
          ],
          "x": 0.5,
          "y": 1,
          "w": 4.5,
          "h": 2.5,
          "title": "Market Share",
          "showLegend": true,
          "showValue": true
        }
      },
      {
        "type": "chart",
        "data": {
          "chartType": "bar",
          "chartData": [
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
          "title": "Monthly Revenue",
          "barDir": "col"
        }
      },
      {
        "type": "table",
        "data": {
          "rows": [
            [
              { "text": "Metric", "options": { "bold": true } },
              { "text": "Value", "options": { "bold": true } }
            ],
            ["Active Users", "12,450"],
            ["Conversion Rate", "3.2%"],
            ["Revenue", "$168K"]
          ],
          "x": 0.5,
          "y": 3.75,
          "w": 4,
          "h": 1.5,
          "fontSize": 12
        }
      }
    ]
  }
}
```

### Info Cards Layout

Create a three-card info layout in one call:

```javascript
{
  "name": "add_slide_with_content",
  "arguments": {
    "presentationId": "pres_1",
    "backgroundColor": "FFFFFF",
    "content": [
      {
        "type": "text",
        "data": {
          "text": "Our Services",
          "x": 0.5,
          "y": 0.5,
          "w": 9,
          "h": 0.75,
          "fontSize": 36,
          "bold": true,
          "align": "center"
        }
      },
      {
        "type": "shape",
        "data": {
          "shape": "rect",
          "x": 0.75,
          "y": 1.75,
          "w": 2.5,
          "h": 3,
          "fill": { "color": "3498DB", "transparency": 10 },
          "line": { "color": "3498DB", "width": 2 }
        }
      },
      {
        "type": "text",
        "data": {
          "text": "Design\n\nCreative and modern designs that capture attention",
          "x": 0.75,
          "y": 2,
          "w": 2.5,
          "h": 2.5,
          "fontSize": 16,
          "align": "center",
          "valign": "middle"
        }
      },
      {
        "type": "shape",
        "data": {
          "shape": "rect",
          "x": 3.75,
          "y": 1.75,
          "w": 2.5,
          "h": 3,
          "fill": { "color": "2ECC71", "transparency": 10 },
          "line": { "color": "2ECC71", "width": 2 }
        }
      },
      {
        "type": "text",
        "data": {
          "text": "Development\n\nRobust solutions built with cutting-edge technology",
          "x": 3.75,
          "y": 2,
          "w": 2.5,
          "h": 2.5,
          "fontSize": 16,
          "align": "center",
          "valign": "middle"
        }
      },
      {
        "type": "shape",
        "data": {
          "shape": "rect",
          "x": 6.75,
          "y": 1.75,
          "w": 2.5,
          "h": 3,
          "fill": { "color": "E74C3C", "transparency": 10 },
          "line": { "color": "E74C3C", "width": 2 }
        }
      },
      {
        "type": "text",
        "data": {
          "text": "Support\n\n24/7 assistance to keep you running smoothly",
          "x": 6.75,
          "y": 2,
          "w": 2.5,
          "h": 2.5,
          "fontSize": 16,
          "align": "center",
          "valign": "middle"
        }
      }
    ]
  }
}
```

## Slide Master Templates

### Define Slide Masters

First, define reusable slide templates:

```javascript
// Title Slide Master
{
  "name": "define_slide_master",
  "arguments": {
    "masterId": "corporate-title",
    "name": "Corporate Title Slide",
    "backgroundColor": "1A1A2E",
    "placeholders": [
      {
        "id": "title",
        "type": "text",
        "x": 1,
        "y": 2,
        "w": 8,
        "h": 1.5,
        "fontSize": 48,
        "bold": true,
        "align": "center",
        "color": "FFFFFF"
      },
      {
        "id": "subtitle",
        "type": "text",
        "x": 1,
        "y": 3.5,
        "w": 8,
        "h": 0.75,
        "fontSize": 24,
        "align": "center",
        "color": "BDC3C7"
      }
    ]
  }
}

// Content Slide Master
{
  "name": "define_slide_master",
  "arguments": {
    "masterId": "corporate-content",
    "name": "Corporate Content Slide",
    "backgroundColor": "FFFFFF",
    "placeholders": [
      {
        "id": "title",
        "type": "text",
        "x": 0.5,
        "y": 0.5,
        "w": 9,
        "h": 0.75,
        "fontSize": 32,
        "bold": true,
        "color": "2C3E50"
      },
      {
        "id": "content",
        "type": "text",
        "x": 0.5,
        "y": 1.5,
        "w": 9,
        "h": 4,
        "fontSize": 18,
        "color": "34495E"
      }
    ]
  }
}

// Section Header Master
{
  "name": "define_slide_master",
  "arguments": {
    "masterId": "section-header",
    "name": "Section Header",
    "backgroundColor": "3498DB",
    "placeholders": [
      {
        "id": "section-number",
        "type": "text",
        "x": 0.5,
        "y": 1.5,
        "w": 9,
        "h": 0.75,
        "fontSize": 20,
        "align": "center",
        "color": "ECF0F1"
      },
      {
        "id": "section-title",
        "type": "text",
        "x": 0.5,
        "y": 2.5,
        "w": 9,
        "h": 1.5,
        "fontSize": 44,
        "bold": true,
        "align": "center",
        "color": "FFFFFF"
      }
    ]
  }
}

// Two-Column Content Master
{
  "name": "define_slide_master",
  "arguments": {
    "masterId": "two-column",
    "name": "Two Column Layout",
    "backgroundColor": "F8F9FA",
    "placeholders": [
      {
        "id": "title",
        "type": "text",
        "x": 0.5,
        "y": 0.5,
        "w": 9,
        "h": 0.75,
        "fontSize": 32,
        "bold": true,
        "color": "2C3E50"
      },
      {
        "id": "left-content",
        "type": "text",
        "x": 0.5,
        "y": 1.5,
        "w": 4.5,
        "h": 4,
        "fontSize": 18,
        "color": "34495E"
      },
      {
        "id": "right-content",
        "type": "text",
        "x": 5.5,
        "y": 1.5,
        "w": 4,
        "h": 4,
        "fontSize": 18,
        "color": "34495E"
      }
    ]
  }
}
```

### List Available Masters

```javascript
{
  "name": "list_slide_masters",
  "arguments": {}
}

// Returns:
// {
//   "success": true,
//   "masters": [
//     { "id": "corporate-title", "name": "Corporate Title Slide", "placeholderCount": 2, "hasBackground": true },
//     { "id": "corporate-content", "name": "Corporate Content Slide", "placeholderCount": 2, "hasBackground": true },
//     { "id": "section-header", "name": "Section Header", "placeholderCount": 2, "hasBackground": true },
//     { "id": "two-column", "name": "Two Column Layout", "placeholderCount": 3, "hasBackground": true }
//   ],
//   "count": 4
// }
```

### Use Slide Masters

Create slides from the defined masters:

```javascript
// Create title slide
{
  "name": "add_slide_from_master",
  "arguments": {
    "presentationId": "pres_1",
    "masterId": "corporate-title",
    "placeholderContent": {
      "title": { "text": "2024 Annual Report" },
      "subtitle": { "text": "Financial Performance & Strategy" }
    }
  }
}

// Create section header
{
  "name": "add_slide_from_master",
  "arguments": {
    "presentationId": "pres_1",
    "masterId": "section-header",
    "placeholderContent": {
      "section-number": { "text": "SECTION 01" },
      "section-title": { "text": "Executive Summary" }
    }
  }
}

// Create content slide
{
  "name": "add_slide_from_master",
  "arguments": {
    "presentationId": "pres_1",
    "masterId": "corporate-content",
    "placeholderContent": {
      "title": { "text": "Key Achievements" },
      "content": { "text": "• Revenue increased by 35%\n• Expanded to 5 new markets\n• Launched 3 major products\n• Customer satisfaction at 94%" }
    }
  }
}

// Create two-column slide
{
  "name": "add_slide_from_master",
  "arguments": {
    "presentationId": "pres_1",
    "masterId": "two-column",
    "placeholderContent": {
      "title": { "text": "Strengths & Opportunities" },
      "left-content": { "text": "Strengths:\n• Strong brand recognition\n• Loyal customer base\n• Innovative products\n• Experienced team" },
      "right-content": { "text": "Opportunities:\n• Growing market demand\n• New technology adoption\n• Strategic partnerships\n• Global expansion" }
    }
  }
}
```

## Complete Workflow Example

Here's a complete workflow using all new features:

```javascript
// 1. Create presentation
const result = await callTool("create_presentation", {
  layout: "LAYOUT_16x9",
  title: "Q4 Business Review",
  author: "Finance Team"
});
const presentationId = result.presentationId;

// 2. Define slide masters for consistency
await callTool("define_slide_master", {
  masterId: "title-slide",
  name: "Title Slide",
  backgroundColor: "1A1A2E",
  placeholders: [
    { id: "title", type: "text", x: 1, y: 2, w: 8, h: 1.5, fontSize: 48, bold: true, align: "center", color: "FFFFFF" },
    { id: "subtitle", type: "text", x: 1, y: 3.5, w: 8, h: 0.75, fontSize: 24, align: "center", color: "BDC3C7" }
  ]
});

await callTool("define_slide_master", {
  masterId: "content-slide",
  name: "Content Slide",
  backgroundColor: "FFFFFF",
  placeholders: [
    { id: "title", type: "text", x: 0.5, y: 0.5, w: 9, h: 0.75, fontSize: 32, bold: true, color: "2C3E50" },
    { id: "content", type: "text", x: 0.5, y: 1.5, w: 9, h: 4, fontSize: 18, color: "34495E" }
  ]
});

// 3. Create title slide from master
await callTool("add_slide_from_master", {
  presentationId,
  masterId: "title-slide",
  placeholderContent: {
    title: { text: "Q4 Business Review" },
    subtitle: { text: "October - December 2024" }
  }
});

// 4. Add financial data slide with HTML table
await callTool("add_slide_from_master", {
  presentationId,
  masterId: "content-slide",
  placeholderContent: {
    title: { text: "Quarterly Revenue" }
  }
});

await callTool("import_html_table", {
  presentationId,
  html: `<table>
    <tr><th bgcolor="#2C3E50">Quarter</th><th bgcolor="#2C3E50">Revenue</th><th bgcolor="#2C3E50">Growth</th></tr>
    <tr><td><b>Q1</b></td><td align="right">$1.2M</td><td align="right" style="color: #27AE60">+12%</td></tr>
    <tr><td><b>Q2</b></td><td align="right">$1.5M</td><td align="right" style="color: #27AE60">+25%</td></tr>
    <tr><td><b>Q3</b></td><td align="right">$1.8M</td><td align="right" style="color: #27AE60">+20%</td></tr>
    <tr><td><b>Q4</b></td><td align="right">$2.1M</td><td align="right" style="color: #27AE60">+17%</td></tr>
  </table>`,
  x: 1, y: 2, w: 8, h: 2.5, fontSize: 14
});

// 5. Add dashboard slide with batch operation
await callTool("add_slide_with_content", {
  presentationId,
  backgroundColor: "F8F9FA",
  content: [
    { type: "text", data: { text: "Performance Dashboard", x: 0.5, y: 0.25, w: 9, h: 0.5, fontSize: 28, bold: true, align: "center" } },
    { type: "chart", data: {
      chartType: "line",
      chartData: [{ name: "Revenue", labels: ["Q1", "Q2", "Q3", "Q4"], values: [1.2, 1.5, 1.8, 2.1] }],
      x: 0.5, y: 1, w: 4.5, h: 2.5, title: "Revenue Trend (M$)", showValue: true
    }},
    { type: "chart", data: {
      chartType: "pie",
      chartData: [{ name: "Products", labels: ["A", "B", "C"], values: [45, 35, 20] }],
      x: 5.5, y: 1, w: 4, h: 2.5, title: "Revenue by Product", showLegend: true
    }},
    { type: "shape", data: { shape: "rect", x: 0.5, y: 3.75, w: 9, h: 1.5, fill: { color: "3498DB", transparency: 10 } } },
    { type: "text", data: { text: "Total Annual Revenue: $6.6M | YoY Growth: +18.5%", x: 0.5, y: 3.75, w: 9, h: 1.5, fontSize: 20, bold: true, align: "center", valign: "middle" } }
  ]
});

// 6. Save presentation
await callTool("save_presentation", {
  presentationId,
  fileName: "Q4-business-review.pptx",
  compression: true
});
```

## Tips for Efficient Use

1. **Define slide masters at the beginning** of your workflow for presentations that need consistent styling
2. **Use batch operations** (`add_slide_with_content`) when adding multiple elements to a slide
3. **Import HTML tables** when copying data from web sources or spreadsheets
4. **Reuse masters** throughout the presentation to maintain visual consistency
5. **Combine features** - Use masters for layout, batch operations for efficiency, and HTML import for data

These new features significantly reduce the number of tool calls needed and make it easier to create professional, consistent presentations.
