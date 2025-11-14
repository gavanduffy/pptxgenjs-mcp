# R2 Upload Authentication Setup

This document explains how to configure authenticated uploads to Cloudflare R2 for the PptxGenJS MCP Server.

## Overview

The MCP server supports **three methods** for R2 uploads:

1. **Cloudflare Worker URL** (Recommended) - Most secure
2. **Cloudflare API Token** - Direct API access
3. **Unauthenticated** (Development only) - Not recommended for production

## Configuration Options

When adding the server to your MCP client (Claude Desktop, Cursor, VS Code, etc.), you can provide these configuration parameters:

| Parameter | Required | Description |
|-----------|----------|-------------|
| `CLOUDFLARE_ACCOUNT_ID` | Optional | Your Cloudflare account ID |
| `PUBLIC_BUCKET_URL` | Optional | Public URL for R2 bucket (e.g., `https://r2.euan.live`) |
| `CLOUDFLARE_API_TOKEN` | Optional | Cloudflare API token with R2 write permissions |
| `R2_UPLOAD_WORKER_URL` | Optional | Custom Worker URL for secure uploads |

---

## Method 1: Cloudflare Worker (Recommended)

This is the **most secure method** as it keeps your credentials server-side and allows fine-grained control over uploads.

### Step 1: Create R2 Bucket

```bash
# Login to Cloudflare
wrangler login

# Create R2 bucket
wrangler r2 bucket create pptx-files

# Configure public access (optional)
wrangler r2 bucket domain add pptx-files --domain r2.yourdomain.com
```

### Step 2: Create Worker

Use the provided worker template at `agent/r2-upload-worker.ts`:

```bash
# Create new worker project
mkdir r2-upload-worker
cd r2-upload-worker
npm init -y
npm install wrangler --save-dev

# Copy the worker code
cp ../agent/r2-upload-worker.ts ./src/index.ts
```

### Step 3: Configure wrangler.toml

```toml
name = "r2-upload-worker"
main = "src/index.ts"
compatibility_date = "2025-01-01"

[[r2_buckets]]
binding = "PPTX_BUCKET"
bucket_name = "pptx-files"

[vars]
ALLOWED_ORIGINS = "*"  # Or specific domains: "https://app1.com,https://app2.com"
# UPLOAD_AUTH_TOKEN = "optional-secret-token"  # Uncomment for extra security
```

### Step 4: Deploy Worker

```bash
wrangler deploy
```

You'll get a URL like: `https://r2-upload-worker.your-name.workers.dev`

### Step 5: Configure MCP Server

When adding the server to your app, provide:

```json
{
  "R2_UPLOAD_WORKER_URL": "https://r2-upload-worker.your-name.workers.dev",
  "PUBLIC_BUCKET_URL": "https://r2.yourdomain.com"
}
```

**For Claude Desktop** (`~/Library/Application Support/Claude/claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "pptxgenjs": {
      "url": "https://your-smithery-url.ngrok.io/mcp",
      "config": {
        "R2_UPLOAD_WORKER_URL": "https://r2-upload-worker.your-name.workers.dev",
        "PUBLIC_BUCKET_URL": "https://r2.yourdomain.com"
      }
    }
  }
}
```

**For Cursor/VS Code** (`.cursor/config.json` or `.vscode/settings.json`):

```json
{
  "mcp.servers": {
    "pptxgenjs": {
      "type": "http",
      "url": "https://your-smithery-url.ngrok.io/mcp",
      "config": {
        "R2_UPLOAD_WORKER_URL": "https://r2-upload-worker.your-name.workers.dev",
        "PUBLIC_BUCKET_URL": "https://r2.yourdomain.com"
      }
    }
  }
}
```

---

## Method 2: Cloudflare API Token

This method uses direct API access with authentication.

### Step 1: Create API Token

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com/profile/api-tokens)
2. Click "Create Token"
3. Use "Custom Token" template
4. Set permissions:
   - **Account** > **R2** > **Edit**
5. Set Account Resources to your account
6. Create token and copy it

### Step 2: Get Account ID

Find your account ID in the Cloudflare dashboard URL:
```
https://dash.cloudflare.com/{account-id}/r2
```

### Step 3: Configure MCP Server

When adding the server, provide:

