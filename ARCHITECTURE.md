# Architecture Overview

This document describes the architecture of the PptxGenJS MCP Server and its Cloudflare Workers deployment.

## System Overview

The PptxGenJS MCP Server is designed to work in two modes:

1. **Local Mode (stdio)** - For desktop applications like Claude Desktop
2. **Cloud Mode (HTTP/SSE)** - For Cloudflare Workers deployment

```
┌─────────────────────────────────────────────────────────────┐
│                    PptxGenJS MCP Server                     │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────────────┐         ┌──────────────────┐        │
│  │  Local Mode      │         │  Cloud Mode      │        │
│  │  (stdio)         │         │  (HTTP/SSE)      │        │
│  │                  │         │                  │        │
│  │  • index.ts      │         │  • cloudflare-   │        │
│  │  • stdio         │         │    worker.ts     │        │
│  │    transport     │         │  • SSE transport │        │
│  │  • Local files   │         │  • R2 storage    │        │
│  └──────────────────┘         └──────────────────┘        │
│                                                             │
│  ┌──────────────────────────────────────────────┐         │
│  │         Shared Core Logic                    │         │
│  │  • PptxGenJS wrapper                         │         │
│  │  • Presentation management                   │         │
│  │  • Tool implementations                      │         │
│  └──────────────────────────────────────────────┘         │
└─────────────────────────────────────────────────────────────┘
```

## Component Architecture

### 1. Local Mode (index.ts)

**Purpose**: Runs as a local Node.js process for desktop applications

**Components**:
- **StdioServerTransport**: Communicates via stdin/stdout
- **File System**: Saves presentations to local disk
- **In-Memory Storage**: Presentations and templates stored in Map structures
- **Node.js APIs**: Uses fs, createRequire, etc.

**Flow**:
```
Client (Claude) → stdio → MCP Server → PptxGenJS → Local File
```

### 2. Cloud Mode (cloudflare-worker.ts)

**Purpose**: Runs on Cloudflare Workers edge network

**Components**:
- **SSEServerTransport**: Communicates via Server-Sent Events (HTTP)
- **R2 Storage**: Saves presentations to Cloudflare R2 (S3-compatible)
- **Workers Runtime**: Uses Cloudflare Workers APIs
- **Public URLs**: Returns publicly accessible download links

**Flow**:
```
Client → HTTP/SSE → Worker → PptxGenJS → R2 Bucket → Public URL
```

## Data Flow

### Creating and Saving a Presentation (Local)

```
1. Client calls create_presentation
   ↓
2. MCP Server creates PptxGenJS instance
   ↓
3. Store in presentations Map with ID
   ↓
4. Return presentation ID to client
   ↓
5. Client calls add_slide, add_text, etc.
   ↓
6. MCP Server modifies PptxGenJS instance
   ↓
7. Client calls save_presentation
   ↓
8. PptxGenJS generates PPTX file
   ↓
9. Write to local filesystem
   ↓
10. Return file path to client
```

### Creating and Saving a Presentation (Cloud)

```
1. Client calls create_presentation via HTTP
   ↓
2. Worker creates PptxGenJS instance
   ↓
3. Store in presentations Map with session ID
   ↓
4. Return presentation ID to client
   ↓
5. Client calls add_slide, add_text, etc.
   ↓
6. Worker modifies PptxGenJS instance
   ↓
7. Client calls save_presentation
   ↓
8. PptxGenJS generates PPTX as ArrayBuffer
   ↓
9. Upload to R2 bucket
   ↓
10. Generate public URL
    ↓
11. Return download URL to client
```

## Storage Architecture

### Local Mode Storage

```
File System
├── presentations/
│   ├── presentation1.pptx
│   ├── presentation2.pptx
│   └── ...
│
In-Memory (Maps)
├── presentations: Map<id, PptxGenJS>
├── templates: Map<id, template>
└── slideMasters: Map<id, master>
```

### Cloud Mode Storage

```
R2 Bucket (pptx)
├── abc123.pptx
├── xyz789.pptx
└── ...
    ↓
Public URLs:
├── https://pub-xxxxx.r2.dev/abc123.pptx
├── https://files.domain.com/xyz789.pptx
└── ...

Worker Memory (per session)
├── presentations: Map<id, PptxGenJS>
├── templates: Map<id, template>
└── slideMasters: Map<id, master>
```

## MCP Protocol Implementation

### Request/Response Flow

```
┌─────────────┐                          ┌─────────────┐
│   Client    │                          │   Server    │
└──────┬──────┘                          └──────┬──────┘
       │                                        │
       │  Initialize (stdio/HTTP)               │
       │ ────────────────────────────────────>  │
       │                                        │
       │  List Tools                            │
       │ ────────────────────────────────────>  │
       │                                        │
       │  <──────── Tool Schemas ───────────── │
       │                                        │
       │  Call Tool (create_presentation)       │
       │ ────────────────────────────────────>  │
       │                                        │
       │  <──────── Result (ID) ──────────────  │
       │                                        │
       │  Call Tool (add_slide)                 │
       │ ────────────────────────────────────>  │
       │                                        │
       │  <──────── Result (success) ────────   │
       │                                        │
       │  Call Tool (save_presentation)         │
       │ ────────────────────────────────────>  │
       │                                        │
       │  <──────── Result (URL) ─────────────  │
       │                                        │
```

