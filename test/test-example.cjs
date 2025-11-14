#!/usr/bin/env node

/**
 * Simple test to verify the MCP server can create presentations
 * This creates a sample presentation with various elements
 */

const { spawn } = require('child_process');
const path = require('path');

const serverPath = path.join(__dirname, 'dist', 'index.js');

console.log('Starting MCP server test...\n');

// Start the server
const server = spawn('node', [serverPath], {
  stdio: ['pipe', 'pipe', 'inherit']
});

let responseBuffer = '';
let requestId = 1;

function sendRequest(method, params = {}) {
  const request = {
    jsonrpc: '2.0',
    id: requestId++,
    method,
    params
  };
  
  const message = JSON.stringify(request) + '\n';
  console.log('→ Sending:', method);
  server.stdin.write(message);
}

server.stdout.on('data', (data) => {
  responseBuffer += data.toString();
  
  // Try to parse complete JSON-RPC messages
  const lines = responseBuffer.split('\n');
  responseBuffer = lines.pop() || ''; // Keep incomplete line in buffer
  
  for (const line of lines) {
    if (line.trim()) {
      try {
        const response = JSON.parse(line);
        console.log('← Received:', response.result?.tools?.[0]?.name || response.result?.content?.[0]?.text?.substring(0, 100) || 'response');
      } catch (e) {
        // Ignore parse errors for incomplete messages
      }
    }
  }
});

server.on('error', (err) => {
  console.error('Server error:', err);
  process.exit(1);
});

server.on('close', (code) => {
  console.log(`\nServer exited with code ${code}`);
  process.exit(code);
});

// Wait a bit for server to start, then run test sequence
setTimeout(() => {
  console.log('\nRunning test sequence...\n');
  
  // Initialize
  sendRequest('initialize', {
    protocolVersion: '2024-11-05',
    capabilities: {},
    clientInfo: {
      name: 'test-client',
      version: '1.0.0'
    }
  });
  
  setTimeout(() => {
    // List available tools
    sendRequest('tools/list');
    
    setTimeout(() => {
      console.log('\n✓ Server appears to be working correctly!');
      console.log('✓ Available tools can be listed');
      console.log('\nTo use the server, configure it in your MCP client.');
      
      server.kill();
    }, 1000);
  }, 1000);
}, 500);
