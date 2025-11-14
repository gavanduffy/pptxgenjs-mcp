import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

const transport = new StdioClientTransport({
  command: "node",
  args: ["/workspaces/pptxgenjs-mcp/dist/index.js"]
});

const client = new Client({
  name: "test-client",
  version: "1.0.0"
}, {
  capabilities: {}
});

await client.connect(transport);

// Test 1: Create presentation
console.log("Test 1: Creating presentation...");
const createResult = await client.callTool({
  name: "create_presentation",
  arguments: {
    layout: "LAYOUT_16x9",
    title: "MCP Test",
    author: "Test Suite"
  }
});
console.log("✓ Create result:", JSON.parse(createResult.content[0].text));

const presentationId = JSON.parse(createResult.content[0].text).presentationId;

// Test 2: Add slide
console.log("\nTest 2: Adding slide...");
const addSlideResult = await client.callTool({
  name: "add_slide",
  arguments: {
    presentationId,
    backgroundColor: "F0F0F0"
  }
});
console.log("✓ Add slide result:", JSON.parse(addSlideResult.content[0].text));

// Test 3: Add text
console.log("\nTest 3: Adding text...");
const addTextResult = await client.callTool({
  name: "add_text",
  arguments: {
    presentationId,
    text: "Hello from MCP!",
    x: 1,
    y: 2,
    w: 8,
    h: 1,
    fontSize: 32,
    bold: true,
    align: "center"
  }
});
console.log("✓ Add text result:", JSON.parse(addTextResult.content[0].text));

// Test 4: Import Markdown
console.log("\nTest 4: Importing Markdown...");
const markdown = `# Test Slide

## Features
- Item 1
- Item 2

\`\`\`javascript
console.log("test");
\`\`\`
`;

const markdownResult = await client.callTool({
  name: "import_markdown_presentation",
  arguments: {
    presentationId,
    markdown,
    options: { splitLevel: 2 }
  }
});
console.log("✓ Markdown result:", JSON.parse(markdownResult.content[0].text));

// Test 5: Save presentation
console.log("\nTest 5: Saving presentation...");
const saveResult = await client.callTool({
  name: "save_presentation",
  arguments: {
    presentationId,
    fileName: "/tmp/test-output.pptx",
    compression: true
  }
});
console.log("✓ Save result:", JSON.parse(saveResult.content[0].text));

// Test 6: List presentations
console.log("\nTest 6: Listing presentations...");
const listResult = await client.callTool({
  name: "list_presentations",
  arguments: {}
});
console.log("✓ List result:", JSON.parse(listResult.content[0].text));

await client.close();
console.log("\n✅ All tests passed!");
