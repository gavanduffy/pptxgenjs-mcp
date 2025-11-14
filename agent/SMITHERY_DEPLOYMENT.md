# Smithery Deployment Guide

This guide explains how to deploy the PptxGenJS MCP Server to Cloudflare Workers via Smithery.

## What is Smithery?

[Smithery](https://smithery.ai) is a platform that simplifies the deployment and management of MCP servers. It provides one-click deployment to cloud platforms like Cloudflare Workers and handles all the infrastructure configuration.

This server uses the **streamable-http** transport protocol as required by Smithery, enabling efficient bidirectional communication between MCP clients and the server.

## Prerequisites

1. **Cloudflare Account**
   - Sign up at https://dash.cloudflare.com
   - Enable Workers (free tier available)
   - Enable R2 storage (free tier: 10GB storage, 1M reads/month)

2. **Cloudflare Account ID**
   - Found in your Cloudflare dashboard
   - Navigate to Workers & Pages → Overview
   - Copy your Account ID from the right sidebar

3. **Wrangler CLI** (for manual setup)
   ```bash
   npm install -g wrangler
   wrangler login
   ```

## Quick Deployment via Smithery

### Option 1: One-Click Deploy (Recommended)

1. Visit the [Smithery Directory](https://smithery.ai/servers)
2. Search for "pptxgenjs-mcp"
3. Click "Deploy to Cloudflare"
4. Follow the prompts to:
   - Connect your Cloudflare account
   - Set environment variables
   - Create R2 bucket
5. Your server will be live at: `https://pptxgenjs-mcp.workers.dev/mcp`

### Option 2: Manual Deployment

1. **Clone and Build**
   ```bash
   git clone https://github.com/gavanduffy/pptxgenjs-mcp.git
   cd pptxgenjs-mcp
   npm install
   npm run build:worker
   ```

2. **Create R2 Buckets**
   ```bash
   wrangler r2 bucket create pptx
   wrangler r2 bucket create pptx-preview
   ```

3. **Configure Environment**
   
   Set your Cloudflare Account ID:
   ```bash
   wrangler secret put CLOUDFLARE_ACCOUNT_ID
   # Enter your account ID when prompted
   ```

   (Optional) Set custom public bucket URL:
   ```bash
   wrangler secret put PUBLIC_BUCKET_URL
   # Example: https://files.yourdomain.com
   ```

4. **Deploy to Cloudflare**
   ```bash
   npm run smithery:deploy
   ```

5. **Verify Deployment**
   ```bash
   curl https://pptxgenjs-mcp.workers.dev/health
   ```

## Configuration

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `CLOUDFLARE_ACCOUNT_ID` | Yes | Your Cloudflare account ID for R2 URLs |
| `PUBLIC_BUCKET_URL` | No | Custom domain for R2 bucket access |

### R2 Bucket Setup

The server uses two R2 buckets:

- **Production**: `pptx` - For production presentations
- **Preview**: `pptx-preview` - For staging/testing

Enable public access to allow file downloads:
```bash
# Make bucket publicly readable
wrangler r2 bucket update pptx --public-access
```

### Custom Domain (Optional)

To use a custom domain for your MCP endpoint:

1. Add domain to Cloudflare
2. Update `wrangler.toml`:
   ```toml
   routes = [
     { pattern = "mcp.yourdomain.com/*", custom_domain = true }
   ]
   ```
3. Deploy: `npm run deploy`

For R2 custom domain:
```toml
[vars]
PUBLIC_BUCKET_URL = "https://files.yourdomain.com"
```

## Using with Claude Desktop

After deployment, configure Claude Desktop to use your server:

**For Cloudflare Workers deployment:**

```json
{
  "mcpServers": {
    "pptxgenjs": {
      "url": "https://pptxgenjs-mcp.workers.dev/mcp",
      "transport": {
        "type": "http",
        "sse": true
      }
    }
  }
}
```

Add to `~/Library/Application Support/Claude/claude_desktop_config.json` (macOS) or equivalent.

## Available Tools

The deployed server provides these tools:

- `create_presentation` - Create new PowerPoint presentations
- `add_slide` - Add slides to presentations
- `add_text` - Add formatted text to slides
- `add_image` - Add images from URLs or base64
- `add_table` - Create tables with custom styling
- `add_chart` - Generate charts (bar, line, pie, etc.)
- `import_markdown_presentation` - Create slides from Markdown
- `save_presentation` - Save to R2 and get download URL
- `list_presentations` - List active presentations

## File Storage

All generated presentations are stored in Cloudflare R2:

- **Storage Location**: `https://pptx.ACCOUNT_ID.r2.dev/filename.pptx`
- **Custom Domain**: `https://files.yourdomain.com/filename.pptx` (if configured)
- **Retention**: Files persist indefinitely (manage via R2 lifecycle policies)

### Accessing Files

Files are publicly accessible via:
1. Direct R2 URL (if public access enabled)
2. Worker endpoint: `https://pptxgenjs-mcp.workers.dev/files/filename.pptx`
3. Custom domain (if configured)

## Monitoring

### View Logs
```bash
wrangler tail
```

### Check Metrics
Visit your Cloudflare dashboard → Workers & Pages → pptxgenjs-mcp → Metrics

### Health Check
```bash
curl https://pptxgenjs-mcp.workers.dev/health
```

## Updating the Server

To update to the latest version:

```bash
git pull
npm install
npm run smithery:deploy
```

## Troubleshooting

### Common Issues

**Error: "R2 bucket not found"**
- Solution: Create the bucket: `wrangler r2 bucket create pptx`

**Error: "CLOUDFLARE_ACCOUNT_ID is not set"**
- Solution: `wrangler secret put CLOUDFLARE_ACCOUNT_ID`

**Error: "Failed to upload to R2"**
- Check R2 bucket binding in `wrangler.toml`
- Verify bucket exists: `wrangler r2 bucket list`

**Files not accessible via public URL**
- Enable public access: `wrangler r2 bucket update pptx --public-access`
- Or use the `/files/` endpoint

### Debug Mode

Enable detailed logging:
```bash
wrangler tail --format pretty
```

## Cost Estimation

Cloudflare Workers + R2 Free Tier:
- Workers: 100,000 requests/day
- R2 Storage: 10 GB
- R2 Reads: 1,000,000/month
- R2 Writes: 1,000,000/month

Typical usage:
- Small presentation (~100KB): ~0.0001 GB storage
- 1000 presentations/month: ~100 MB storage, well within free tier

## Security

The server implements:
- CORS headers for browser access
- R2 bucket isolation
- Stateless operation (no user data stored)
- Optional authentication via Cloudflare Access

To add authentication:
```toml
# In wrangler.toml
[env.production]
vars = { REQUIRE_AUTH = "true" }
```

## Support

- **Issues**: https://github.com/gavanduffy/pptxgenjs-mcp/issues
- **Smithery**: https://smithery.ai/support
- **Cloudflare Docs**: https://developers.cloudflare.com/workers/

## Next Steps

- Add custom branding to presentations
- Integrate with your existing workflows
- Explore advanced PptxGenJS features
- Set up automated backups for R2 bucket
