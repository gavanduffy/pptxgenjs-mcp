# R2 Storage Configuration

This document describes the R2 storage configuration for the PptxGenJS MCP Server on Cloudflare Workers.

## Configuration Summary

### R2 Bucket Details

| Setting | Value |
|---------|-------|
| **Bucket Name** | `pptx` |
| **Public URL** | `https://r2.euan.live` |
| **Preview Bucket** | `pptx-preview` |

### Folder Structure

The R2 bucket is organized into the following folders:

```
pptx/
├── output/           # Generated/saved PPTX presentations
│   ├── presentation1.pptx
│   ├── presentation2.pptx
│   └── ...
│
└── template/         # Template files (JSON format)
    ├── template1.json
    ├── template2.json
    └── ...
```

## File Organization

### Output Folder (`output/`)

**Purpose**: Stores all generated and saved PPTX presentations.

**When files are added**:
- When `save_presentation` tool is called
- When `export_presentation` generates a downloadable file

**Example file path**:
```
output/my-presentation.pptx
```

**Public URL**:
```
https://r2.euan.live/output/my-presentation.pptx
```

### Template Folder (`template/`)

**Purpose**: Stores presentation templates in JSON format.

**When files are added**:
- When `save_template` tool is called with template data
- When `convert_pptx_to_template` creates a new template

**Example file path**:
```
template/quarterly-report.json
```

**Public URL**:
```
https://r2.euan.live/template/quarterly-report.json
```

## Setup Instructions

### 1. Create R2 Bucket

```bash
# Create production bucket
wrangler r2 bucket create pptx

# Create preview/staging bucket (optional)
wrangler r2 bucket create pptx-preview
```

### 2. Configure Public Access

To allow public downloads of generated files:

#### Option 1: Via Cloudflare Dashboard

