/**
 * Cloudflare Worker for Secure R2 Uploads
 * 
 * This worker handles authenticated uploads to R2 storage.
 * Deploy this worker to Cloudflare Workers and use the URL in R2_UPLOAD_WORKER_URL config.
 * 
 * Setup:
 * 1. Create R2 bucket: wrangler r2 bucket create pptx-files
 * 2. Update wrangler.toml with bucket binding
 * 3. Deploy: wrangler deploy
 * 4. Use worker URL in MCP server config
 */

export interface Env {
  // R2 bucket binding
  PPTX_BUCKET: R2Bucket;
  
  // Optional: Authentication token for the upload endpoint
  UPLOAD_AUTH_TOKEN?: string;
  
  // Optional: CORS origins
  ALLOWED_ORIGINS?: string;
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return handleCORS(request, env);
    }

    // Only allow POST requests for uploads
    if (request.method !== 'POST') {
      return new Response('Method not allowed', { status: 405 });
    }

    try {
      // Optional: Check authentication token
      if (env.UPLOAD_AUTH_TOKEN) {
        const authHeader = request.headers.get('Authorization');
        if (!authHeader || authHeader !== `Bearer ${env.UPLOAD_AUTH_TOKEN}`) {
          return new Response('Unauthorized', { status: 401 });
        }
      }

      // Get filename from header or generate one
      const fileName = request.headers.get('X-File-Name') || `presentation-${Date.now()}.pptx`;
      
      // Validate filename (basic security check)
      if (!fileName.match(/^[\w\-. ]+\.pptx$/i)) {
        return new Response('Invalid filename. Only alphanumeric characters, spaces, dots, and hyphens allowed.', { 
          status: 400 
        });
      }

      // Get file data
      const fileData = await request.arrayBuffer();
      
      // Check file size (max 50MB)
      const maxSize = 50 * 1024 * 1024; // 50MB
      if (fileData.byteLength > maxSize) {
        return new Response(`File too large. Maximum size is ${maxSize / 1024 / 1024}MB`, { 
          status: 413 
        });
      }

      // Upload to R2
      await env.PPTX_BUCKET.put(fileName, fileData, {
        httpMetadata: {
          contentType: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        },
        customMetadata: {
          uploadedAt: new Date().toISOString(),
          uploadedFrom: request.headers.get('CF-Connecting-IP') || 'unknown',
        },
      });

      // Generate public URL (adjust based on your R2 configuration)
      const publicUrl = `https://r2.euan.live/${fileName}`;

      // Return success response
      return new Response(
        JSON.stringify({
          success: true,
          url: publicUrl,
          fileName,
          size: fileData.byteLength,
          uploadedAt: new Date().toISOString(),
        }),
        {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            ...getCORSHeaders(request, env),
          },
        }
      );

    } catch (error: any) {
      console.error('Upload error:', error);
      return new Response(
        JSON.stringify({
          success: false,
          error: error.message || 'Upload failed',
        }),
        {
          status: 500,
          headers: {
            'Content-Type': 'application/json',
            ...getCORSHeaders(request, env),
          },
        }
      );
    }
  },
};

function handleCORS(request: Request, env: Env): Response {
  return new Response(null, {
    status: 204,
    headers: {
      ...getCORSHeaders(request, env),
      'Access-Control-Max-Age': '86400',
    },
  });
}

function getCORSHeaders(request: Request, env: Env): Record<string, string> {
  const origin = request.headers.get('Origin');
  const allowedOrigins = env.ALLOWED_ORIGINS?.split(',') || ['*'];
  
  const headers: Record<string, string> = {
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-File-Name',
  };

  if (allowedOrigins.includes('*') || (origin && allowedOrigins.includes(origin))) {
    headers['Access-Control-Allow-Origin'] = origin || '*';
  }

  return headers;
}
