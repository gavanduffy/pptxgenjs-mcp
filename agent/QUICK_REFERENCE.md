# Quick Reference - Streamlined PptxGenJS MCP Server

## Essential Commands

```bash
# Build
npm run build:worker

# Validate configuration
npm run smithery:validate

# Deploy to Cloudflare
npm run smithery:deploy

# Local development
npm run cf:dev

# Create R2 buckets
wrangler r2 bucket create pptx
wrangler r2 bucket create pptx-preview

# Set environment secrets
wrangler secret put CLOUDFLARE_ACCOUNT_ID
wrangler secret put PUBLIC_BUCKET_URL

# View logs
wrangler tail

# Check deployment
curl https://pptxgenjs-mcp.workers.dev/health
```

## Available Tools

### 1. create_presentation
```json
{
  "name": "create_presentation",
  "arguments": {
    "presentationId": "my-pres",
    "layout": "LAYOUT_16x9",
    "title": "My Presentation",
    "author": "Your Name"
  }
}
```

### 2. add_slide
```json
{
  "name": "add_slide",
  "arguments": {
    "presentationId": "my-pres",
    "backgroundColor": "F0F0F0"
  }
}
```

### 3. add_text
```json
{
  "name": "add_text",
  "arguments": {
    "presentationId": "my-pres",
    "text": "Hello World",
    "x": 1,
    "y": 1,
    "w": 8,
    "h": 1,
    "fontSize": 32,
    "bold": true,
    "align": "center"
  }
}
```

### 4. add_image
```json
{
  "name": "add_image",
  "arguments": {
    "presentationId": "my-pres",
    "path": "https://example.com/image.png",
    "x": 2,
    "y": 2,
    "w": 6,
    "h": 4
  }
}
```

### 5. add_table
```json
{
  "name": "add_table",
  "arguments": {
    "presentationId": "my-pres",
    "rows": [
      ["Header 1", "Header 2"],
      ["Cell 1", "Cell 2"]
    ],
    "x": 1,
    "y": 1.5,
    "w": 8,
    "h": 3
  }
}
```

### 6. add_chart
```json
{
  "name": "add_chart",
  "arguments": {
    "presentationId": "my-pres",
    "type": "bar",
    "data": [
      {
        "name": "Sales",
        "labels": ["Q1", "Q2", "Q3"],
        "values": [10, 20, 30]
      }
    ],
    "x": 1,
    "y": 1.5,
    "w": 8,
    "h": 4,
    "title": "Quarterly Sales",
    "showLegend": true
  }
}
```

### 7. import_markdown_presentation
```json
{
  "name": "import_markdown_presentation",
  "arguments": {
    "presentationId": "my-pres",
    "markdown": "# Title\n\n## Subtitle\n\n- Point 1\n- Point 2",
    "options": {
      "splitLevel": 2,
      "titleSlide": true,
      "defaults": {
        "titleFontSize": 36,
        "bodyFontSize": 18,
        "textColor": "333333"
      }
    }
  }
}
```

### 8. save_presentation
```json
{
  "name": "save_presentation",
  "arguments": {
    "presentationId": "my-pres",
    "fileName": "my-presentation.pptx"
  }
}
```
**Returns:**
```json
{
  "success": true,
  "downloadUrl": "https://pptx.ACCOUNT_ID.r2.dev/my-presentation.pptx",
  "fileName": "my-presentation.pptx",
  "size": 45678
}
```

### 9. list_presentations
```json
{
  "name": "list_presentations",
  "arguments": {}
}
```

## MCP Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/mcp` | GET | SSE stream for long-running connections |
| `/mcp` | POST | JSON-RPC for single requests |
| `/health` | GET | Health check |
| `/files/{filename}` | GET | Download files from R2 |

## Configuration Files

### smithery.json
- Server metadata
- Tool capabilities
- Environment requirements
- Runtime configuration

### wrangler.toml
- Cloudflare Workers config
- R2 bucket bindings
- Environment settings
- Build commands

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `CLOUDFLARE_ACCOUNT_ID` | ✅ | Account ID for R2 URLs |
| `PUBLIC_BUCKET_URL` | ❌ | Custom domain for files |

## R2 Buckets

| Bucket | Environment | Purpose |
|--------|-------------|---------|
| `pptx` | Production | Production presentations |
| `pptx-preview` | Staging | Test presentations |

## Chart Types

- `bar` - Vertical bar chart
- `bar3D` - 3D bar chart
- `line` - Line chart
- `pie` - Pie chart
- `area` - Area chart
- `scatter` - Scatter plot
- `bubble` - Bubble chart
- `bubble3D` - 3D bubble chart
- `doughnut` - Doughnut chart
- `radar` - Radar chart

## Layout Options

- `LAYOUT_4x3` - Standard 4:3
- `LAYOUT_16x9` - Widescreen (default)
- `LAYOUT_16x10` - Widescreen alternative
- `LAYOUT_WIDE` - Ultra-wide

## Common Use Cases

### Create Simple Presentation
1. `create_presentation` → Get presentationId
2. `add_slide` → Add blank slide
3. `add_text` → Add content
4. `save_presentation` → Get download URL

### Generate from Markdown
1. `create_presentation` → Get presentationId
2. `import_markdown_presentation` → Parse markdown
3. `save_presentation` → Get download URL

### Data Visualization
1. `create_presentation` → Get presentationId
2. `add_slide` → Add slide
3. `add_chart` → Visualize data
4. `add_table` → Add data table
5. `save_presentation` → Get download URL

## Troubleshooting

### Build Errors
```bash
rm -rf dist node_modules
npm install
npm run build:worker
```

### Deployment Issues
```bash
# Check wrangler auth
wrangler whoami

# Re-login
wrangler login

# Check R2 buckets
wrangler r2 bucket list
```

### Runtime Errors
```bash
# View real-time logs
wrangler tail

# Check health
curl https://pptxgenjs-mcp.workers.dev/health
```

## URLs

- **Production**: `https://pptxgenjs-mcp.workers.dev`
- **MCP Endpoint**: `https://pptxgenjs-mcp.workers.dev/mcp`
- **Health Check**: `https://pptxgenjs-mcp.workers.dev/health`
- **File Access**: `https://pptxgenjs-mcp.workers.dev/files/{filename}`

## Support

- GitHub Issues: https://github.com/gavanduffy/pptxgenjs-mcp/issues
- Smithery: https://smithery.ai
- Cloudflare Docs: https://developers.cloudflare.com/workers/