1. Go to [Cloudflare Dashboard → R2](https://dash.cloudflare.com/?to=/:account/r2)
2. Click on the `pptx` bucket
3. Go to **Settings** → **Public Access**
4. Click **"Allow Access"**
5. Note: The public URL should be configured to `https://r2.euan.live`

#### Option 2: Via Custom Domain (Already Configured)

The bucket is configured to use the custom domain:
- **Domain**: `r2.euan.live`
- **Protocol**: HTTPS
- **Configuration**: Set in `wrangler.toml`

### 3. Verify Configuration

Test the configuration:

```bash
# Check bucket exists
wrangler r2 bucket list

# List files in bucket
wrangler r2 object list pptx

# Test public access (after uploading a test file)
curl https://r2.euan.live/output/test.pptx
```

## Usage Examples

### Save a Presentation

When you call the `save_presentation` tool:

```typescript
{
  "tool": "save_presentation",
  "args": {
    "presentationId": "pres_123",
    "fileName": "quarterly-report.pptx"
  }
}
```

**Result**:
- File uploaded to: `pptx/output/quarterly-report.pptx`
- Public URL returned: `https://r2.euan.live/output/quarterly-report.pptx`

### Save a Template

When you call the `save_template` tool:

```typescript
{
  "tool": "save_template",
  "args": {
    "templateId": "company-template",
    "templateData": { /* template JSON */ },
    "name": "Company Template"
  }
}
```

**Result**:
- File uploaded to: `pptx/template/company-template.json`
- Accessible at: `https://r2.euan.live/template/company-template.json`

## Security & Access Control

### Current Configuration

- ✅ **Public Read Access**: Enabled for downloads
- ✅ **Custom Domain**: `r2.euan.live`
- ✅ **HTTPS**: Enforced
- ⚠️ **No Authentication**: Files are publicly accessible

### Recommended for Production

1. **Signed URLs**: Generate time-limited access URLs
   ```typescript
   // Future implementation
   const signedUrl = await generateSignedUrl(fileName, expiresIn);
   ```

2. **Access Tokens**: Require authentication for uploads
   ```typescript
   // Add to worker
   if (!request.headers.get('Authorization')) {
     return new Response('Unauthorized', { status: 401 });
   }
   ```

3. **CORS Configuration**: Restrict access to specific origins
   ```typescript
   // Configure CORS headers
   'Access-Control-Allow-Origin': 'https://yourdomain.com'
   ```

4. **Lifecycle Policies**: Auto-delete old files
   - Set up in Cloudflare Dashboard
   - Delete files older than 30/60/90 days
   - Archive to cheaper storage tier

## File Management

### Listing Files

```bash
# List all files in output folder
wrangler r2 object list pptx --prefix output/

# List all templates
wrangler r2 object list pptx --prefix template/

# List with details
wrangler r2 object list pptx --prefix output/ --details
```

### Downloading Files

```bash
# Download a specific file
wrangler r2 object get pptx/output/presentation.pptx --file local-copy.pptx

# Or via public URL
curl -O https://r2.euan.live/output/presentation.pptx
```

### Deleting Files

```bash
# Delete a specific file
wrangler r2 object delete pptx/output/old-presentation.pptx

# Delete all files in a folder (careful!)
wrangler r2 object delete pptx/output/ --recursive
```

## Cost & Limits

### Cloudflare R2 Pricing (as of 2024)

| Operation | Free Tier | Additional Cost |
|-----------|-----------|-----------------|
| Storage | 10 GB | $0.015/GB/month |
| Class A Operations (writes) | 1M/month | $4.50/million |
| Class B Operations (reads) | 10M/month | $0.36/million |
| Egress (downloads) | **Unlimited FREE** | **$0** |

### Expected Usage

For typical use:
- **Output Folder**: ~100-1,000 presentations (~1-10 GB)
- **Template Folder**: ~10-100 templates (~1-10 MB)
- **Monthly Writes**: ~10,000 saves (Class A)
- **Monthly Reads**: ~50,000 downloads (Class B)

**Estimated Cost**: $0/month (within free tier)

## Monitoring

### Check Bucket Usage

```bash
# Get bucket info
wrangler r2 bucket list

# Check storage usage (via Dashboard)
# Go to: Cloudflare Dashboard → R2 → Analytics
```

### Monitor Access Logs

Access logs can be configured in the Cloudflare Dashboard:

1. Go to R2 bucket settings
2. Enable **Access Logs**
3. Configure destination bucket for logs
4. Analyze access patterns

## Troubleshooting

### Issue: Files not publicly accessible

**Solution**:
1. Verify public access is enabled on the bucket
2. Check the PUBLIC_BUCKET_URL in `wrangler.toml`
3. Test: `curl https://r2.euan.live/output/test.pptx`

### Issue: Upload fails

**Possible causes**:
1. Bucket doesn't exist - Run: `wrangler r2 bucket create pptx`
2. Permissions issue - Check Cloudflare API token permissions
3. File too large - Check Worker memory limits (128MB)

**Debug**:
```bash
# Check worker logs
wrangler tail

# Test bucket access
wrangler r2 object put pptx/test.txt --file test.txt
```

### Issue: Wrong folder

**Solution**:
The code automatically places files in the correct folders:
- `save_presentation` → `output/`
- `save_template` → `template/`

If files are in the wrong place, check the code in `src/cloudflare-worker.ts`.

## Environment Variables

The following environment variables control R2 behavior:

```bash
# In wrangler.toml
[env.production]
vars = { 
  PUBLIC_BUCKET_URL = "https://r2.euan.live"
}
```

You can override these locally:

```bash
# In .env.local (for development)
PUBLIC_BUCKET_URL=https://r2.euan.live
CLOUDFLARE_ACCOUNT_ID=your-account-id
```

## API Reference

### Upload to R2 (Internal)

```typescript
async function uploadToR2(
  bucket: R2Bucket,
  fileName: string,
  data: ArrayBuffer,
  folder: 'output' | 'template',
  accountId?: string,
  publicBucketUrl?: string
): Promise<string>
```

**Parameters**:
- `bucket`: R2 bucket binding
- `fileName`: Name of the file (without folder path)
- `data`: File content as ArrayBuffer
- `folder`: Target folder ('output' or 'template')
- `accountId`: Cloudflare account ID (optional)
- `publicBucketUrl`: Custom public URL (optional, defaults to r2.euan.live)

**Returns**: Public URL to the uploaded file

### Save Template to R2 (Internal)

```typescript
async function saveTemplateToR2(
  bucket: R2Bucket,
  templateId: string,
  templateData: any,
  accountId?: string,
  publicBucketUrl?: string
): Promise<string>
```

**Parameters**:
- `bucket`: R2 bucket binding
- `templateId`: Unique template identifier
- `templateData`: Template JSON data
- `accountId`: Cloudflare account ID (optional)
- `publicBucketUrl`: Custom public URL (optional)

**Returns**: Public URL to the template JSON file

## Future Enhancements

### Planned Features

1. **Signed URLs**: Time-limited access to files
2. **Thumbnail Generation**: Preview images for presentations
3. **Automatic Cleanup**: Delete files after N days
4. **Versioning**: Keep multiple versions of templates
5. **Metadata Storage**: Track file metadata (creator, date, etc.)
6. **Search**: Search files by name or metadata
7. **Compression**: Automatic compression for storage optimization

## Resources

- [Cloudflare R2 Documentation](https://developers.cloudflare.com/r2/)
- [Wrangler R2 Commands](https://developers.cloudflare.com/workers/wrangler/commands/#r2)
- [R2 Pricing](https://developers.cloudflare.com/r2/pricing/)
- [R2 API Reference](https://developers.cloudflare.com/r2/api/)

## Summary

✅ **Bucket Name**: `pptx`  
✅ **Public URL**: `https://r2.euan.live`  
✅ **Output Folder**: `output/` (for presentations)  
✅ **Template Folder**: `template/` (for templates)  
✅ **Free Egress**: Unlimited downloads at no cost  
✅ **Configuration**: Complete and ready to use  

All files are automatically organized into the correct folders, and public URLs are generated automatically.
