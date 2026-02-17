import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { createServer as createHttpServer } from "http";
import { join } from "path";
import { loadPlugins } from "./loader.js";
import { createServer } from "./server.js";

const pluginsDir = join(process.cwd(), "plugins");

const plugins = loadPlugins(pluginsDir);
console.error(`Loaded ${plugins.length} plugins`);

const port = process.env.PORT ? parseInt(process.env.PORT, 10) : undefined;

if (port) {
  const httpServer = createHttpServer(async (req, res) => {
    if (req.url === "/mcp" && req.method === "POST") {
      const server = createServer(plugins);
      const transport = new StreamableHTTPServerTransport({
        sessionIdGenerator: undefined,
      });
      await server.connect(transport);

      const body = await new Promise<string>((resolve) => {
        let data = "";
        req.on("data", (chunk: Buffer) => (data += chunk));
        req.on("end", () => resolve(data));
      });

      await transport.handleRequest(req, res, JSON.parse(body));

      res.on("close", () => {
        transport.close();
        server.close();
      });
    } else {
      res.writeHead(404, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Not found" }));
    }
  });

  httpServer.listen(port, () => {
    console.error(`MCP HTTP server listening on port ${port}`);
  });

  process.on("SIGINT", () => {
    httpServer.close();
    process.exit(0);
  });
} else {
  const server = createServer(plugins);
  const transport = new StdioServerTransport();
  await server.connect(transport);
}
