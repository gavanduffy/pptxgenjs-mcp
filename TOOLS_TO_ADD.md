# Tools to Add to HTTP Server (cloudflare-worker.ts)

The HTTP server currently has 10 tools. The stdio server (index.ts) has 27 tools.
Need to add these 17 missing tools to achieve feature parity:

## Missing Tools

1. **add_shape** - Add geometric shapes
2. **add_notes** - Add speaker notes  
3. **add_section** - Organize slides with sections
4. **add_slide_with_content** - Batch add slide with multiple content
5. **define_layout** - Define custom slide dimensions
6. **define_slide_master** - Create reusable slide templates
7. **add_slide_from_master** - Apply slide master templates
8. **list_slide_masters** - List all slide masters
9. **export_presentation** - Export as base64 or binary
10. **search_and_add_image** - Search and add images via SearXNG
11. **import_html_table** - Convert HTML tables to PowerPoint
12. **convert_pptx_to_template** - Convert PPTX files to JSON templates
13. **save_template** - Save presentation templates
14. **load_template** - Load saved templates
15. **list_templates** - List all saved templates
16. **delete_template** - Delete saved templates
17. **create_from_template** - Create presentations from templates

## Implementation Steps

For each tool, need to add:
1. Tool definition in ListToolsRequestSchema handler
2. Case handler in CallToolRequestSchema handler
3. Import any required helper functions/modules

## Note
The full implementation is in src/index.ts lines 400-2399.
The cloudflare-worker.ts implementation is in lines 84-650.
