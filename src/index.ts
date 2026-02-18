import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { createServer as createHttpServer } from "http";
import { join } from "path";
import { loadPlugins } from "./loader.js";
import { createServer } from "./server.js";

const pluginsDir = join(process.cwd(), "plugins");

const plugins = loadPlugins(pluginsDir);
console.error(`Loaded ${plugins.length} plugins`);

const MAX_BODY_SIZE = 1024 * 1024; // 1 MB

const portEnv = process.env.PORT;
let port: number | undefined;

if (portEnv !== undefined) {
  const parsed = Number(portEnv);
  if (!Number.isFinite(parsed) || !Number.isInteger(parsed) || parsed < 0) {
    console.error(`Invalid PORT value "${portEnv}". Expected a non-negative integer.`);
    process.exit(1);
  }
  port = parsed;
}

if (port !== undefined) {
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
            data += chunk;
          });
          req.on("end", () => resolve(data));
          req.on("error", reject);
        });

        await transport.handleRequest(req, res, JSON.parse(body));
      } catch (err) {
        if (!res.headersSent) {
          const status = err instanceof Error && err.message === "Request body too large" ? 413 : 400;
          res.writeHead(status, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: status === 413 ? "Request body too large" : "Bad request" }));
        }
      } finally {
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
