#!/usr/bin/env node

/**
 * Example demonstrating the search_and_add_image tool
 * 
 * This example shows how to:
 * 1. Search for images without adding them
 * 2. Create a presentation with image search integration
 * 3. Use auto-add mode to automatically add images to slides
 */

const { spawn } = require('child_process');
const path = require('path');

const serverPath = path.join(__dirname, 'dist', 'index.js');

console.log('='.repeat(70));
console.log('Example: Using the search_and_add_image Tool');
console.log('='.repeat(70));
console.log();

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
  server.stdin.write(message);
}

server.stdout.on('data', (data) => {
  responseBuffer += data.toString();
  
  const lines = responseBuffer.split('\n');
  responseBuffer = lines.pop() || '';
  
  for (const line of lines) {
    if (line.trim()) {
      try {
        const response = JSON.parse(line);
        if (response.result?.content) {
          const content = response.result.content[0].text;
          const result = JSON.parse(content);
          handleResponse(result);
        }
      } catch (e) {
        // Ignore parse errors
      }
    }
  }
});

let step = 0;

function handleResponse(result) {
  console.log(`Step ${step} Result:`, result.success ? '✓' : '✗');
  if (result.message) {
    console.log(`  Message: ${result.message}`);
  }
  if (result.error) {
    console.log(`  Error: ${result.error}`);
  }
  console.log();
  
  setTimeout(runExample, 500);
}

function runExample() {
  step++;
  
  switch (step) {
    case 1:
      console.log('Step 1: Initialize');
      console.log('-'.repeat(70));
      sendRequest('initialize', {
        protocolVersion: '2024-11-05',
        capabilities: {},
        clientInfo: { name: 'example-client', version: '1.0.0' }
      });
      break;
      
    case 2:
      console.log('Step 2: Search for images (search-only mode)');
      console.log('-'.repeat(70));
      console.log('Query: "medieval castle architecture"');
      console.log('Max Results: 5');
      console.log();
      sendRequest('tools/call', {
        name: 'search_and_add_image',
        arguments: {
          query: 'medieval castle architecture',
          maxResults: 5
        }
      });
      break;
      
    case 3:
      console.log('Step 3: Create a presentation');
      console.log('-'.repeat(70));
      sendRequest('tools/call', {
        name: 'create_presentation',
        arguments: {
          presentationId: 'history_lesson',
          title: 'History Lesson: Medieval Architecture',
          author: 'Example Teacher'
        }
      });
      break;
      
    case 4:
      console.log('Step 4: Add title slide');
      console.log('-'.repeat(70));
      sendRequest('tools/call', {
        name: 'add_slide',
        arguments: {
          presentationId: 'history_lesson',
          backgroundColor: '1F4788'
        }
      });
      break;
      
    case 5:
      console.log('Step 5: Add title text');
      console.log('-'.repeat(70));
      sendRequest('tools/call', {
        name: 'add_text',
        arguments: {
          presentationId: 'history_lesson',
          text: 'Medieval Architecture',
          x: 1,
          y: 2.5,
          w: 8,
          h: 1.5,
          fontSize: 44,
          bold: true,
          color: 'FFFFFF',
          align: 'center'
        }
      });
      break;
      
    case 6:
      console.log('Step 6: Add content slide with image search');
      console.log('-'.repeat(70));
      sendRequest('tools/call', {
        name: 'add_slide',
        arguments: {
          presentationId: 'history_lesson'
        }
      });
      break;
      
    case 7:
      console.log('Step 7: Add slide title');
      console.log('-'.repeat(70));
      sendRequest('tools/call', {
        name: 'add_text',
        arguments: {
          presentationId: 'history_lesson',
          text: 'Castle Architecture',
          x: 0.5,
          y: 0.5,
          w: 9,
          h: 0.75,
          fontSize: 32,
          bold: true
        }
      });
      break;
      
    case 8:
      console.log('Step 8: Search and auto-add castle image');
      console.log('-'.repeat(70));
      console.log('Query: "medieval stone castle"');
      console.log('Position: Center of slide');
      console.log('Auto-add: true');
      console.log();
      sendRequest('tools/call', {
        name: 'search_and_add_image',
        arguments: {
          query: 'medieval stone castle',
          presentationId: 'history_lesson',
          maxResults: 5,
          position: {
            x: 1.5,
            y: 1.5,
            w: 7,
            h: 4
          },
          autoAdd: true
        }
      });
      break;
      
    case 9:
      console.log('Step 9: Add notes to slide');
      console.log('-'.repeat(70));
      sendRequest('tools/call', {
        name: 'add_notes',
        arguments: {
          presentationId: 'history_lesson',
          notes: 'Discuss the key features of medieval castles including defensive walls, towers, and moats.'
        }
      });
      break;
      
    case 10:
      console.log('Step 10: Save presentation');
      console.log('-'.repeat(70));
      sendRequest('tools/call', {
        name: 'save_presentation',
        arguments: {
          presentationId: 'history_lesson',
          fileName: 'history_lesson.pptx',
          compression: true
        }
      });
      break;
      
    case 11:
      console.log('='.repeat(70));
      console.log('Example Complete!');
      console.log('='.repeat(70));
      console.log();
      console.log('Key Features Demonstrated:');
      console.log('  ✓ Search-only mode for browsing images');
      console.log('  ✓ Auto-add mode for automatic image placement');
      console.log('  ✓ Integration with presentation workflow');
      console.log('  ✓ Custom positioning and sizing');
      console.log();
      console.log('Note: Image searches may fail in restricted network environments.');
      console.log('      In production, the tool will fetch images from SearXNG API.');
      console.log();
      
      server.kill();
      process.exit(0);
      break;
  }
}

// Start
setTimeout(runExample, 500);

process.on('exit', () => {
  server.kill();
});

setTimeout(() => {
  console.log('\nExample timeout');
  server.kill();
  process.exit(1);
}, 30000);