```json
{
  "CLOUDFLARE_ACCOUNT_ID": "your-account-id-here",
  "PUBLIC_BUCKET_URL": "https://r2.yourdomain.com",
  "CLOUDFLARE_API_TOKEN": "your-api-token-here"
}
```

**For Claude Desktop**:

```json
{
  "mcpServers": {
    "pptxgenjs": {
      "url": "https://your-smithery-url.ngrok.io/mcp",
      "config": {
        "CLOUDFLARE_ACCOUNT_ID": "your-account-id-here",
        "PUBLIC_BUCKET_URL": "https://r2.yourdomain.com",
        "CLOUDFLARE_API_TOKEN": "your-api-token-here"
      }
    }
  }
}
```

---

## Method 3: Development Mode (No Auth)

⚠️ **Not recommended for production** - Only for local development/testing.

This will attempt uploads without authentication and will likely fail with production R2 buckets.

```json
{
  "PUBLIC_BUCKET_URL": "https://r2.yourdomain.com"
}
```

---

## Usage

Once configured, use the `save_presentation` tool with `uploadToR2: true`:

```typescript
// Create presentation
await mcp.callTool('create_presentation', {
  presentationId: 'my-pres',
  title: 'My Presentation'
});

// Add slides and content
await mcp.callTool('add_slide', { presentationId: 'my-pres' });
await mcp.callTool('add_text', { 
  presentationId: 'my-pres',
  text: 'Hello World',
  x: 1, y: 1, w: 8, h: 1
});

// Save and upload to R2
const result = await mcp.callTool('save_presentation', {
  presentationId: 'my-pres',
  fileName: 'my-presentation.pptx',
  uploadToR2: true
});

console.log(result.r2Url); // https://r2.yourdomain.com/my-presentation.pptx
```

---

## Troubleshooting

### Upload returns 401 Unauthorized

- **Worker URL**: Check that the worker is deployed and the URL is correct
- **API Token**: Verify token has R2 Edit permissions for your account
- **Public URL**: Ensure you're not trying to upload directly to a public URL without auth

### Upload returns 403 Forbidden

- Check R2 bucket CORS settings
- Verify API token has correct permissions
- Ensure account ID is correct

### Upload returns 413 Request Entity Too Large

- Default max file size is 50MB
- Modify the worker to increase limit if needed
- Consider using compression: `compression: true`

### Worker returns 500 Internal Server Error

- Check worker logs: `wrangler tail r2-upload-worker`
- Verify R2 bucket binding is correct
- Ensure bucket exists and is accessible

---

## Security Best Practices

1. **Use Worker URL method** - Keeps credentials server-side
2. **Set CORS origins** - Restrict access to specific domains
3. **Add rate limiting** - Prevent abuse in worker
4. **Use auth tokens** - Add `UPLOAD_AUTH_TOKEN` to worker for extra security
5. **Validate filenames** - Prevent path traversal attacks
6. **Set file size limits** - Prevent storage abuse
7. **Add cleanup jobs** - Delete old files automatically
8. **Monitor usage** - Track upload patterns in Cloudflare Analytics

---

## Advanced: Adding Authentication Token to Worker

For extra security, add an upload auth token:

```toml
# wrangler.toml
[vars]
UPLOAD_AUTH_TOKEN = "your-secret-token-here"
```

Then update MCP client config:

```json
{
  "R2_UPLOAD_WORKER_URL": "https://r2-upload-worker.your-name.workers.dev",
  "PUBLIC_BUCKET_URL": "https://r2.yourdomain.com",
  "UPLOAD_AUTH_TOKEN": "your-secret-token-here"
}
```

The worker will check for `Authorization: Bearer your-secret-token-here` header.

---

## Cost Considerations

Cloudflare R2 pricing:
- **Storage**: $0.015/GB/month
- **Class A operations** (writes): $4.50 per million
- **Class B operations** (reads): $0.36 per million
- **Egress**: Free (no data transfer fees)

Workers pricing:
- **Free tier**: 100,000 requests/day
- **Paid**: $5/month for 10 million requests

For typical usage (100 uploads/day), costs are minimal (< $1/month).

---

## Support

For issues or questions:
- GitHub: [pptxgenjs-mcp](https://github.com/gavanduffy/pptxgenjs-mcp)
- Cloudflare Docs: [R2 Documentation](https://developers.cloudflare.com/r2/)
- Workers Docs: [Workers Documentation](https://developers.cloudflare.com/workers/)
