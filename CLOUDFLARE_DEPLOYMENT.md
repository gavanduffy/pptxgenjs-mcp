# Cloudflare Workers Deployment Guide

This guide explains how to deploy the PptxGenJS MCP Server to Cloudflare Workers with R2 storage for presentations.

## Overview

The Cloudflare Workers deployment provides:
- **HTTP/SSE-based MCP Server** - Compatible with the Model Context Protocol over HTTP
- **R2 Storage** - S3-compatible object storage for PPTX files
- **Public Download URLs** - Generated presentations are accessible via public URLs
- **Automatic Deployment** - GitHub Actions workflow for CI/CD
- **Scalable & Fast** - Edge deployment with global distribution

## Prerequisites

1. **Cloudflare Account** - Sign up at https://dash.cloudflare.com/sign-up
2. **Wrangler CLI** - Cloudflare's CLI tool for Workers
3. **Node.js 18+** - Required for building the project

## Setup Instructions

### 1. Install Wrangler CLI

```bash
npm install -g wrangler
```

### 2. Authenticate with Cloudflare

```bash
wrangler login
```

This will open a browser window to authenticate with your Cloudflare account.

### 3. Create R2 Bucket

Create an R2 bucket for storing PPTX files:

```bash
wrangler r2 bucket create pptx
```

For staging/preview:

```bash
wrangler r2 bucket create pptx-preview
```

### 4. Configure Public Access (Optional but Recommended)

To allow public downloads of generated presentations:

1. Go to Cloudflare Dashboard → R2
2. Select your `pptx` bucket
3. Go to Settings → Public Access
4. Click "Allow Access" and note the public URL (e.g., `https://pub-xxxxx.r2.dev`)
5. Update `wrangler.toml` with your public bucket URL:

```toml
[env.production]
vars = { PUBLIC_BUCKET_URL = "https://pub-xxxxx.r2.dev" }
```

Alternatively, you can use a custom domain:

1. Go to R2 bucket settings → Custom Domains
2. Add your domain (e.g., `files.yourdomain.com`)
3. Update the `PUBLIC_BUCKET_URL` in `wrangler.toml`

### 5. Configure Environment Variables

Set your Cloudflare Account ID as a secret:

```bash
# Get your account ID from the Cloudflare dashboard or:
wrangler whoami

# Set it as an environment variable (optional, for URL generation)
wrangler secret put CLOUDFLARE_ACCOUNT_ID
```

## Local Development

### Build the Worker

```bash
npm install
npm run build:worker
```

### Run Locally

```bash
npm run dev:worker
```

This starts a local development server at `http://localhost:8787`

### Test Endpoints

- **Health Check**: `GET http://localhost:8787/health`
- **MCP SSE Stream**: `GET http://localhost:8787/mcp`
- **MCP Messages**: `POST http://localhost:8787/messages`

## Deployment

### Manual Deployment

```bash
npm run deploy
```

or directly with wrangler:

```bash
wrangler deploy
```

### Automatic Deployment via GitHub Actions

The repository includes a GitHub Actions workflow that automatically deploys to Cloudflare Workers on every push to `main` or `production` branches.

#### Setup GitHub Secrets

1. Go to your GitHub repository → Settings → Secrets and variables → Actions
2. Add the following secrets:

   - **CLOUDFLARE_API_TOKEN**
     - Go to Cloudflare Dashboard → My Profile → API Tokens
     - Click "Create Token"
     - Use the "Edit Cloudflare Workers" template
     - Add Account and Zone resources as needed
     - Copy the token and add it as a GitHub secret

   - **CLOUDFLARE_ACCOUNT_ID**
     - Go to Cloudflare Dashboard → Workers & Pages
     - Copy your Account ID from the right sidebar
     - Add it as a GitHub secret

#### Trigger Deployment

Push to the main branch or manually trigger the workflow:

```bash
git push origin main
```

Or use the GitHub Actions tab to manually trigger the "Deploy to Cloudflare Workers" workflow.

## Usage

Once deployed, your MCP server will be available at:

```
https://pptxgenjs-mcp.<your-subdomain>.workers.dev
```

### Client Configuration

To use the deployed MCP server with a client like Claude Desktop, you'll need to configure it to use the HTTP/SSE transport instead of stdio.

Example configuration (this depends on MCP client support for HTTP/SSE):

```json
{
  "mcpServers": {
    "pptxgenjs-cloudflare": {
      "url": "https://pptxgenjs-mcp.<your-subdomain>.workers.dev/mcp",
      "transport": "sse"
    }
  }
}
```

