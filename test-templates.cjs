#!/usr/bin/env node

/**
 * Test script for template features
 * This demonstrates the complete template workflow:
 * 1. Create a sample presentation
 * 2. Save it as a PPTX file
 * 3. Convert the PPTX to a JSON template
 * 4. Save the template
 * 5. Create new presentations from the template with different content
 */

const { Client } = require("@modelcontextprotocol/sdk/client/index.js");
const { StdioClientTransport } = require("@modelcontextprotocol/sdk/client/stdio.js");
const { spawn } = require("child_process");
const path = require("path");
const fs = require("fs");

async function runTest() {
  console.log("🚀 Starting Template Feature Test\n");

  // Start the MCP server
  const serverPath = path.join(__dirname, "dist", "index.js");
  const serverProcess = spawn("node", [serverPath], {
    stdio: ["pipe", "pipe", "inherit"],
  });

  const transport = new StdioClientTransport({
    command: "node",
    args: [serverPath],
  });

  const client = new Client(
    {
      name: "test-client",
      version: "1.0.0",
    },
    {
      capabilities: {},
    }
  );

  await client.connect(transport);
  console.log("✅ Connected to MCP server\n");

  try {
    // ==========================================
    // Step 1: Create a sample template presentation
    // ==========================================
    console.log("📝 Step 1: Creating sample template presentation...");
    
    const createResult = await client.callTool({
      name: "create_presentation",
      arguments: {
        layout: "LAYOUT_16x9",
        title: "Sample Template",
        author: "Template System",
      },
    });
    
    const response = JSON.parse(createResult.content[0].text);
    const templatePresentationId = response.presentationId;
    console.log(`   Created presentation: ${templatePresentationId}\n`);

    // Add title slide
    await client.callTool({
      name: "add_slide",
      arguments: {
        presentationId: templatePresentationId,
        backgroundColor: "1A1A2E",
      },
    });

    await client.callTool({
      name: "add_text",
      arguments: {
        presentationId: templatePresentationId,
        text: "Company Presentation",
        x: 1,
        y: 2,
        w: 8,
        h: 1.5,
        fontSize: 44,
        bold: true,
        align: "center",
        color: "FFFFFF",
      },
    });

    await client.callTool({
      name: "add_text",
      arguments: {
        presentationId: templatePresentationId,
        text: "Q4 2024 Results",
        x: 1,
        y: 3.5,
        w: 8,
        h: 0.75,
        fontSize: 24,
        align: "center",
        color: "E0E0E0",
      },
    });

    // Add content slide with shapes
    await client.callTool({
      name: "add_slide",
      arguments: {
        presentationId: templatePresentationId,
        backgroundColor: "F8F9FA",
      },
    });

    await client.callTool({
      name: "add_text",
      arguments: {
        presentationId: templatePresentationId,
        text: "Key Metrics",
        x: 0.5,
        y: 0.5,
        w: 9,
        h: 0.75,
        fontSize: 32,
        bold: true,
        color: "2C3E50",
      },
    });

    await client.callTool({
      name: "add_shape",
      arguments: {
        presentationId: templatePresentationId,
        shape: "roundRect",
        x: 1,
        y: 1.5,
        w: 3,
        h: 2,
        fill: { color: "3498DB" },
      },
    });

    await client.callTool({
      name: "add_text",
      arguments: {
        presentationId: templatePresentationId,
        text: "Revenue\n$XX.XM",
        x: 1,
        y: 1.5,
        w: 3,
        h: 2,
        fontSize: 24,
        bold: true,
        align: "center",
        valign: "middle",
        color: "FFFFFF",
      },
    });

    // Add bullet points slide
    await client.callTool({
      name: "add_slide",
      arguments: {
        presentationId: templatePresentationId,
        backgroundColor: "FFFFFF",
      },
    });

    await client.callTool({
      name: "add_text",
      arguments: {
        presentationId: templatePresentationId,
        text: "Key Highlights",
        x: 0.5,
        y: 0.5,
        w: 9,
        h: 0.75,
        fontSize: 32,
        bold: true,
        color: "2C3E50",
      },
    });

    await client.callTool({
      name: "add_text",
      arguments: {
        presentationId: templatePresentationId,
        text: "First achievement\nSecond milestone\nThird success\nFourth goal completed",
        x: 1,
        y: 1.5,
        w: 8,
        h: 3,
        fontSize: 20,
        bullet: true,
        color: "34495E",
      },
    });

    console.log("✅ Sample template presentation created\n");

    // ==========================================
    // Step 2: Save the template presentation as PPTX
    // ==========================================
    console.log("💾 Step 2: Saving template as PPTX file...");
    
    const templateFilePath = path.join(__dirname, "sample-template.pptx");
    await client.callTool({
      name: "save_presentation",
      arguments: {
        presentationId: templatePresentationId,
        fileName: templateFilePath,
      },
    });
    
    console.log(`   Saved to: ${templateFilePath}\n`);

    // ==========================================
    // Step 3: Convert PPTX to JSON template
    // ==========================================
    console.log("🔄 Step 3: Converting PPTX to JSON template...");
    
    const convertResult = await client.callTool({
      name: "convert_pptx_to_template",
      arguments: {
        filePath: templateFilePath,
      },
    });
    
    const convertResponse = JSON.parse(convertResult.content[0].text);
    const templateData = convertResponse.templateData;
    console.log(`   Converted successfully! Slides: ${convertResponse.slideCount}\n`);

    // ==========================================
    // Step 4: Save the JSON template
    // ==========================================
    console.log("💾 Step 4: Saving JSON template...");
    
    const saveTemplateResult = await client.callTool({
      name: "save_template",
      arguments: {
        templateId: "company-quarterly",
        templateData: templateData,
        name: "Company Quarterly Report Template",
        description: "Standard template for quarterly business reports",
      },
    });
    
    const saveResponse = JSON.parse(saveTemplateResult.content[0].text);
    console.log(`   Template saved: ${saveResponse.templateId}\n`);

    // ==========================================
    // Step 5: List all templates
    // ==========================================
    console.log("📋 Step 5: Listing all templates...");
    
    const listResult = await client.callTool({
      name: "list_templates",
      arguments: {},
    });
    
    const listResponse = JSON.parse(listResult.content[0].text);
    console.log(`   Templates available: ${listResponse.count}`);
    listResponse.templates.forEach(t => {
      console.log(`   - ${t.id}: ${t.name} (${t.slideCount} slides)`);
    });
    console.log();

    // ==========================================
    // Step 6: Create presentations from template with different content
    // ==========================================
    console.log("🎨 Step 6: Creating presentations from template...\n");

    // Create Q1 2025 presentation
    console.log("   Creating Q1 2025 presentation...");
    const q1Result = await client.callTool({
      name: "create_from_template",
      arguments: {
        templateId: "company-quarterly",
        contentMapping: {
          "slide_0_element_0": { text: "Company Presentation\nQ1 2025 Results" },
          "slide_1_element_2": { text: "Revenue\n$45.2M" },
          "slide_2_element_1": { text: "Record breaking quarter\nExpanded to 3 new markets\nLaunched innovative product line\nAchieved 95% customer satisfaction" },
        },
      },
    });
    
    const q1Response = JSON.parse(q1Result.content[0].text);
    const q1PresentationId = q1Response.presentationId;
    
    await client.callTool({
      name: "save_presentation",
      arguments: {
        presentationId: q1PresentationId,
        fileName: path.join(__dirname, "q1-2025-report.pptx"),
      },
    });
    console.log(`   ✅ Saved: q1-2025-report.pptx`);

    // Create Q2 2025 presentation
    console.log("   Creating Q2 2025 presentation...");
    const q2Result = await client.callTool({
      name: "create_from_template",
      arguments: {
        templateId: "company-quarterly",
        contentMapping: {
          "slide_0_element_0": { text: "Company Presentation\nQ2 2025 Results" },
          "slide_1_element_2": { text: "Revenue\n$52.8M" },
          "slide_2_element_1": { text: "Continued growth trajectory\nPartnered with industry leaders\nReached 1 million users\nIncreased team by 40%" },
        },
      },
    });
    
    const q2Response = JSON.parse(q2Result.content[0].text);
    const q2PresentationId = q2Response.presentationId;
    
    await client.callTool({
      name: "save_presentation",
      arguments: {
        presentationId: q2PresentationId,
        fileName: path.join(__dirname, "q2-2025-report.pptx"),
      },
    });
    console.log(`   ✅ Saved: q2-2025-report.pptx\n`);

    // ==========================================
    // Step 7: Load and inspect a template
    // ==========================================
    console.log("🔍 Step 7: Loading and inspecting template...");
    
    const loadResult = await client.callTool({
      name: "load_template",
      arguments: {
        templateId: "company-quarterly",
      },
    });
    
    const loadResponse = JSON.parse(loadResult.content[0].text);
    const template = loadResponse.template;
    console.log(`   Template: ${template.name}`);
    console.log(`   Description: ${template.description}`);
    console.log(`   Slides: ${template.slideCount}`);
    console.log(`   Created: ${template.createdAt}\n`);

    // ==========================================
    // Test Summary
    // ==========================================
    console.log("=" .repeat(60));
    console.log("✅ All tests completed successfully!");
    console.log("=" .repeat(60));
    console.log("\nGenerated files:");
    console.log("  - sample-template.pptx (original template)");
    console.log("  - q1-2025-report.pptx (from template)");
    console.log("  - q2-2025-report.pptx (from template)");
    console.log("\nTemplate workflow demonstrated:");
    console.log("  ✅ Create presentation");
    console.log("  ✅ Save as PPTX");
    console.log("  ✅ Convert to JSON template");
    console.log("  ✅ Save template");
    console.log("  ✅ List templates");
    console.log("  ✅ Create from template with custom content");
    console.log("  ✅ Load and inspect template");
    console.log();

  } catch (error) {
    console.error("❌ Test failed:", error.message);
    if (error.content) {
      console.error("Error details:", error.content);
    }
    process.exit(1);
  } finally {
    await client.close();
    serverProcess.kill();
  }
}

runTest().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
