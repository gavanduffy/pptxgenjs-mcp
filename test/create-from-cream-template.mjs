import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import * as fs from 'fs';

const transport = new StdioClientTransport({
  command: "node",
  args: ["/workspaces/pptxgenjs-mcp/dist/index.js"]
});

const client = new Client({
  name: "cream-template-client",
  version: "1.0.0"
}, {
  capabilities: {}
});

await client.connect(transport);

try {
  console.log("Loading cream.json template...");
  const templateJson = JSON.parse(fs.readFileSync('/workspaces/pptxgenjs-mcp/templates/cream.json', 'utf8'));
  
  console.log("Saving template to MCP server...");
  const saveResult = await client.callTool({
    name: "save_template",
    arguments: {
      templateId: "cream",
      templateData: templateJson,
      name: "Cream Template",
      description: "Cream colored presentation template"
    }
  });
  console.log("✓ Template saved:", JSON.parse(saveResult.content[0].text));
  
  console.log("\nCreating presentation from template...");
  const createResult = await client.callTool({
    name: "create_from_template",
    arguments: {
      templateId: "cream"
    }
  });
  const result = JSON.parse(createResult.content[0].text);
  console.log("✓ Presentation created:", result.presentationId);
  console.log("  Slides:", result.slideCount);
  
  console.log("\nSaving presentation to file...");
  await client.callTool({
    name: "save_presentation",
    arguments: {
      presentationId: result.presentationId,
      fileName: "/workspaces/pptxgenjs-mcp/cream-example.pptx",
      compression: true
    }
  });
  
  const stats = fs.statSync('/workspaces/pptxgenjs-mcp/cream-example.pptx');
  console.log(`✓ Saved: cream-example.pptx (${stats.size} bytes)`);
  
  await client.close();
  console.log("\n✅ Successfully created presentation from cream template!");
} catch (error) {
  console.error("\n❌ Error:", error);
  console.error(error.stack);
  process.exit(1);
}
