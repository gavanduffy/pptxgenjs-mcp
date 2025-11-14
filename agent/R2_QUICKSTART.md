# Quick Start: R2 Upload Authentication

## 🚀 Choose Your Method

### Option 1: Worker URL (Recommended - Most Secure)

**Setup:**
1. Deploy the worker from `agent/r2-upload-worker.ts`
2. Get your worker URL: `https://r2-upload-worker.your-name.workers.dev`

**Config:**
```json
{
  "R2_UPLOAD_WORKER_URL": "https://r2-upload-worker.your-name.workers.dev",
  "PUBLIC_BUCKET_URL": "https://r2.yourdomain.com"
}
```

---

### Option 2: API Token (Direct Access)

**Setup:**
1. Create API token at [Cloudflare Dashboard](https://dash.cloudflare.com/profile/api-tokens)
2. Grant **R2 Edit** permissions
3. Copy your Account ID from dashboard

**Config:**
```json
{
  "CLOUDFLARE_API_TOKEN": "your-api-token-here",
  "CLOUDFLARE_ACCOUNT_ID": "your-account-id",
  "PUBLIC_BUCKET_URL": "https://r2.yourdomain.com"
}
```

---

## 📱 Add to Your App

### Claude Desktop
File: `~/Library/Application Support/Claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "pptxgenjs": {
      "url": "https://your-server.ngrok.io/mcp",
      "config": {
        "R2_UPLOAD_WORKER_URL": "your-worker-url",
        "PUBLIC_BUCKET_URL": "your-bucket-url"
      }
    }
  }
}
```

### Cursor
File: `.cursor/config.json`

```json
{
  "mcp.servers": {
    "pptxgenjs": {
      "type": "http",
      "url": "https://your-server.ngrok.io/mcp",
      "config": {
        "CLOUDFLARE_API_TOKEN": "your-token",
        "CLOUDFLARE_ACCOUNT_ID": "your-id",
        "PUBLIC_BUCKET_URL": "your-bucket-url"
      }
    }
  }
}
```

---

## 🎯 Usage

```typescript
// Save with R2 upload
const result = await mcp.callTool('save_presentation', {
  presentationId: 'my-pres',
  fileName: 'my-file.pptx',
  uploadToR2: true  // Enable R2 upload
});

// Get the URL
console.log(result.r2Url); 
// → https://r2.yourdomain.com/my-file.pptx
```

---

## 🔍 Troubleshooting

| Error | Solution |
|-------|----------|
| 401 Unauthorized | Check API token permissions |
| 403 Forbidden | Verify account ID is correct |
| Upload not configured | Add `PUBLIC_BUCKET_URL` or `R2_UPLOAD_WORKER_URL` |

---

## 📚 Full Documentation

See `agent/R2_AUTHENTICATION.md` for complete setup instructions.
