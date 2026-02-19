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

function parseBody(req: import("http").IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
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
}

if (port !== undefined) {
  // HTTP mode: stateless per-request handling.
  // The MCP SDK requires a fresh transport per request in stateless mode,
  // and a separate McpServer per transport for concurrent request safety.
  // Plugins are loaded once and shared across all requests.
  const httpServer = createHttpServer(async (req, res) => {
    if (req.url === "/health") {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ status: "ok", plugins: plugins.length }));
      return;
    }

    if (req.url !== "/mcp" || req.method !== "POST") {
      res.writeHead(404, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Not found" }));
      return;
    }

    const server = createServer(plugins);
    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: undefined,
    });

    try {
      await server.connect(transport);
      const body = await parseBody(req);
      await transport.handleRequest(req, res, JSON.parse(body));
    } catch (err) {
      if (!res.headersSent) {
        const status = err instanceof Error && err.message === "Request body too large" ? 413 : 400;
        res.writeHead(status, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: status === 413 ? "Request body too large" : "Bad request" }));
      }
    } finally {
      await transport.close();
      await server.close();
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
  // Stdio mode: single long-lived connection
  const server = createServer(plugins);
  const transport = new StdioServerTransport();
  await server.connect(transport);
}
