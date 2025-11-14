#!/usr/bin/env node

/**
 * Functional test that creates an actual presentation with various features
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const serverPath = path.join(__dirname, 'dist', 'index.js');
const outputFile = path.join(__dirname, 'test-output.pptx');

console.log('Starting comprehensive functional test...\n');

// Clean up any existing test output
if (fs.existsSync(outputFile)) {
  fs.unlinkSync(outputFile);
}

// Start the server
const server = spawn('node', [serverPath], {
  stdio: ['pipe', 'pipe', 'inherit']
});

let responseBuffer = '';
let requestId = 1;
let presentationId = null;

function sendRequest(method, params = {}) {
  return new Promise((resolve) => {
    const currentId = requestId++;
    const request = {
      jsonrpc: '2.0',
      id: currentId,
      method,
      params
    };
    
    const message = JSON.stringify(request) + '\n';
    console.log(`→ ${method}`);
    
    // Set up one-time listener for this specific response
    const checkResponse = (data) => {
      responseBuffer += data.toString();
      const lines = responseBuffer.split('\n');
      
      for (let i = 0; i < lines.length - 1; i++) {
        const line = lines[i].trim();
        if (line) {
          try {
            const response = JSON.parse(line);
            if (response.id === currentId) {
              // Remove processed lines from buffer
              responseBuffer = lines.slice(i + 1).join('\n');
              server.stdout.removeListener('data', checkResponse);
              console.log(`← ${method} completed`);
              resolve(response);
              return;
            }
          } catch (e) {
            // Ignore parse errors
          }
        }
      }
    };
    
    server.stdout.on('data', checkResponse);
    server.stdin.write(message);
  });
}

async function runTests() {
  try {
    // Initialize
    console.log('\n1. Initializing...');
    await sendRequest('initialize', {
      protocolVersion: '2024-11-05',
      capabilities: {},
      clientInfo: { name: 'test-client', version: '1.0.0' }
    });
    
    // Create presentation
    console.log('\n2. Creating presentation...');
    const createResult = await sendRequest('tools/call', {
      name: 'create_presentation',
      arguments: {
        layout: 'LAYOUT_16x9',
        title: 'Test Presentation',
        author: 'MCP Test Suite'
      }
    });
    
    const createContent = JSON.parse(createResult.result.content[0].text);
    presentationId = createContent.presentationId;
    console.log(`   Presentation ID: ${presentationId}`);
    
    // Add title slide
    console.log('\n3. Adding title slide...');
    await sendRequest('tools/call', {
      name: 'add_slide',
      arguments: { presentationId }
    });
    
    await sendRequest('tools/call', {
      name: 'add_text',
      arguments: {
        presentationId,
        text: 'Welcome to PptxGenJS MCP',
        x: 1,
        y: 2,
        w: 8,
        h: 1.5,
        fontSize: 44,
        bold: true,
        align: 'center',
        color: '2C3E50'
      }
    });
    
    await sendRequest('tools/call', {
      name: 'add_text',
      arguments: {
        presentationId,
        text: 'A comprehensive Model Context Protocol server',
        x: 1,
        y: 3.5,
        w: 8,
        h: 0.5,
        fontSize: 24,
        align: 'center',
        color: '7F8C8D'
      }
    });
    
    // Add content slide with shapes
    console.log('\n4. Adding shapes slide...');
    await sendRequest('tools/call', {
      name: 'add_slide',
      arguments: { 
        presentationId,
        backgroundColor: 'F8F9FA'
      }
    });
    
    await sendRequest('tools/call', {
      name: 'add_text',
      arguments: {
        presentationId,
        text: 'Shapes & Graphics',
        x: 0.5,
        y: 0.5,
        w: 9,
        h: 0.75,
        fontSize: 32,
        bold: true,
        color: '2C3E50'
      }
    });
    
    await sendRequest('tools/call', {
      name: 'add_shape',
      arguments: {
        presentationId,
        shape: 'rect',
        x: 1,
        y: 1.5,
        w: 2,
        h: 1.5,
        fill: { color: '3498DB', transparency: 20 },
        line: { color: '2980B9', width: 2 }
      }
    });
    
    await sendRequest('tools/call', {
      name: 'add_shape',
      arguments: {
        presentationId,
        shape: 'ellipse',
        x: 4,
        y: 1.5,
        w: 2,
        h: 1.5,
        fill: { color: 'E74C3C', transparency: 20 },
        line: { color: 'C0392B', width: 2 }
      }
    });
    
    await sendRequest('tools/call', {
      name: 'add_shape',
      arguments: {
        presentationId,
        shape: 'rightArrow',
        x: 7,
        y: 1.5,
        w: 2,
        h: 1.5,
        fill: { color: '2ECC71' }
      }
    });
    
    // Add table slide
    console.log('\n5. Adding table slide...');
    await sendRequest('tools/call', {
      name: 'add_slide',
      arguments: { presentationId }
    });
    
    await sendRequest('tools/call', {
      name: 'add_text',
      arguments: {
        presentationId,
        text: 'Data Table',
        x: 0.5,
        y: 0.5,
        w: 9,
        h: 0.75,
        fontSize: 32,
        bold: true,
        color: '2C3E50'
      }
    });
    
    await sendRequest('tools/call', {
      name: 'add_table',
      arguments: {
        presentationId,
        rows: [
          [
            { text: 'Product', options: { bold: true, fill: '34495E', color: 'FFFFFF' } },
            { text: 'Q1', options: { bold: true, fill: '34495E', color: 'FFFFFF' } },
            { text: 'Q2', options: { bold: true, fill: '34495E', color: 'FFFFFF' } },
            { text: 'Q3', options: { bold: true, fill: '34495E', color: 'FFFFFF' } },
            { text: 'Q4', options: { bold: true, fill: '34495E', color: 'FFFFFF' } }
          ],
          ['Product A', '15', '28', '35', '42'],
          ['Product B', '22', '31', '29', '38'],
          ['Product C', '18', '25', '32', '45']
        ],
        x: 1,
        y: 1.5,
        w: 8,
        h: 3,
        fontSize: 14,
        border: [{ type: 'solid', color: 'BDC3C7', pt: 1 }]
      }
    });
    
    // Add chart slide
    console.log('\n6. Adding chart slide...');
    await sendRequest('tools/call', {
      name: 'add_slide',
      arguments: { presentationId }
    });
    
    await sendRequest('tools/call', {
      name: 'add_chart',
      arguments: {
        presentationId,
        type: 'bar',
        data: [
          {
            name: 'Product A',
            labels: ['Q1', 'Q2', 'Q3', 'Q4'],
            values: [15, 28, 35, 42]
          },
          {
            name: 'Product B',
            labels: ['Q1', 'Q2', 'Q3', 'Q4'],
            values: [22, 31, 29, 38]
          }
        ],
        x: 1,
        y: 1,
        w: 8,
        h: 4.5,
        title: 'Quarterly Sales Comparison',
        showLegend: true,
        showValue: false,
        barGrouping: 'clustered'
      }
    });
    
    // Add notes to last slide
    console.log('\n7. Adding speaker notes...');
    await sendRequest('tools/call', {
      name: 'add_notes',
      arguments: {
        presentationId,
        notes: 'This chart shows the quarterly sales comparison between Product A and Product B. Note the strong growth trend in both products, with Product A showing particularly strong Q4 results.'
      }
    });
    
    // List presentations
    console.log('\n8. Listing presentations...');
    const listResult = await sendRequest('tools/call', {
      name: 'list_presentations',
      arguments: {}
    });
    const listContent = JSON.parse(listResult.result.content[0].text);
    console.log(`   Active presentations: ${listContent.count}`);
    console.log(`   Slides in presentation: ${listContent.presentations[0].slideCount}`);
    
    // Save presentation
    console.log('\n9. Saving presentation...');
    await sendRequest('tools/call', {
      name: 'save_presentation',
      arguments: {
        presentationId,
        fileName: 'test-output.pptx',
        compression: true
      }
    });
    
    // Verify file was created
    if (fs.existsSync(outputFile)) {
      const stats = fs.statSync(outputFile);
      console.log(`   ✓ File created: test-output.pptx (${Math.round(stats.size / 1024)} KB)`);
      console.log('\n✅ All tests passed!');
      console.log('   You can open test-output.pptx to view the generated presentation.');
    } else {
      console.log('   ✗ File was not created');
      process.exit(1);
    }
    
  } catch (error) {
    console.error('\n❌ Test failed:', error);
    process.exit(1);
  } finally {
    server.kill();
  }
}

server.on('error', (err) => {
  console.error('Server error:', err);
  process.exit(1);
});

// Wait for server to start
setTimeout(() => {
  runTests();
}, 500);