### Tool Categories

1. **Presentation Management**
   - create_presentation
   - list_presentations
   - define_layout
   - add_section

2. **Content Tools**
   - add_slide
   - add_text
   - add_shape
   - add_image
   - add_table
   - add_chart
   - add_notes

3. **Template Tools**
   - convert_pptx_to_template
   - save_template
   - load_template
   - list_templates
   - delete_template
   - create_from_template

4. **Slide Master Tools**
   - define_slide_master
   - add_slide_from_master
   - list_slide_masters

5. **Export Tools**
   - save_presentation
   - export_presentation

## Cloudflare Workers Specifics

### Worker Entry Point

```javascript
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    // Handle different endpoints
    // - /mcp: SSE stream
    // - /messages: MCP messages
    // - /health: Health check
    // - /files/*: File downloads
  }
}
```

### Environment Bindings

```typescript
interface Env {
  PPTX_BUCKET: R2Bucket;           // R2 bucket for files
  CLOUDFLARE_ACCOUNT_ID?: string;   // For URL generation
  PUBLIC_BUCKET_URL?: string;       // Public bucket URL
}
```

### R2 Integration

```javascript
// Upload
await env.PPTX_BUCKET.put(fileName, data, {
  httpMetadata: { contentType: 'application/vnd...' }
});

// Download
const object = await env.PPTX_BUCKET.get(fileName);
return new Response(object.body);

// Delete (future)
await env.PPTX_BUCKET.delete(fileName);
```

## Session Management

### Current Implementation (Stateless)

- Presentations stored in Worker memory per request
- Lost when Worker restarts or scales
- Suitable for: Quick create-and-save workflows

### Future Implementation (Durable Objects)

```
┌──────────────────┐
│ Durable Object   │
│ (Session State)  │
│                  │
│ ┌──────────────┐ │
│ │presentations │ │
│ │templates     │ │
│ │slideMasters  │ │
│ └──────────────┘ │
└──────────────────┘
```

Benefits:
- Persistent state across requests
- Survive Worker restarts
- Session isolation
- Better for: Long-running sessions

## Deployment Pipeline

### Local Development

```
src/*.ts
  ↓ tsc
dist/*.js
  ↓ node
Local Process (stdio)
```

### Cloudflare Workers

```
src/cloudflare-worker.ts
  ↓ tsc
dist/cloudflare-worker.js
  ↓ wrangler
Cloudflare Workers (edge)
  ↓
R2 Bucket
```

### GitHub Actions

```
Push to main
  ↓
GitHub Actions
  ↓ npm ci
  ↓ npm run build:worker
  ↓ wrangler deploy
  ↓
Deployed to Cloudflare
```

## Security Considerations

### Current State
- No authentication (open access)
- No rate limiting
- Public R2 bucket (optional)

### Recommended for Production
1. **Authentication**
   - API key in headers
   - JWT tokens
   - OAuth integration

2. **Rate Limiting**
   - Per IP address
   - Per API key
   - Cloudflare built-in rate limiting

3. **File Security**
   - Signed URLs for R2 access
   - Time-limited download links
   - File size limits
   - Content validation

4. **Input Validation**
   - Sanitize all inputs
   - Limit file sizes
   - Validate file formats

## Performance Characteristics

### Local Mode
- **Cold Start**: ~100ms (Node.js startup)
- **Presentation Creation**: ~10ms
- **File Generation**: ~50-500ms (depends on complexity)
- **Memory**: ~50MB + presentation size

### Cloud Mode (Cloudflare Workers)
- **Cold Start**: ~5-50ms (Workers startup)
- **Global Latency**: ~50-200ms (edge routing)
- **Presentation Creation**: ~10ms
- **R2 Upload**: ~100-500ms (depends on file size)
- **Memory**: Limited to Worker memory limits (128MB)
- **Concurrency**: Unlimited (edge distribution)

## Limitations and Considerations

### Local Mode
- ✅ Full Node.js API access
- ✅ Local file system
- ✅ No bandwidth costs
- ❌ Not publicly accessible
- ❌ Requires local installation
- ❌ Single machine

### Cloud Mode
- ✅ Globally distributed
- ✅ Public access
- ✅ No infrastructure management
- ✅ Free R2 egress
- ❌ 128MB memory limit per Worker
- ❌ Limited execution time (CPU time limits)
- ❌ No Node.js-specific APIs (fs, etc.)
- ❌ Requires Cloudflare account

## Future Enhancements

1. **Durable Objects for Session State**
   - Persistent presentations across requests
   - Better session management

2. **WebSocket Support**
   - Real-time updates
   - Collaborative editing

3. **Caching Layer**
   - Cache generated presentations
   - Template caching
   - CDN integration

4. **Analytics**
   - Usage tracking
   - Performance monitoring
   - Error logging

5. **Advanced Features**
   - Presentation preview
   - PDF export
   - Image optimization
   - Batch operations

## References

- [Model Context Protocol Spec](https://modelcontextprotocol.io/)
- [Cloudflare Workers Docs](https://developers.cloudflare.com/workers/)
- [Cloudflare R2 Docs](https://developers.cloudflare.com/r2/)
- [PptxGenJS Docs](https://gitbrent.github.io/PptxGenJS/)
