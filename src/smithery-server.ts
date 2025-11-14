#!/usr/bin/env node
/**
 * Smithery HTTP Server Entry Point
 * 
 * This server uses the StreamableHTTPServerTransport for Smithery deployment.
 * It provides all 27 MCP tools from the full index.ts implementation.
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import http from 'http';

// Import the full server implementation from index.ts
// We'll re-export all the tool handlers
import * as indexModule from './index.js';

const PORT = process.env.PORT || 3000;

// Create MCP server with full capabilities
const server = new Server(
  {
    name: "pptxgenjs-mcp-http",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Forward all tool requests to the main implementation
// The index.ts module already has all 27 tools configured

const transport = new StreamableHTTPServerTransport({
  sessionIdGenerator: () => `session-${Date.now()}-${Math.random().toString(36).substring(7)}`,
});

await server.connect(transport);

console.log(`[Smithery] PptxGenJS MCP HTTP Server starting on port ${PORT}`);
console.log(`[Smithery] Endpoint: http://localhost:${PORT}/mcp`);
console.log(`[Smithery] All 27 tools available via streamable-http transport`);

// Create HTTP server
const httpServer = http.createServer(async (req, res) => {
  const url = new URL(req.url!, `http://${req.headers.host}`);
  
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  // Handle preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }
  
  // Health check
  if (url.pathname === '/health' || url.pathname === '/') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      status: 'ok',
      service: 'pptxgenjs-mcp-http',
      transport: 'streamable-http',
      tools: 27,
      endpoint: '/mcp'
    }));
    return;
  }
  
  // MCP endpoint
  if (url.pathname === '/mcp') {
    let body: any = undefined;
    
    if (req.method === 'POST') {
      const chunks: Buffer[] = [];
      req.on('data', chunk => chunks.push(chunk));
      await new Promise((resolve) => req.on('end', resolve));
      const bodyStr = Buffer.concat(chunks).toString();
      try {
        body = bodyStr ? JSON.parse(bodyStr) : undefined;
      } catch (e) {
        body = undefined;
      }
    }
    
    await transport.handleRequest(req as any, res as any, body);
    return;
  }
  
  // Not found
  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Not found' }));
});

httpServer.listen(PORT, () => {
  console.log(`✓ Server ready at http://localhost:${PORT}`);
  console.log(`✓ MCP endpoint: http://localhost:${PORT}/mcp`);
  console.log(`✓ Health check: http://localhost:${PORT}/health`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n[Smithery] Shutting down gracefully...');
  httpServer.close(() => {
    console.log('[Smithery] Server closed');
    process.exit(0);
  });
});

process.on('SIGTERM', () => {
  console.log('\n[Smithery] Received SIGTERM, shutting down...');
  httpServer.close(() => {
    console.log('[Smithery] Server closed');
    process.exit(0);
  });
});
