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
const MAX_BODY_SIZE = parseInt(process.env.MAX_BODY_SIZE || "10485760", 10); // 10MB default

if (port) {
  const httpServer = createHttpServer(async (req, res) => {
    if (req.url === "/mcp" && req.method === "POST") {
      const server = createServer(plugins);
      const transport = new StreamableHTTPServerTransport({
        sessionIdGenerator: undefined,
      });
      
      try {
        await server.connect(transport);

        const body = await new Promise<string>((resolve, reject) => {
          let data = "";
          let size = 0;
          
          req.on("data", (chunk: Buffer) => {
            size += chunk.length;
            if (size > MAX_BODY_SIZE) {
              req.destroy();
              reject(new Error("Request body too large"));
              return;
            }
            data += chunk.toString("utf8");
          });
          
          req.on("end", () => resolve(data));
          req.on("error", reject);
        });

        let parsedBody;
        try {
          parsedBody = JSON.parse(body);
        } catch (err) {
          res.writeHead(400, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: "Invalid JSON in request body" }));
          return;
        }

        await transport.handleRequest(req, res, parsedBody);

        res.on("close", () => {
          transport.close();
          server.close();
        });
      } catch (err) {
        const error = err as Error;
        if (error.message === "Request body too large") {
          res.writeHead(413, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: "Request body too large" }));
        } else if (!res.headersSent) {
          res.writeHead(500, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: "Internal server error" }));
        }
      } finally {
        // Ensure cleanup happens even if errors occur
        if (!res.writableEnded) {
          res.end();
        }
        transport.close();
        server.close();
      }
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
