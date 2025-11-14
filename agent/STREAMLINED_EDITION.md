# PptxGenJS MCP Server - Streamlined HTTP Edition

## Overview

This is a streamlined version of the PptxGenJS MCP server optimized for Cloudflare Workers deployment with R2 storage integration. The server runs as an HTTP-streamable service and is configured for easy deployment via Smithery.

## Key Changes

### 1. Streamlined to Essential Tools

The server now focuses on core presentation creation capabilities:

**✅ Included Tools:**
- `create_presentation` - Create presentations with custom layouts
- `add_slide` - Add slides with backgrounds
- `add_text` - Add formatted text
- `add_image` - Add images from URLs or base64
- `add_table` - Create tables with styling
- `add_chart` - Generate charts (bar, line, pie, etc.)
- `import_markdown_presentation` - Convert Markdown to slides
- `save_presentation` - Save to R2 and return download URL
- `list_presentations` - List active presentations

**❌ Removed (Advanced/Less Common):**
- Template system (convert_pptx_to_template, save_template, load_template, etc.)
- Slide masters (define_slide_master, add_slide_from_master)
- Image search (search_and_add_image)
- HTML table import (import_html_table)
- Batch operations (add_slide_with_content)
- Export variants (export_presentation)
- Layout definition (define_layout)
- Sections (add_section)
- Notes (add_notes)

### 2. HTTP-Streamable Transport

- Migrated from SSE to modern `StreamableHTTPServerTransport`
- Unified `/mcp` endpoint supporting both GET (SSE) and POST (JSON-RPC)
- Compatible with Claude Desktop and other MCP clients
- CORS enabled for browser access

### 3. R2 Storage Integration

- All presentations saved to Cloudflare R2
- Public download URLs generated automatically
- Optional custom domain support
- File access via `/files/` endpoint or direct R2 URLs

### 4. Smithery Deployment Ready

Created `smithery.yaml` with:
- Server metadata and capabilities
- Required environment variables
- Cloudflare Workers runtime configuration
- **streamable-http** transport protocol specification
- Tool descriptions for directory listing

## Deployment

### Via Smithery (Recommended)

```bash
npm run smithery:deploy
```

### Manual Deployment

```bash
# Login to Cloudflare
wrangler login

# Create R2 buckets
wrangler r2 bucket create pptx
wrangler r2 bucket create pptx-preview

# Set secrets
wrangler secret put CLOUDFLARE_ACCOUNT_ID

# Build and deploy
npm run build:worker
wrangler deploy
```

## Architecture

```
┌─────────────────┐
│   Claude/Client │
└────────┬────────┘
         │ HTTP/SSE
         ▼
┌─────────────────────────┐
│  Cloudflare Workers     │
│  ┌─────────────────┐    │
│  │  MCP Server     │    │
│  │  /mcp endpoint  │    │
│  └────────┬────────┘    │
│           │             │
│           ▼             │
│  ┌─────────────────┐    │
│  │  R2 Storage     │    │
│  │  (pptx files)   │    │
│  └─────────────────┘    │
└─────────────────────────┘
```

## File Structure

```
src/
├── cloudflare-worker.ts    # HTTP-streamable MCP server
├── markdown.ts             # Markdown import shared module
└── index.ts               # Node stdio server (still available)

smithery.yaml             # Smithery deployment config (YAML format)
wrangler.toml             # Cloudflare Workers config
SMITHERY_DEPLOYMENT.md    # Deployment guide
```

## Usage Example

```javascript
// Create presentation
const response = await fetch('https://pptxgenjs-mcp.workers.dev/mcp', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    jsonrpc: '2.0',
    id: 1,
    method: 'tools/call',
    params: {
      name: 'create_presentation',
      arguments: {
        presentationId: 'demo',
        layout: 'LAYOUT_16x9',
        title: 'My Presentation'
      }
    }
  })
});

// Add slide with text
await fetch('...', {
  method: 'POST',
  body: JSON.stringify({
    method: 'tools/call',
    params: {
      name: 'add_slide',
      arguments: { presentationId: 'demo' }
    }
  })
});

// Save and get download URL
const saveResponse = await fetch('...', {
  method: 'POST',
  body: JSON.stringify({
    method: 'tools/call',
    params: {
      name: 'save_presentation',
      arguments: {
        presentationId: 'demo',
        fileName: 'my-presentation.pptx'
      }
    }
  })
});

// Returns: { downloadUrl: 'https://...', size: 12345 }
```

## Configuration

### Environment Variables

Set via `wrangler secret put`:

- `CLOUDFLARE_ACCOUNT_ID` - Required for R2 public URLs
- `PUBLIC_BUCKET_URL` - Optional custom domain

### R2 Buckets

Defined in `wrangler.toml`:
- Production: `pptx`
- Preview/Staging: `pptx-preview`

## Testing

Local development:
```bash
npm run cf:dev
```

Test the deployed server:
```bash
curl https://pptxgenjs-mcp.workers.dev/health
```

## Next Steps

1. **Deploy to Cloudflare**: `npm run smithery:deploy`
2. **Create R2 Buckets**: `wrangler r2 bucket create pptx`
3. **Set Account ID**: `wrangler secret put CLOUDFLARE_ACCOUNT_ID`
4. **Configure Claude Desktop**: Add server to `claude_desktop_config.json`
5. **Start Creating**: Use tools to generate presentations

## Benefits of This Approach

✅ **Simplified**: Focused on essential tools, easier to maintain
✅ **Scalable**: Cloudflare Workers global distribution
✅ **Reliable**: R2 storage with 99.9% durability
✅ **Cost-Effective**: Free tier covers most use cases
✅ **Fast**: Edge deployment reduces latency
✅ **Stateless**: No server maintenance required
✅ **Smithery-Ready**: One-click deployment support

## Comparison: Before vs After

| Feature | Before | After |
|---------|--------|-------|
| Total Tools | 20+ | 9 core tools |
| Transport | SSE only | HTTP Streamable |
| Storage | Local files | R2 cloud storage |
| Deployment | Self-hosted | Cloudflare Workers |
| Scalability | Single instance | Global edge |
| Cost | Server costs | Free tier available |
| Maintenance | Manual | Managed by Cloudflare |

## Documentation

- **Smithery Deployment**: See [SMITHERY_DEPLOYMENT.md](./SMITHERY_DEPLOYMENT.md)
- **Cloudflare Setup**: See [agent/CLOUDFLARE_DEPLOYMENT.md](./agent/CLOUDFLARE_DEPLOYMENT.md)
- **API Reference**: See [README.md](./README.md)

## Support

- **Issues**: https://github.com/gavanduffy/pptxgenjs-mcp/issues
- **Smithery**: https://smithery.ai
- **Cloudflare**: https://developers.cloudflare.com/workers/
