# Cloudflare Workers Quick Setup Guide

This is a step-by-step guide to get your PptxGenJS MCP Server running on Cloudflare Workers in under 10 minutes.

## Prerequisites

- Node.js 18+ installed
- A Cloudflare account (free tier works)
- Git repository access (for GitHub Actions deployment)

## Step 1: Install Dependencies

```bash
# Clone the repository (if not already done)
git clone <your-repo-url>
cd pptxgenjs-mcp

# Install dependencies
npm install

# Install Wrangler globally
npm install -g wrangler
```

## Step 2: Authenticate with Cloudflare

```bash
wrangler login
```

This will open a browser window. Log in with your Cloudflare account and authorize Wrangler.

## Step 3: Create R2 Bucket

```bash
# Create production bucket
wrangler r2 bucket create pptx

# Create preview/staging bucket
wrangler r2 bucket create pptx-preview
```

## Step 4: Build the Worker

```bash
npm run build:worker
```

## Step 5: Deploy to Cloudflare Workers

```bash
npm run deploy
```

Or directly with wrangler:

```bash
wrangler deploy
```

## Step 6: Configure Public Access for R2 Bucket

To allow users to download generated presentations:

### Option A: Use R2.dev Domain (Simplest)

1. Go to [Cloudflare Dashboard → R2](https://dash.cloudflare.com/?to=/:account/r2)
2. Click on your `pptx` bucket
3. Go to **Settings** → **Public Access**
4. Click **Allow Access**
5. Copy the public R2.dev URL (e.g., `https://pub-xxxxx.r2.dev`)
6. Update `wrangler.toml`:

```toml
[env.production]
vars = { PUBLIC_BUCKET_URL = "https://pub-xxxxx.r2.dev" }
```

7. Redeploy: `npm run deploy`

### Option B: Use Custom Domain (Recommended for Production)

1. In your R2 bucket settings, click **Custom Domains**
2. Click **Connect Domain**
3. Enter your domain (e.g., `files.yourdomain.com`)
4. Follow the DNS setup instructions
5. Update `wrangler.toml`:

```toml
[env.production]
vars = { PUBLIC_BUCKET_URL = "https://files.yourdomain.com" }
```

6. Redeploy: `npm run deploy`

## Step 7: Test Your Deployment

### Test Health Endpoint

```bash
curl https://pptxgenjs-mcp.<your-subdomain>.workers.dev/health
```

Expected response:
```json
{"status":"ok","service":"pptxgenjs-mcp"}
```

### Test MCP Endpoint

```bash
curl https://pptxgenjs-mcp.<your-subdomain>.workers.dev/mcp
```

This should establish an SSE stream connection.

## Step 8: Set Up GitHub Actions (Optional)

For automatic deployment on every push to main:

1. Go to your GitHub repository → **Settings** → **Secrets and variables** → **Actions**

2. Add these secrets:

   **CLOUDFLARE_API_TOKEN:**
   - Go to [Cloudflare Dashboard → My Profile → API Tokens](https://dash.cloudflare.com/profile/api-tokens)
   - Click **Create Token**
   - Use the **Edit Cloudflare Workers** template
   - Generate and copy the token
   - Add it as a GitHub secret

   **CLOUDFLARE_ACCOUNT_ID:**
   - Go to [Cloudflare Dashboard → Workers & Pages](https://dash.cloudflare.com/?to=/:account/workers)
   - Copy your Account ID from the right sidebar
   - Add it as a GitHub secret

3. Push to main branch:

```bash
git add .
git commit -m "Setup Cloudflare Workers deployment"
git push origin main
```

The GitHub Action will automatically deploy your worker.

## Usage Examples

### Create a Presentation

Since this is an MCP server, you'll typically interact with it through an MCP client like Claude. However, for direct testing:

The worker exposes these endpoints:
- `GET /health` - Health check
- `GET /mcp` - MCP SSE stream endpoint
- `POST /messages` - MCP message handler
- `GET /files/<filename>` - Download files from R2

### Download a File

Once a presentation is saved, you'll get a download URL like:

```
https://pub-xxxxx.r2.dev/my-presentation.pptx
```

or

```
https://files.yourdomain.com/my-presentation.pptx
```

You can directly download it:

```bash
curl -O https://pub-xxxxx.r2.dev/my-presentation.pptx
```

## Monitoring

### View Live Logs

```bash
wrangler tail
```

### Check Recent Deployments

```bash
wrangler deployments list
```

### List Files in R2 Bucket

```bash
wrangler r2 object list pptx
```

## Troubleshooting

### Issue: "Bucket not found"

Make sure you created the bucket:
```bash
wrangler r2 bucket list
```

If not listed, create it:
```bash
wrangler r2 bucket create pptx
```

### Issue: "Files not accessible"

1. Check if public access is enabled on your R2 bucket
2. Verify the `PUBLIC_BUCKET_URL` in `wrangler.toml`
3. Try accessing a file directly: `curl https://<your-public-url>/test.pptx`

### Issue: "Build fails"

Clean and rebuild:
```bash
rm -rf dist node_modules
npm install
npm run build:worker
```

### Issue: "Worker not responding"

1. Check deployment status: `wrangler deployments list`
2. View logs: `wrangler tail`
3. Test health endpoint: `curl https://<worker-url>/health`

## Cost Information

Cloudflare offers generous free tiers:

| Service | Free Tier |
|---------|-----------|
| Workers | 100,000 requests/day |
| R2 Storage | 10 GB storage |
| R2 Class A Operations | 1 million/month |
| R2 Class B Operations | 10 million/month |
| R2 Egress | Unlimited (Free!) |

For most use cases, you won't exceed the free tier.

## Next Steps

- [ ] Add authentication to your worker
- [ ] Set up a custom domain
- [ ] Configure R2 lifecycle policies for auto-deletion of old files
- [ ] Add monitoring and alerts
- [ ] Implement rate limiting
- [ ] Set up staging environment

## Advanced Configuration

### Environment Variables

You can set environment variables in `wrangler.toml`:

```toml
[env.production]
vars = { 
  PUBLIC_BUCKET_URL = "https://files.yourdomain.com",
  MAX_FILE_SIZE = "100000000"
}
```

### Secrets

For sensitive data:

```bash
wrangler secret put API_KEY
wrangler secret put DATABASE_URL
```

### Custom Routes

Add custom routes in `wrangler.toml`:

```toml
routes = [
  { pattern = "mcp.yourdomain.com/*", custom_domain = true }
]
```

## Resources

- [Full Deployment Guide](./CLOUDFLARE_DEPLOYMENT.md)
- [Cloudflare Workers Docs](https://developers.cloudflare.com/workers/)
- [R2 Documentation](https://developers.cloudflare.com/r2/)
- [Wrangler CLI Reference](https://developers.cloudflare.com/workers/wrangler/)

## Support

If you encounter issues:
1. Check the [troubleshooting section](#troubleshooting)
2. Review worker logs: `wrangler tail`
3. Open an issue on GitHub
4. Ask in the Cloudflare Community Forum
