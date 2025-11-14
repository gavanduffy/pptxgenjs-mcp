import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import * as fs from 'fs';
import * as path from 'path';

const transport = new StdioClientTransport({
  command: "node",
  args: ["/workspaces/pptxgenjs-mcp/dist/index.js"]
});

const client = new Client({
  name: "template-loader-client",
  version: "1.0.0"
}, {
  capabilities: {}
});

await client.connect(transport);

try {
  const templatesDir = '/workspaces/pptxgenjs-mcp/templates';
  const files = fs.readdirSync(templatesDir).filter(f => f.endsWith('.json'));
  
  console.log(`Found ${files.length} template files\n`);
  
  const templateIds = [];
  
  for (const file of files) {
    const templateId = path.basename(file, '.json');
    const filePath = path.join(templatesDir, file);
    
    console.log(`Processing: ${file}`);
    const templateJson = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    
    const saveResult = await client.callTool({
      name: "save_template",
      arguments: {
        templateId: templateId,
        templateData: templateJson,
        name: templateId.charAt(0).toUpperCase() + templateId.slice(1) + " Template",
        description: `Template loaded from ${file}`
      }
    });
    
    const result = JSON.parse(saveResult.content[0].text);
    console.log(`✓ Saved: ${result.templateId} (${result.slideCount} slides)`);
    templateIds.push(result.templateId);
  }
  
  console.log("\n" + "=".repeat(50));
  console.log("TEMPLATE IDs LIST:");
  console.log("=".repeat(50));
  templateIds.forEach((id, index) => {
    console.log(`${index + 1}. ${id}`);
  });
  console.log("=".repeat(50));
  
  // Also list all templates using the list_templates tool
  console.log("\nVerifying with list_templates:");
  const listResult = await client.callTool({
    name: "list_templates",
    arguments: {}
  });
  console.log(JSON.parse(listResult.content[0].text));
  
  await client.close();
  console.log("\n✅ All templates saved successfully!");
} catch (error) {
  console.error("\n❌ Error:", error);
  console.error(error.stack);
  process.exit(1);
}
