import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import * as fs from 'fs';

const transport = new StdioClientTransport({
  command: "node",
  args: ["/workspaces/pptxgenjs-mcp/dist/index.js"]
});

const client = new Client({
  name: "mcp-content-client",
  version: "1.0.0"
}, {
  capabilities: {}
});

await client.connect(transport);

try {
  console.log("Loading redandblack template...");
  const templateJson = JSON.parse(fs.readFileSync('/workspaces/pptxgenjs-mcp/templates/redandblack.json', 'utf8'));
  
  await client.callTool({
    name: "save_template",
    arguments: {
      templateId: "redandblack",
      templateData: templateJson,
      name: "Red and Black Template",
      description: "Professional red and black presentation template"
    }
  });
  console.log("✓ Template loaded");
  
  console.log("\nCreating presentation with MCP content...");
  const contentMapping = {
    "slide_0_element_1": { "text": "MCP Servers" },
    "slide_0_element_2": { "text": "Model Context Protocol Architecture" },
    "slide_1_element_1": { "text": "What is MCP?" },
    "slide_1_element_2": { "text": "The Model Context Protocol (MCP) is an open protocol that standardizes how applications provide context to LLMs. It enables secure, controlled interactions between AI models and external data sources through a client-server architecture." },
    "slide_2_element_1": { "text": "Core Components" },
    "slide_2_element_2": { "text": "• MCP Hosts - Applications like Claude Desktop or IDEs\n• MCP Clients - Protocol clients within host applications\n• MCP Servers - Lightweight programs exposing resources\n• Local Data Sources - Files, databases, and services\n• Remote Services - External APIs and cloud resources" },
    "slide_3_element_1": { "text": "Server Transports" },
    "slide_3_element_2": { "text": "MCP servers support multiple transport mechanisms:\n\n• stdio - Standard input/output for local processes\n• SSE - Server-Sent Events for HTTP streaming\n• StreamableHTTP - Modern HTTP transport for Cloudflare Workers\n\nEach transport provides JSON-RPC 2.0 communication between clients and servers." },
    "slide_4_element_1": { "text": "Key Features" },
    "slide_4_element_2": { "text": "Resources - Expose data and content\nPrompts - Templated interactions\nTools - Executable functions\nSampling - LLM request capabilities\n\nServers can implement any combination of these primitives based on their use case." },
    "slide_5_element_1": { "text": "Security Model" },
    "slide_5_element_2": { "text": "MCP implements a comprehensive security approach:\n\n✓ User consent for server connections\n✓ Explicit approval for tool execution\n✓ Sandboxed execution environments\n✓ Minimal permission grants\n✓ Audit logging and monitoring" },
    "slide_6_element_1": { "text": "Building MCP Servers" },
    "slide_6_element_2": { "text": "Server development is straightforward using official SDKs:\n\n1. Choose your language (TypeScript, Python, etc.)\n2. Define your tools, resources, or prompts\n3. Implement handlers for client requests\n4. Configure transport layer\n5. Test with MCP Inspector\n6. Deploy and register with hosts" },
    "slide_7_element_1": { "text": "Real-World Examples" },
    "slide_7_element_2": { "text": "Popular MCP Server Implementations:\n\n• Filesystem - Local file operations\n• GitHub - Repository management\n• Google Drive - Cloud storage access\n• PostgreSQL - Database queries\n• Slack - Team communication\n• Brave Search - Web search integration\n• PptxGenJS - PowerPoint generation" },
    "slide_8_element_1": { "text": "Deployment Options" },
    "slide_8_element_2": { "text": "Local Deployment\n• Run as child processes\n• Direct stdio communication\n• Fast, low-latency access\n\nRemote Deployment\n• Cloudflare Workers\n• AWS Lambda\n• Traditional web servers\n• Scalable, shared access" },
    "slide_9_element_1": { "text": "Use Cases" },
    "slide_9_element_2": { "text": "Enterprise Integration - Connect AI to internal systems\nData Analysis - Query databases and visualize results\nContent Generation - Create documents, presentations, reports\nAutomation - Trigger workflows and processes\nKnowledge Management - Access documentation and wikis\nDevelopment Tools - Code analysis and generation" },
    "slide_10_element_1": { "text": "Best Practices" },
    "slide_10_element_2": { "text": "• Design clear, focused tool interfaces\n• Provide comprehensive error handling\n• Implement proper authentication\n• Document all capabilities thoroughly\n• Version your server APIs\n• Monitor performance and usage\n• Keep dependencies minimal" },
    "slide_11_element_1": { "text": "Getting Started" },
    "slide_11_element_2": { "text": "1. Install MCP SDK from npm or pip\n2. Create basic server structure\n3. Define your first tool or resource\n4. Test locally with MCP Inspector\n5. Configure in Claude Desktop or your host\n6. Iterate based on usage patterns\n\nVisit modelcontextprotocol.io for full documentation" }
  };
  
  const createResult = await client.callTool({
    name: "create_from_template",
    arguments: {
      templateId: "redandblack",
      contentMapping: contentMapping
    }
  });
  
  const result = JSON.parse(createResult.content[0].text);
  console.log("✓ Presentation created:", result.presentationId);
  console.log("  Slides:", result.slideCount);
  
  console.log("\nSaving presentation...");
  await client.callTool({
    name: "save_presentation",
    arguments: {
      presentationId: result.presentationId,
      fileName: "/workspaces/pptxgenjs-mcp/mcp-servers-presentation.pptx",
      compression: true
    }
  });
  
  const stats = fs.statSync('/workspaces/pptxgenjs-mcp/mcp-servers-presentation.pptx');
  console.log(`✓ Saved: mcp-servers-presentation.pptx (${stats.size} bytes)`);
  
  await client.close();
  console.log("\n✅ Successfully created MCP servers presentation!");
} catch (error) {
  console.error("\n❌ Error:", error);
  console.error(error.stack);
  process.exit(1);
}