### API Endpoints

#### Health Check
```bash
GET /health
```

Returns server status.

#### MCP SSE Stream
```bash
GET /mcp
```

Establishes an SSE connection for MCP communication.

#### Message Handler
```bash
POST /messages?sessionId=<session-id>
```

Receives MCP messages for a specific session.

#### File Downloads
```bash
GET /files/<filename>.pptx
```

Downloads a generated presentation file from R2 storage.

## Features

### Core MCP Tools Available

All the standard PptxGenJS MCP tools are available:

- `create_presentation` - Create a new presentation
- `add_slide` - Add slides to presentations
- `add_text` - Add formatted text
- `add_shape` - Add shapes
- `add_image` - Add images
- `add_table` - Add tables
- `add_chart` - Add charts
- `save_presentation` - **Save to R2 and get public download URL**
- `list_presentations` - List active presentations

### Key Differences from Stdio Version

1. **File Storage**: Files are saved to Cloudflare R2 instead of local filesystem
2. **Public URLs**: `save_presentation` returns a public download URL
3. **Session Management**: Presentations are stored per-session (consider Durable Objects for production)
4. **HTTP Transport**: Uses HTTP/SSE instead of stdio for communication

## Architecture

```
┌─────────────────┐
│  MCP Client     │
│  (Claude, etc.) │
└────────┬────────┘
         │ HTTP/SSE
         ▼
┌─────────────────────────┐
│ Cloudflare Worker       │
│ ┌─────────────────────┐ │
│ │ MCP Server (SSE)    │ │
│ │ - create_pres       │ │
│ │ - add_slide         │ │
│ │ - add_text/image    │ │
│ │ - save_pres         │ │
│ └──────────┬──────────┘ │
└────────────┼────────────┘
             │
             ▼
      ┌──────────────┐
      │ R2 Storage   │
      │ (S3-compat)  │
      │              │
      │ *.pptx files │
      └──────────────┘
             │
             │ Public URL
             ▼
      ┌──────────────┐
      │   End Users  │
      │  (Downloads) │
      └──────────────┘
```

## Monitoring & Logs

### View Logs

```bash
wrangler tail
```

### Check Deployment Status

```bash
wrangler deployments list
```

### R2 Bucket Statistics

```bash
wrangler r2 bucket list
wrangler r2 object list pptx
```

## Troubleshooting

### Build Errors

If you encounter build errors:

```bash
# Clean and rebuild
rm -rf dist node_modules
npm install
npm run build:worker
```

### R2 Access Issues

If files aren't accessible:

1. Check bucket public access settings in Cloudflare Dashboard
2. Verify the `PUBLIC_BUCKET_URL` in `wrangler.toml`
3. Test file access: `curl https://<public-url>/<filename>.pptx`

### Worker Not Responding

1. Check worker logs: `wrangler tail`
2. Verify deployment: `wrangler deployments list`
3. Test health endpoint: `curl https://<worker-url>/health`

### GitHub Actions Deployment Fails

1. Verify GitHub secrets are set correctly
2. Check that the repository has necessary permissions
3. Review the Actions log for specific errors

## Cost Estimation

Cloudflare Workers has a generous free tier:

- **Workers**: 100,000 requests/day free
- **R2 Storage**: 10 GB storage free, 1 million Class A operations free
- **R2 Bandwidth**: Free egress (unlike S3!)

For most use cases, the free tier should be sufficient.

## Security Considerations

1. **Authentication**: Consider adding authentication middleware for production use
2. **Rate Limiting**: Implement rate limiting to prevent abuse
3. **File Cleanup**: Set up R2 lifecycle policies to delete old files
4. **CORS**: Configure CORS headers based on your client requirements

## Next Steps

1. **Custom Domain**: Add a custom domain for your worker
2. **Durable Objects**: Implement Durable Objects for better session management
3. **Template Storage**: Store presentation templates in R2
4. **Webhooks**: Add webhook notifications when presentations are generated
5. **Analytics**: Integrate with Cloudflare Analytics for monitoring

## Resources

- [Cloudflare Workers Documentation](https://developers.cloudflare.com/workers/)
- [R2 Storage Documentation](https://developers.cloudflare.com/r2/)
- [Wrangler CLI Reference](https://developers.cloudflare.com/workers/wrangler/)
- [MCP Protocol Specification](https://modelcontextprotocol.io/)

## Support

For issues or questions:
- GitHub Issues: [Create an issue](https://github.com/your-repo/issues)
- Cloudflare Community: [Cloudflare Community Forum](https://community.cloudflare.com/)
