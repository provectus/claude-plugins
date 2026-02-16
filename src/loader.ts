import { readFileSync, existsSync, readdirSync } from "fs";
import { glob } from "glob";
import { join, basename } from "path";
import type { Plugin, ComponentType } from "./types.js";

export function loadPlugins(pluginsDir: string): Plugin[] {
  const manifestFiles = glob.sync(
    join(pluginsDir, "*/.claude-plugin/plugin.json")
  );
  return manifestFiles.map((file) => {
    const pluginDir = join(file, "..", "..");
    return loadPlugin(pluginDir);
  });
}

function loadPlugin(dir: string): Plugin {
  const manifestPath = join(dir, ".claude-plugin", "plugin.json");
  const manifest = JSON.parse(readFileSync(manifestPath, "utf-8"));

  const components: ComponentType[] = [];
  const plugin: Plugin = {
    name: manifest.name ?? basename(dir),
    description: manifest.description ?? "",
    version: manifest.version ?? "0.0.0",
    tags: manifest.keywords ?? [],
    components,
    has_mcps: false,
  };

  // Detect skills: skills/*/SKILL.md
  const skillsDir = join(dir, "skills");
  if (existsSync(skillsDir)) {
    const skillFiles = glob.sync(join(skillsDir, "*/SKILL.md"));
    if (skillFiles.length > 0) {
      components.push("skill");
      plugin.skill = readFileSync(skillFiles[0], "utf-8");
    }
  }

  // Detect agents: agents/*.md
  const agentsDir = join(dir, "agents");
  if (existsSync(agentsDir)) {
    const agentFiles = readdirSync(agentsDir).filter((f) => f.endsWith(".md"));
    if (agentFiles.length > 0) {
      components.push("agent");
      plugin.agent = readFileSync(join(agentsDir, agentFiles[0]), "utf-8");
    }
  }

  // Detect prompt: prompt.md
  const promptPath = join(dir, "prompt.md");
  if (existsSync(promptPath)) {
    components.push("prompt");
    plugin.prompt = readFileSync(promptPath, "utf-8");
  }

  // Detect MCP servers: .mcp.json
  const mcpPath = join(dir, ".mcp.json");
  if (existsSync(mcpPath)) {
    plugin.has_mcps = true;
    plugin.mcps = JSON.parse(readFileSync(mcpPath, "utf-8"));
  }

  return plugin;
}
