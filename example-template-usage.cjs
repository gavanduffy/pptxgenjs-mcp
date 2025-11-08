#!/usr/bin/env node

/**
 * Example: Using PPTX Templates
 * 
 * This example demonstrates various ways to use the template feature:
 * 1. Creating a business card template
 * 2. Generating multiple business cards from the template
 * 3. Working with different content types (text, images)
 */

const { Client } = require("@modelcontextprotocol/sdk/client/index.js");
const { StdioClientTransport } = require("@modelcontextprotocol/sdk/client/stdio.js");
const path = require("path");

async function main() {
  console.log("📘 Template Usage Example\n");

  const transport = new StdioClientTransport({
    command: "node",
    args: [path.join(__dirname, "dist", "index.js")],
  });

  const client = new Client(
    { name: "example-client", version: "1.0.0" },
    { capabilities: {} }
  );

  await client.connect(transport);

  try {
    // ===========================================
    // Example 1: Business Card Template
    // ===========================================
    console.log("Example 1: Business Card Template\n");
    console.log("Creating a business card template...");

    // Create template presentation
    const createResult = await client.callTool({
      name: "create_presentation",
      arguments: {
        layout: "LAYOUT_4x3",
        title: "Business Card Template",
      },
    });

    const templatePresId = JSON.parse(createResult.content[0].text).presentationId;

    // Design the business card
    await client.callTool({
      name: "add_slide",
      arguments: {
        presentationId: templatePresId,
        backgroundColor: "2C3E50",
      },
    });

    // Company Name
    await client.callTool({
      name: "add_text",
      arguments: {
        presentationId: templatePresId,
        text: "{{COMPANY}}",
        x: 0.5,
        y: 0.5,
        w: 4,
        h: 0.5,
        fontSize: 24,
        bold: true,
        color: "ECF0F1",
      },
    });

    // Person Name
    await client.callTool({
      name: "add_text",
      arguments: {
        presentationId: templatePresId,
        text: "{{NAME}}",
        x: 0.5,
        y: 1.2,
        w: 4,
        h: 0.4,
        fontSize: 18,
        bold: true,
        color: "FFFFFF",
      },
    });

    // Title
    await client.callTool({
      name: "add_text",
      arguments: {
        presentationId: templatePresId,
        text: "{{TITLE}}",
        x: 0.5,
        y: 1.7,
        w: 4,
        h: 0.3,
        fontSize: 14,
        color: "BDC3C7",
      },
    });

    // Contact Info
    await client.callTool({
      name: "add_text",
      arguments: {
        presentationId: templatePresId,
        text: "{{EMAIL}}\n{{PHONE}}",
        x: 0.5,
        y: 2.3,
        w: 4,
        h: 0.6,
        fontSize: 12,
        color: "ECF0F1",
      },
    });

    // Save template
    await client.callTool({
      name: "save_presentation",
      arguments: {
        presentationId: templatePresId,
        fileName: path.join(__dirname, "business-card-template.pptx"),
      },
    });

    // Convert to JSON template
    const convertResult = await client.callTool({
      name: "convert_pptx_to_template",
      arguments: {
        filePath: path.join(__dirname, "business-card-template.pptx"),
      },
    });

    const templateData = JSON.parse(convertResult.content[0].text).templateData;

    // Save as reusable template
    await client.callTool({
      name: "save_template",
      arguments: {
        templateId: "business-card",
        templateData: templateData,
        name: "Business Card Template",
        description: "Standard business card design",
      },
    });

    console.log("✅ Business card template created and saved\n");

    // Generate business cards for team members
    console.log("Generating business cards for team members...\n");

    const teamMembers = [
      {
        name: "John Smith",
        title: "CEO",
        email: "john.smith@example.com",
        phone: "+1 (555) 123-4567",
      },
      {
        name: "Jane Doe",
        title: "CTO",
        email: "jane.doe@example.com",
        phone: "+1 (555) 123-4568",
      },
      {
        name: "Bob Johnson",
        title: "VP of Sales",
        email: "bob.johnson@example.com",
        phone: "+1 (555) 123-4569",
      },
    ];

    for (const member of teamMembers) {
      const result = await client.callTool({
        name: "create_from_template",
        arguments: {
          templateId: "business-card",
          contentMapping: {
            "slide_0_element_0": { text: "Acme Corporation" },
            "slide_0_element_1": { text: member.name },
            "slide_0_element_2": { text: member.title },
            "slide_0_element_3": { text: `${member.email}\n${member.phone}` },
          },
        },
      });

      const presId = JSON.parse(result.content[0].text).presentationId;
      await client.callTool({
        name: "save_presentation",
        arguments: {
          presentationId: presId,
          fileName: path.join(__dirname, `card-${member.name.toLowerCase().replace(' ', '-')}.pptx`),
        },
      });

      console.log(`  ✅ Generated card for ${member.name}`);
    }

    console.log("\n");

    // ===========================================
    // Example 2: Product Showcase Template
    // ===========================================
    console.log("Example 2: Product Showcase Template\n");
    console.log("Creating a product showcase template...");

    const productPresId = JSON.parse(
      (await client.callTool({
        name: "create_presentation",
        arguments: { layout: "LAYOUT_16x9" },
      })).content[0].text
    ).presentationId;

    // Add product slide
    await client.callTool({
      name: "add_slide",
      arguments: {
        presentationId: productPresId,
        backgroundColor: "FFFFFF",
      },
    });

    // Product Name
    await client.callTool({
      name: "add_text",
      arguments: {
        presentationId: productPresId,
        text: "{{PRODUCT_NAME}}",
        x: 0.5,
        y: 0.5,
        w: 4,
        h: 0.75,
        fontSize: 32,
        bold: true,
        color: "2C3E50",
      },
    });

    // Product Description
    await client.callTool({
      name: "add_text",
      arguments: {
        presentationId: productPresId,
        text: "{{PRODUCT_DESCRIPTION}}",
        x: 0.5,
        y: 1.5,
        w: 4,
        h: 2,
        fontSize: 16,
        color: "34495E",
      },
    });

    // Features
    await client.callTool({
      name: "add_text",
      arguments: {
        presentationId: productPresId,
        text: "Key Features",
        x: 5.5,
        y: 0.5,
        w: 4,
        h: 0.5,
        fontSize: 24,
        bold: true,
        color: "2C3E50",
      },
    });

    await client.callTool({
      name: "add_text",
      arguments: {
        presentationId: productPresId,
        text: "{{FEATURES}}",
        x: 5.5,
        y: 1.2,
        w: 4,
        h: 3,
        fontSize: 14,
        bullet: true,
        color: "34495E",
      },
    });

    // Save product template
    await client.callTool({
      name: "save_presentation",
      arguments: {
        presentationId: productPresId,
        fileName: path.join(__dirname, "product-template.pptx"),
      },
    });

    // Convert and save
    const productConvert = await client.callTool({
      name: "convert_pptx_to_template",
      arguments: {
        filePath: path.join(__dirname, "product-template.pptx"),
      },
    });

    await client.callTool({
      name: "save_template",
      arguments: {
        templateId: "product-showcase",
        templateData: JSON.parse(productConvert.content[0].text).templateData,
        name: "Product Showcase Template",
        description: "Template for product presentations",
      },
    });

    console.log("✅ Product showcase template created\n");

    // Generate product slides
    console.log("Generating product presentations...\n");

    const products = [
      {
        name: "Smart Widget Pro",
        description: "The ultimate productivity tool for modern professionals. Streamline your workflow and boost efficiency.",
        features: "Advanced AI integration\nCloud synchronization\nCross-platform support\n24/7 customer service",
      },
      {
        name: "Cloud Dashboard X",
        description: "Real-time analytics and insights at your fingertips. Make data-driven decisions faster.",
        features: "Real-time data visualization\nCustomizable dashboards\nAdvanced reporting\nAPI integration",
      },
    ];

    for (const product of products) {
      const result = await client.callTool({
        name: "create_from_template",
        arguments: {
          templateId: "product-showcase",
          contentMapping: {
            "slide_0_element_0": { text: product.name },
            "slide_0_element_1": { text: product.description },
            "slide_0_element_3": { text: product.features },
          },
        },
      });

      const presId = JSON.parse(result.content[0].text).presentationId;
      await client.callTool({
        name: "save_presentation",
        arguments: {
          presentationId: presId,
          fileName: path.join(__dirname, `product-${product.name.toLowerCase().replace(/\s+/g, '-')}.pptx`),
        },
      });

      console.log(`  ✅ Generated presentation for ${product.name}`);
    }

    console.log("\n");

    // ===========================================
    // Summary
    // ===========================================
    console.log("=" .repeat(60));
    console.log("✅ Template Usage Examples Completed!");
    console.log("=" .repeat(60));
    console.log("\nGenerated Files:");
    console.log("\nBusiness Cards:");
    console.log("  - card-john-smith.pptx");
    console.log("  - card-jane-doe.pptx");
    console.log("  - card-bob-johnson.pptx");
    console.log("\nProduct Presentations:");
    console.log("  - product-smart-widget-pro.pptx");
    console.log("  - product-cloud-dashboard-x.pptx");
    console.log("\nTemplate Files:");
    console.log("  - business-card-template.pptx");
    console.log("  - product-template.pptx");
    console.log("\nKey Takeaways:");
    console.log("  • Templates enable consistent branding");
    console.log("  • Easy batch generation of similar content");
    console.log("  • Content mapping provides flexible customization");
    console.log("  • One template, many presentations");
    console.log();

  } catch (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  } finally {
    await client.close();
  }
}

main().catch(console.error);
