import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

const transport = new StdioClientTransport({
  command: "node",
  args: ["/workspaces/pptxgenjs-mcp/dist/index.js"]
});

const client = new Client({
  name: "advanced-test-client",
  version: "1.0.0"
}, {
  capabilities: {}
});

await client.connect(transport);

try {
  // Test 1: Create presentation with tables
  console.log("Test 1: Creating presentation with table...");
  const createResult = await client.callTool({
    name: "create_presentation",
    arguments: {
      layout: "LAYOUT_16x9",
      title: "Advanced Features Test"
    }
  });
  const presentationId = JSON.parse(createResult.content[0].text).presentationId;
  console.log("✓ Presentation created:", presentationId);

  // Test 2: Add table
  console.log("\nTest 2: Adding table...");
  await client.callTool({
    name: "add_slide",
    arguments: { presentationId }
  });
  
  const tableResult = await client.callTool({
    name: "add_table",
    arguments: {
      presentationId,
      rows: [
        ["Header 1", "Header 2", "Header 3"],
        ["Row 1 Col 1", "Row 1 Col 2", "Row 1 Col 3"],
        ["Row 2 Col 1", "Row 2 Col 2", "Row 2 Col 3"]
      ],
      x: 1,
      y: 1.5,
      w: 8,
      h: 2
    }
  });
  console.log("✓ Table added:", JSON.parse(tableResult.content[0].text).success);

  // Test 3: Add chart
  console.log("\nTest 3: Adding chart...");
  await client.callTool({
    name: "add_slide",
    arguments: { presentationId }
  });
  
  const chartResult = await client.callTool({
    name: "add_chart",
    arguments: {
      presentationId,
      type: "bar",
      data: [
        {
          name: "Sales",
          labels: ["Q1", "Q2", "Q3", "Q4"],
          values: [15, 28, 35, 42]
        }
      ],
      x: 1,
      y: 1.5,
      w: 8,
      h: 4,
      title: "Quarterly Sales",
      showLegend: true
    }
  });
  console.log("✓ Chart added:", JSON.parse(chartResult.content[0].text).success);

  // Test 4: Add shape
  console.log("\nTest 4: Adding shape...");
  await client.callTool({
    name: "add_slide",
    arguments: { presentationId }
  });
  
  const shapeResult = await client.callTool({
    name: "add_shape",
    arguments: {
      presentationId,
      shape: "rect",
      x: 2,
      y: 2,
      w: 3,
      h: 2,
      fill: { color: "3498DB" }
    }
  });
  console.log("✓ Shape added:", JSON.parse(shapeResult.content[0].text).success);

  // Test 5: Add image
  console.log("\nTest 5: Adding image...");
  await client.callTool({
    name: "add_slide",
    arguments: { presentationId }
  });
  
  const imageResult = await client.callTool({
    name: "add_image",
    arguments: {
      presentationId,
      path: "https://placehold.co/600x400/blue/white?text=Test+Image",
      x: 2,
      y: 1.5,
      w: 6,
      h: 4
    }
  });
  console.log("✓ Image added:", JSON.parse(imageResult.content[0].text).success);

  // Test 6: HTML table import
  console.log("\nTest 6: Importing HTML table...");
  await client.callTool({
    name: "add_slide",
    arguments: { presentationId }
  });
  
  const htmlTableResult = await client.callTool({
    name: "import_html_table",
    arguments: {
      presentationId,
      html: '<table><tr><th bgcolor="#2C3E50">Name</th><th>Value</th></tr><tr><td><b>Item 1</b></td><td>100</td></tr></table>',
      x: 1,
      y: 1.5,
      w: 8,
      h: 2
    }
  });
  console.log("✓ HTML table imported:", JSON.parse(htmlTableResult.content[0].text).success);

  // Test 7: Slide master
  console.log("\nTest 7: Testing slide master...");
  const masterResult = await client.callTool({
    name: "define_slide_master",
    arguments: {
      masterId: "test-master",
      name: "Test Master",
      backgroundColor: "1A1A2E",
      placeholders: [
        {
          id: "title",
          type: "text",
          x: 1,
          y: 2,
          w: 8,
          h: 1.5,
          fontSize: 44,
          bold: true,
          align: "center",
          color: "FFFFFF"
        }
      ]
    }
  });
  console.log("✓ Slide master defined:", JSON.parse(masterResult.content[0].text).success);

  const masterSlideResult = await client.callTool({
    name: "add_slide_from_master",
    arguments: {
      presentationId,
      masterId: "test-master",
      placeholderContent: {
        title: { text: "From Template" }
      }
    }
  });
  console.log("✓ Slide from master added:", JSON.parse(masterSlideResult.content[0].text).success);

  // Test 8: Add notes
  console.log("\nTest 8: Adding speaker notes...");
  const notesResult = await client.callTool({
    name: "add_notes",
    arguments: {
      presentationId,
      notes: "These are speaker notes for testing."
    }
  });
  console.log("✓ Notes added:", JSON.parse(notesResult.content[0].text).success);

  // Test 9: Complex Markdown with nested features
  console.log("\nTest 9: Testing complex Markdown...");
  await client.callTool({
    name: "create_presentation",
    arguments: { presentationId: "md-test" }
  });
  
  const complexMd = `# Advanced Markdown Test

## Lists and Nesting

- First level item
  - Second level item
    - Third level item
  - Back to second level
- Another first level

## Mixed Content

Here is some **bold** and *italic* text with \`inline code\`.

### Code Example

\`\`\`typescript
interface User {
  name: string;
  age: number;
}
\`\`\`

## Quotes

> This is a blockquote with important information
> that spans multiple lines

---

## End

Final slide content.`;

  const complexMdResult = await client.callTool({
    name: "import_markdown_presentation",
    arguments: {
      presentationId: "md-test",
      markdown: complexMd,
      options: {
        splitLevel: 2,
        titleSlide: true,
        defaults: {
          titleFontSize: 36,
          bodyFontSize: 18,
          textColor: "2C3E50"
        }
      }
    }
  });
  console.log("✓ Complex Markdown imported:", JSON.parse(complexMdResult.content[0].text));

  // Save both presentations
  console.log("\nTest 10: Saving presentations...");
  await client.callTool({
    name: "save_presentation",
    arguments: {
      presentationId,
      fileName: "/tmp/advanced-test.pptx",
      compression: true
    }
  });
  
  await client.callTool({
    name: "save_presentation",
    arguments: {
      presentationId: "md-test",
      fileName: "/tmp/markdown-test.pptx",
      compression: true
    }
  });
  console.log("✓ Both presentations saved");

  // Verify files
  const fs = await import('fs');
  const stats1 = fs.statSync('/tmp/advanced-test.pptx');
  const stats2 = fs.statSync('/tmp/markdown-test.pptx');
  console.log(`✓ advanced-test.pptx: ${stats1.size} bytes`);
  console.log(`✓ markdown-test.pptx: ${stats2.size} bytes`);

  await client.close();
  console.log("\n✅ All advanced tests passed!");
} catch (error) {
  console.error("\n❌ Test failed:", error);
  console.error(error.stack);
  process.exit(1);
}
