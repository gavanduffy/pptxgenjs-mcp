# Configuration Guide

This guide shows you how to configure the PptxGenJS MCP server with various MCP clients.

## Claude Desktop

### Prerequisites
- Node.js 18 or higher installed
- Claude Desktop application installed

### Configuration

1. **Locate your configuration file:**

   - **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
   - **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

2. **Edit the configuration file** to add the PptxGenJS server:

```json
{
  "mcpServers": {
    "pptxgenjs": {
      "command": "node",
      "args": [
        "/absolute/path/to/pptxgenjs-mcp/dist/index.js"
      ]
    }
  }
}
```

Replace `/absolute/path/to/pptxgenjs-mcp` with the actual path where you cloned this repository.

3. **Restart Claude Desktop** for the changes to take effect.

4. **Verify the connection:**
   - Open Claude Desktop
   - Look for a tools icon or MCP server indicator
   - The PptxGenJS tools should be available

### Example Configuration with Multiple Servers

```json
{
  "mcpServers": {
    "pptxgenjs": {
      "command": "node",
      "args": [
        "/Users/yourname/projects/pptxgenjs-mcp/dist/index.js"
      ]
    },
    "filesystem": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-filesystem",
        "/Users/yourname/Documents"
      ]
    }
  }
}
```

## Cline (VS Code Extension)

### Configuration

1. Open VS Code Settings (Cmd/Ctrl + ,)
2. Search for "Cline: MCP Settings"
3. Add the following to your settings:

```json
{
  "cline.mcpServers": {
    "pptxgenjs": {
      "command": "node",
      "args": [
        "/absolute/path/to/pptxgenjs-mcp/dist/index.js"
      ]
    }
  }
}
```

## Custom MCP Client

If you're building your own MCP client, here's how to connect:

### Node.js Client Example

```javascript
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

// Create transport
const transport = new StdioClientTransport({
  command: "node",
  args: ["/path/to/pptxgenjs-mcp/dist/index.js"]
});

// Create client
const client = new Client(
  {
    name: "my-client",
    version: "1.0.0",
  },
  {
    capabilities: {},
  }
);

// Connect
await client.connect(transport);

// Initialize
await client.request(
  {
    method: "initialize",
    params: {
      protocolVersion: "2024-11-05",
      capabilities: {},
      clientInfo: {
        name: "my-client",
        version: "1.0.0",
      },
    },
  },
  {}
);

// List available tools
const toolsResponse = await client.request(
  {
    method: "tools/list",
    params: {},
  },
  {}
);

console.log("Available tools:", toolsResponse.tools.map(t => t.name));

// Call a tool
const result = await client.request(
  {
    method: "tools/call",
    params: {
      name: "create_presentation",
      arguments: {
        layout: "LAYOUT_16x9",
        title: "My Presentation",
      },
    },
  },
  {}
);

console.log("Result:", result);
```

### Python Client Example

```python
import asyncio
from mcp import ClientSession, StdioServerParameters
from mcp.client.stdio import stdio_client

async def main():
    server_params = StdioServerParameters(
        command="node",
        args=["/path/to/pptxgenjs-mcp/dist/index.js"]
    )
    
    async with stdio_client(server_params) as (read, write):
        async with ClientSession(read, write) as session:
            # Initialize
            await session.initialize()
            
            # List tools
            tools = await session.list_tools()
            print(f"Available tools: {[tool.name for tool in tools.tools]}")
            
            # Call a tool
            result = await session.call_tool(
                "create_presentation",
                arguments={
                    "layout": "LAYOUT_16x9",
                    "title": "My Presentation"
                }
            )
            print(f"Result: {result}")

if __name__ == "__main__":
    asyncio.run(main())
```

## Direct Command Line Usage

You can also run the server directly from the command line:

```bash
# Navigate to the project directory
cd /path/to/pptxgenjs-mcp

# Build the project (if not already built)
npm run build

# Run the server
npm start
```

The server will run on stdio and wait for JSON-RPC messages.

## Environment Variables

The server doesn't currently use environment variables, but you can set them if needed for your environment:

```bash
export NODE_ENV=production
export NODE_OPTIONS="--max-old-space-size=4096"
```

## Troubleshooting

### Server Not Starting

1. **Check Node.js version:**
   ```bash
   node --version
   # Should be 18.0.0 or higher
   ```

2. **Check if the server is built:**
   ```bash
   ls dist/index.js
   # Should exist
   ```

3. **Rebuild if necessary:**
   ```bash
   npm run build
   ```

### Tools Not Appearing

1. **Check Claude Desktop logs:**
   - macOS: `~/Library/Logs/Claude/mcp*.log`
   - Windows: `%APPDATA%\Claude\logs\mcp*.log`

2. **Verify configuration path:**
   - Ensure the path in `claude_desktop_config.json` is absolute
   - Check for typos in the path

3. **Test the server manually:**
   ```bash
   node /path/to/pptxgenjs-mcp/dist/index.js
   ```
   The server should start and print "PptxGenJS MCP Server running on stdio"

### Permission Issues

On macOS or Linux, ensure the server has execute permissions:

```bash
chmod +x /path/to/pptxgenjs-mcp/dist/index.js
```

### Port or Connection Issues

The PptxGenJS MCP server uses stdio (standard input/output) for communication, not network ports. If you're experiencing connection issues:

1. Ensure no other process is using the server
2. Restart your MCP client
3. Check system resources (memory, CPU)

## Advanced Configuration

### Custom Output Directory

You can specify a custom directory for saving presentations by changing to that directory before running the server:

```json
{
  "mcpServers": {
    "pptxgenjs": {
      "command": "node",
      "args": [
        "/path/to/pptxgenjs-mcp/dist/index.js"
      ],
      "cwd": "/path/to/output/directory"
    }
  }
}
```

### Running with npm

Instead of calling node directly, you can use npm:

```json
{
  "mcpServers": {
    "pptxgenjs": {
      "command": "npm",
      "args": [
        "start",
        "--prefix",
        "/path/to/pptxgenjs-mcp"
      ]
    }
  }
}
```

### Using npx

For global installation via npm:

```bash
# Install globally (when published)
npm install -g pptxgenjs-mcp
```

Then configure:

```json
{
  "mcpServers": {
    "pptxgenjs": {
      "command": "pptxgenjs-mcp"
    }
  }
}
```

## Docker Configuration (Advanced)

If you prefer to run the server in a Docker container:

### Dockerfile

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

CMD ["node", "dist/index.js"]
```

### Build and Run

```bash
docker build -t pptxgenjs-mcp .
docker run -i pptxgenjs-mcp
```

### MCP Configuration with Docker

```json
{
  "mcpServers": {
    "pptxgenjs": {
      "command": "docker",
      "args": [
        "run",
        "-i",
        "--rm",
        "pptxgenjs-mcp"
      ]
    }
  }
}
```

## Support

For issues or questions:
1. Check the [README.md](README.md) for general usage
2. Review [EXAMPLES.md](EXAMPLES.md) for practical examples
3. Open an issue on the GitHub repository
