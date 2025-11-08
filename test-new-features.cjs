#!/usr/bin/env node

/**
 * Test new features: HTML table import, batch operations, and slide masters
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const serverPath = path.join(__dirname, 'dist', 'index.js');
const outputFile = path.join(__dirname, 'test-new-features.pptx');

console.log('Testing new features...\n');

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
    
    const checkResponse = (data) => {
      responseBuffer += data.toString();
      const lines = responseBuffer.split('\n');
      
      for (let i = 0; i < lines.length - 1; i++) {
        const line = lines[i].trim();
        if (line) {
          try {
            const response = JSON.parse(line);
            if (response.id === currentId) {
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
        title: 'New Features Test',
        author: 'MCP Test Suite'
      }
    });
    
    const createContent = JSON.parse(createResult.result.content[0].text);
    presentationId = createContent.presentationId;
    console.log(`   Presentation ID: ${presentationId}`);
    
    // Test 1: HTML Table Import
    console.log('\n3. Testing HTML table import...');
    await sendRequest('tools/call', {
      name: 'add_slide',
      arguments: { presentationId }
    });
    
    const htmlTable = `
      <table>
        <tr>
          <th bgcolor="#2C3E50" align="center">Product</th>
          <th bgcolor="#2C3E50" align="center">Q1</th>
          <th bgcolor="#2C3E50" align="center">Q2</th>
          <th bgcolor="#2C3E50" align="center">Q3</th>
        </tr>
        <tr>
          <td><b>Product A</b></td>
          <td align="right">$120K</td>
          <td align="right">$145K</td>
          <td align="right">$168K</td>
        </tr>
        <tr>
          <td><b>Product B</b></td>
          <td align="right">$95K</td>
          <td align="right">$110K</td>
          <td align="right">$135K</td>
        </tr>
        <tr style="background-color: #ECF0F1">
          <td><b>Total</b></td>
          <td align="right"><b>$215K</b></td>
          <td align="right"><b>$255K</b></td>
          <td align="right"><b>$303K</b></td>
        </tr>
      </table>
    `;
    
    const importResult = await sendRequest('tools/call', {
      name: 'import_html_table',
      arguments: {
        presentationId,
        html: htmlTable,
        x: 1,
        y: 1.5,
        w: 8,
        h: 3,
        fontSize: 14,
        border: [{ type: 'solid', color: 'BDC3C7', pt: 1 }]
      }
    });
    console.log('   ✓ HTML table imported');
    
    // Test 2: Batch operation - add slide with content
    console.log('\n4. Testing add_slide_with_content...');
    const batchResult = await sendRequest('tools/call', {
      name: 'add_slide_with_content',
      arguments: {
        presentationId,
        backgroundColor: 'F8F9FA',
        content: [
          {
            type: 'text',
            data: {
              text: 'Batch Operation Demo',
              x: 0.5,
              y: 0.5,
              w: 9,
              h: 0.75,
              fontSize: 32,
              bold: true,
              align: 'center'
            }
          },
          {
            type: 'shape',
            data: {
              shape: 'ellipse',
              x: 2,
              y: 2,
              w: 2,
              h: 2,
              fill: { color: '3498DB' }
            }
          },
          {
            type: 'text',
            data: {
              text: 'Multiple items\nadded at once!',
              x: 6,
              y: 2.5,
              w: 3,
              h: 1,
              fontSize: 20,
              align: 'center'
            }
          }
        ]
      }
    });
    const batchContent = JSON.parse(batchResult.result.content[0].text);
    console.log(`   ✓ Slide with ${batchContent.contentCount} items added in one call`);
    
    // Test 3: Define slide masters
    console.log('\n5. Testing slide master templates...');
    
    // Define a title slide master
    await sendRequest('tools/call', {
      name: 'define_slide_master',
      arguments: {
        masterId: 'title-slide',
        name: 'Title Slide',
        backgroundColor: '1A1A2E',
        placeholders: [
          {
            id: 'title',
            type: 'text',
            x: 1,
            y: 2,
            w: 8,
            h: 1.5,
            fontSize: 44,
            bold: true,
            align: 'center',
            color: 'FFFFFF'
          },
          {
            id: 'subtitle',
            type: 'text',
            x: 1,
            y: 3.5,
            w: 8,
            h: 0.75,
            fontSize: 24,
            align: 'center',
            color: 'CCCCCC'
          }
        ]
      }
    });
    console.log('   ✓ Title slide master defined');
    
    // Define a content slide master
    await sendRequest('tools/call', {
      name: 'define_slide_master',
      arguments: {
        masterId: 'content-slide',
        name: 'Content Slide',
        backgroundColor: 'FFFFFF',
        placeholders: [
          {
            id: 'title',
            type: 'text',
            x: 0.5,
            y: 0.5,
            w: 9,
            h: 0.75,
            fontSize: 32,
            bold: true,
            color: '2C3E50'
          },
          {
            id: 'content',
            type: 'text',
            x: 0.5,
            y: 1.5,
            w: 9,
            h: 4,
            fontSize: 18,
            color: '34495E'
          }
        ]
      }
    });
    console.log('   ✓ Content slide master defined');
    
    // List slide masters
    const mastersResult = await sendRequest('tools/call', {
      name: 'list_slide_masters',
      arguments: {}
    });
    const mastersContent = JSON.parse(mastersResult.result.content[0].text);
    console.log(`   ✓ ${mastersContent.count} slide masters available`);
    
    // Test 4: Use slide master to create slides
    console.log('\n6. Creating slides from masters...');
    
    // Add title slide from master
    await sendRequest('tools/call', {
      name: 'add_slide_from_master',
      arguments: {
        presentationId,
        masterId: 'title-slide',
        placeholderContent: {
          title: { text: 'Slide Master Demo' },
          subtitle: { text: 'Consistent Design Made Easy' }
        }
      }
    });
    console.log('   ✓ Title slide created from master');
    
    // Add content slide from master
    await sendRequest('tools/call', {
      name: 'add_slide_from_master',
      arguments: {
        presentationId,
        masterId: 'content-slide',
        placeholderContent: {
          title: { text: 'Benefits of Slide Masters' },
          content: { text: '• Consistent styling across slides\n• Faster slide creation\n• Easy to maintain and update\n• Professional appearance' }
        }
      }
    });
    console.log('   ✓ Content slide created from master');
    
    // Save presentation
    console.log('\n7. Saving presentation...');
    await sendRequest('tools/call', {
      name: 'save_presentation',
      arguments: {
        presentationId,
        fileName: 'test-new-features.pptx',
        compression: true
      }
    });
    
    // Verify file was created
    if (fs.existsSync(outputFile)) {
      const stats = fs.statSync(outputFile);
      console.log(`   ✓ File created: test-new-features.pptx (${Math.round(stats.size / 1024)} KB)`);
      console.log('\n✅ All new feature tests passed!');
      console.log('   Open test-new-features.pptx to view the results.');
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
