import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { Plugin, PluginMeta, ComponentType } from "./types.js";

function toMeta(plugin: Plugin): PluginMeta {
  return {
    name: plugin.name,
    description: plugin.description,
    version: plugin.version,
    tags: plugin.tags,
    components: plugin.components,
    has_mcps: plugin.has_mcps,
  };
}

export function createServer(plugins: Plugin[]): McpServer {
  const server = new McpServer({
    name: "claude-plugins",
    version: "1.0.0",
  });

  server.registerTool("list_plugins", {
    description: "List available plugins, optionally filtered by component type or tag",
    inputSchema: {
      type: z
        .enum(["skill", "agent", "prompt"])
        .optional()
        .describe("Filter to plugins that have this component type"),
      tag: z
        .string()
        .optional()
        .describe("Filter to plugins that have this tag"),
    },
  }, async ({ type, tag }) => {
    let results = plugins;

    if (type) {
      results = results.filter((p) =>
        p.components.includes(type as ComponentType)
      );
    }
    if (tag) {
      results = results.filter((p) =>
        p.tags.some((t) => t.toLowerCase() === tag.toLowerCase())
      );
    }

    return {
      content: [
        { type: "text", text: JSON.stringify(results.map(toMeta), null, 2) },
      ],
    };
  });

  server.registerTool("get_plugin", {
    description: "Get a plugin's full details or a specific component's content",
    inputSchema: {
      name: z.string().describe("Plugin name"),
      component: z
        .enum(["skill", "agent", "prompt"])
        .optional()
        .describe(
          "If specified, return only this component's content"
        ),
    },
  }, async ({ name, component }) => {
    const plugin = plugins.find(
      (p) => p.name.toLowerCase() === name.toLowerCase()
    );

    if (!plugin) {
      return {
        content: [{ type: "text", text: `Plugin "${name}" not found` }],
        isError: true,
      };
    }

    if (component) {
      const value = plugin[component];
      if (!value) {
        return {
          content: [
            {
              type: "text",
              text: `Plugin "${name}" has no ${component} component`,
            },
          ],
          isError: true,
        };
      }
      return { content: [{ type: "text", text: value }] };
    }

    return {
      content: [{ type: "text", text: JSON.stringify(plugin, null, 2) }],
    };
  });

  server.registerTool("search_plugins", {
    description: "Search plugins by keyword across name, description, and tags",
    inputSchema: {
      query: z.string().describe("Search query"),
      type: z
        .enum(["skill", "agent", "prompt"])
        .optional()
        .describe("Filter to plugins that have this component type"),
    },
  }, async ({ query, type }) => {
    const q = query.toLowerCase();
    let results = plugins.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        p.tags.some((t) => t.toLowerCase().includes(q))
    );

    if (type) {
      results = results.filter((p) =>
        p.components.includes(type as ComponentType)
      );
    }

    return {
      content: [
        { type: "text", text: JSON.stringify(results.map(toMeta), null, 2) },
      ],
    };
  });

  return server;
}
