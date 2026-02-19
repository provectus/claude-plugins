#!/usr/bin/env node

import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import { loadPlugins } from "./loader.js";
import { createServer } from "./server.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const pluginsDir = join(__dirname, "..", "plugins");

const plugins = loadPlugins(pluginsDir);
console.error(`Loaded ${plugins.length} plugins`);

const server = createServer(plugins);
const transport = new StdioServerTransport();
await server.connect(transport);
