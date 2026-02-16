# Claude Plugins

Company-wide repository for plugins. Each plugin is a package under `plugins/` that can contain skills, agents, prompts, and MCP server configs. The repo itself is an MCP server for plugin discovery.

## Structure

Each plugin uses the native Claude Code plugin format:

- `plugins/{name}/.claude-plugin/plugin.json` — required manifest (name, description, version, keywords)
- `plugins/{name}/skills/{name}/SKILL.md` — optional slash command prompt
- `plugins/{name}/agents/{name}.md` — optional agent workflow prompt
- `plugins/{name}/prompt.md` — optional prompt template
- `plugins/{name}/.mcp.json` — optional bundled MCP server configs

## Commands

- `pnpm run dev` — start MCP server in dev mode
- `pnpm run build` — compile TypeScript (only needed if modifying src/)
- `pnpm run start` — run compiled MCP server

## Adding a Plugin

1. Create `plugins/my-plugin/.claude-plugin/plugin.json` with name, description, version, keywords
2. Add components as needed: `skills/*/SKILL.md`, `agents/*.md`, `prompt.md`, `.mcp.json`
3. Run `/update-readme` to regenerate the plugins table in README.md
