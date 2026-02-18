import { describe, it, expect, beforeAll } from "vitest";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import type { Plugin } from "./types.js";
import { createServer } from "./server.js";

const plugins: Plugin[] = [
  {
    name: "commit",
    description: "Smart git commit helper",
    version: "1.0.0",
    tags: ["git", "workflow"],
    components: ["skill"],
    has_mcps: false,
    skill: "# Commit\nRun a smart commit.",
  },
  {
    name: "review",
    description: "Code review assistant",
    version: "2.0.0",
    tags: ["review", "quality"],
    components: ["skill", "agent"],
    has_mcps: true,
    skill: "# Review\nReview code.",
    agent: "# Review Agent\nAn agent for reviewing.",
    mcps: { servers: {} },
  },
  {
    name: "docs",
    description: "Generate documentation",
    version: "0.1.0",
    tags: ["docs"],
    components: ["prompt"],
    has_mcps: false,
    prompt: "# Docs Prompt\nGenerate docs.",
  },
];

async function callTool(client: Client, name: string, args: Record<string, unknown> = {}) {
  const result = await client.callTool({ name, arguments: args });
  const text = (result.content as Array<{ type: string; text: string }>)[0].text;
  return { ...result, text, json: JSON.parse(text) };
}

describe("MCP server", () => {
  let client: Client;

  beforeAll(async () => {
    const server = createServer(plugins);
    const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
    await server.connect(serverTransport);
    client = new Client({ name: "test-client", version: "1.0.0" });
    await client.connect(clientTransport);
  });

  describe("list_plugins", () => {
    it("returns all plugins when no filters", async () => {
      const { json } = await callTool(client, "list_plugins");
      expect(json).toHaveLength(3);
      expect(json.map((p: { name: string }) => p.name)).toEqual(["commit", "review", "docs"]);
    });

    it("does not include content fields in listing", async () => {
      const { json } = await callTool(client, "list_plugins");
      for (const p of json) {
        expect(p).not.toHaveProperty("skill");
        expect(p).not.toHaveProperty("agent");
        expect(p).not.toHaveProperty("prompt");
      }
    });

    it("filters by component type", async () => {
      const { json } = await callTool(client, "list_plugins", { type: "agent" });
      expect(json).toHaveLength(1);
      expect(json[0].name).toBe("review");
    });

    it("filters by tag (case-insensitive)", async () => {
      const { json } = await callTool(client, "list_plugins", { tag: "GIT" });
      expect(json).toHaveLength(1);
      expect(json[0].name).toBe("commit");
    });

    it("filters by both type and tag", async () => {
      const { json } = await callTool(client, "list_plugins", { type: "skill", tag: "review" });
      expect(json).toHaveLength(1);
      expect(json[0].name).toBe("review");
    });

    it("returns empty array when no matches", async () => {
      const { json } = await callTool(client, "list_plugins", { tag: "nonexistent" });
      expect(json).toEqual([]);
    });
  });

  describe("get_plugin", () => {
    it("returns full plugin details", async () => {
      const { json } = await callTool(client, "get_plugin", { name: "review" });
      expect(json.name).toBe("review");
      expect(json.skill).toBe("# Review\nReview code.");
      expect(json.agent).toBe("# Review Agent\nAn agent for reviewing.");
      expect(json.has_mcps).toBe(true);
    });

    it("returns specific component content", async () => {
      const result = await client.callTool({ name: "get_plugin", arguments: { name: "commit", component: "skill" } });
      const text = (result.content as Array<{ type: string; text: string }>)[0].text;
      expect(text).toBe("# Commit\nRun a smart commit.");
    });

    it("is case-insensitive on name", async () => {
      const { json } = await callTool(client, "get_plugin", { name: "COMMIT" });
      expect(json.name).toBe("commit");
    });

    it("returns error for unknown plugin", async () => {
      const result = await client.callTool({ name: "get_plugin", arguments: { name: "nope" } });
      expect(result.isError).toBe(true);
      const text = (result.content as Array<{ type: string; text: string }>)[0].text;
      expect(text).toContain("not found");
    });

    it("returns error for missing component", async () => {
      const result = await client.callTool({ name: "get_plugin", arguments: { name: "commit", component: "agent" } });
      expect(result.isError).toBe(true);
      const text = (result.content as Array<{ type: string; text: string }>)[0].text;
      expect(text).toContain("no agent component");
    });
  });

  describe("search_plugins", () => {
    it("searches by name", async () => {
      const { json } = await callTool(client, "search_plugins", { query: "commit" });
      expect(json).toHaveLength(1);
      expect(json[0].name).toBe("commit");
    });

    it("searches by description", async () => {
      const { json } = await callTool(client, "search_plugins", { query: "documentation" });
      expect(json).toHaveLength(1);
      expect(json[0].name).toBe("docs");
    });

    it("searches by tag", async () => {
      const { json } = await callTool(client, "search_plugins", { query: "quality" });
      expect(json).toHaveLength(1);
      expect(json[0].name).toBe("review");
    });

    it("is case-insensitive", async () => {
      const { json } = await callTool(client, "search_plugins", { query: "REVIEW" });
      expect(json).toHaveLength(1);
      expect(json[0].name).toBe("review");
    });

    it("combines search with type filter", async () => {
      const { json } = await callTool(client, "search_plugins", { query: "review", type: "agent" });
      expect(json).toHaveLength(1);
      expect(json[0].name).toBe("review");
    });

    it("returns empty when type filter excludes results", async () => {
      const { json } = await callTool(client, "search_plugins", { query: "commit", type: "agent" });
      expect(json).toEqual([]);
    });

    it("returns empty for no matches", async () => {
      const { json } = await callTool(client, "search_plugins", { query: "zzz_no_match" });
      expect(json).toEqual([]);
    });
  });
});
