import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { join } from "path";
import { loadPlugins } from "./loader.js";
import { createServer } from "./server.js";

const pluginsDir = join(process.cwd(), "plugins");

const plugins = loadPlugins(pluginsDir);
console.error(`Loaded ${plugins.length} plugins`);

const server = createServer(plugins);
const transport = new StdioServerTransport();
await server.connect(transport);
