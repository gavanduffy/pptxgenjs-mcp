#!/usr/bin/env node

/**
 * Test script for save_presentation and export_presentation
 * Tests both base64 export and R2 upload functionality
 */

import { spawn } from 'child_process';
import { writeFileSync } from 'fs';

console.log('🧪 Testing Save and Export Functions\n');

// Start the MCP server
const server = spawn('node', ['dist/index.js'], {
  stdio: ['pipe', 'pipe', 'inherit'],
  env: {
    ...process.env,
    CLOUDFLARE_ACCOUNT_ID: process.env.CLOUDFLARE_ACCOUNT_ID || '4f87e5f45d2de0de6a82205308cce3f3',
    PUBLIC_BUCKET_URL: process.env.PUBLIC_BUCKET_URL || 'https://r2.euan.live',
  }
});

let responseBuffer = '';

server.stdout.on('data', (data) => {
  responseBuffer += data.toString();
  
  // Check if we have a complete JSON response
  const lines = responseBuffer.split('\n');
  for (let i = 0; i < lines.length - 1; i++) {
    try {
      const response = JSON.parse(lines[i]);
      console.log('📥 Response:', JSON.stringify(response, null, 2));
    } catch (e) {
      // Not JSON, skip
    }
  }
  responseBuffer = lines[lines.length - 1];
});

function sendRequest(method, params = {}) {
  const request = {
    jsonrpc: '2.0',
    id: Date.now(),
    method,
    params,
  };
  
  console.log(`\n📤 Request: ${method}`);
  console.log(JSON.stringify(request, null, 2));
  
  server.stdin.write(JSON.stringify(request) + '\n');
}

// Wait for server to start
setTimeout(() => {
  console.log('🚀 Starting tests...\n');
  
  // Test 1: Initialize
  console.log('=== Test 1: Initialize ===');
  sendRequest('initialize', {
    protocolVersion: '2024-11-05',
    capabilities: {},
    clientInfo: {
      name: 'test-client',
      version: '1.0.0',
    },
  });
  
  setTimeout(() => {
    // Test 2: Create presentation
    console.log('\n=== Test 2: Create Presentation ===');
    sendRequest('tools/call', {
      name: 'create_presentation',
      arguments: {
        presentationId: 'test-save-export',
        title: 'Save and Export Test',
        author: 'Test Suite',
      },
    });
    
    setTimeout(() => {
      // Test 3: Add a slide with content
      console.log('\n=== Test 3: Add Slide ===');
      sendRequest('tools/call', {
        name: 'add_slide',
        arguments: {
          presentationId: 'test-save-export',
        },
      });
      
      setTimeout(() => {
        // Test 4: Add text
        console.log('\n=== Test 4: Add Text ===');
        sendRequest('tools/call', {
          name: 'add_text',
          arguments: {
            presentationId: 'test-save-export',
            text: 'Testing Save and Export Functions',
            x: 1,
            y: 1,
            w: 8,
            h: 1,
            fontSize: 32,
            bold: true,
            color: '0066CC',
          },
        });
        
        setTimeout(() => {
          // Test 5: Export presentation
          console.log('\n=== Test 5: Export Presentation (base64) ===');
          sendRequest('tools/call', {
            name: 'export_presentation',
            arguments: {
              presentationId: 'test-save-export',
              outputType: 'base64',
            },
          });
          
          setTimeout(() => {
            // Test 6: Save presentation without R2 upload
            console.log('\n=== Test 6: Save Presentation (no R2 upload) ===');
            sendRequest('tools/call', {
              name: 'save_presentation',
              arguments: {
                presentationId: 'test-save-export',
                fileName: 'test-output.pptx',
                compression: false,
                uploadToR2: false,
              },
            });
            
            setTimeout(() => {
              // Test 7: Save presentation WITH R2 upload
              console.log('\n=== Test 7: Save Presentation (with R2 upload) ===');
              sendRequest('tools/call', {
                name: 'save_presentation',
                arguments: {
                  presentationId: 'test-save-export',
                  fileName: 'test-r2-upload.pptx',
                  compression: false,
                  uploadToR2: true,
                },
              });
              
              setTimeout(() => {
                // Test 8: Test R2 connectivity
                console.log('\n=== Test 8: Test R2 Connectivity ===');
                console.log('Checking if PUBLIC_BUCKET_URL is accessible...');
                
                const publicUrl = process.env.PUBLIC_BUCKET_URL || 'https://r2.euan.live';
                fetch(publicUrl)
                  .then(response => {
                    console.log(`✅ R2 bucket accessible: ${response.status} ${response.statusText}`);
                  })
                  .catch(error => {
                    console.log(`❌ R2 bucket not accessible: ${error.message}`);
                  })
                  .finally(() => {
                    console.log('\n✅ All tests completed!');
                    server.kill();
                    process.exit(0);
                  });
              }, 1000);
            }, 1000);
          }, 1000);
        }, 1000);
      }, 1000);
    }, 1000);
  }, 1000);
}, 1000);

// Handle errors
server.on('error', (error) => {
  console.error('❌ Server error:', error);
  process.exit(1);
});

server.on('exit', (code) => {
  if (code !== 0) {
    console.error(`❌ Server exited with code ${code}`);
  }
});

// Handle script termination
process.on('SIGINT', () => {
  console.log('\n\n⏹️  Tests interrupted');
  server.kill();
  process.exit(0);
});
