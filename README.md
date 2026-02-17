# Claude Plugins

A shared repository of plugins for Claude Code. Each plugin packages reusable expertise — agents, skills, prompts, and MCP server configs — into a standard format that can be discovered and consumed through the built-in MCP server.

## Philosophy

**Codify expertise, not just code.** The best engineering knowledge lives in people's heads — how to structure a Kotlin coroutine scope, when to reach for React Server Components, which Python async patterns actually work in production. This repo turns that knowledge into portable, versionable plugins that any Claude Code session can pull in on demand.

A few principles guide the design:

- **Convention over configuration.** Drop files in the right directories and the system picks them up. No central registry to maintain, no config files to wire together.
- **Composable pieces.** Plugins are made of independent components (agents, skills, prompts, MCP configs). Use what you need, ignore what you don't.
- **Plain text wins.** Plugin logic lives in Markdown files. They're easy to read, easy to review, and easy to edit without tooling.
- **Discovery is built in.** The repo itself is an MCP server. Other tools and Claude Code instances can search and retrieve plugins programmatically via `list_plugins`, `get_plugin`, and `search_plugins`.

## Repository Structure

```
claude-plugins/
├── plugins/                          # All plugins live here
│   └── {name}/
│       ├── .claude-plugin/
│       │   └── plugin.json           # Required — manifest
│       ├── agents/{name}.md          # Optional — agent workflow prompts
│       ├── skills/{name}/SKILL.md    # Optional — slash command prompts
│       ├── prompt.md                 # Optional — reusable prompt template
│       └── .mcp.json                 # Optional — bundled MCP server configs
├── src/                              # MCP server source (TypeScript)
├── CLAUDE.md                         # Project instructions for Claude Code
└── package.json
```

### Plugin Components

| Component      | Location                     | Purpose                                         |
|----------------|------------------------------|-------------------------------------------------|
| **Manifest**   | `.claude-plugin/plugin.json` | Name, description, version, keywords. Required. |
| **Agent**      | `agents/{name}.md`           | System prompt for a specialized expert agent.   |
| **Skill**      | `skills/{name}/SKILL.md`     | Prompt template exposed as a `/slash-command`.  |
| **Prompt**     | `prompt.md`                  | A reusable prompt template.                     |
| **MCP Config** | `.mcp.json`                  | Bundled MCP server configurations.              |

## Getting Started

```bash
pnpm install
pnpm run dev          # Start the MCP server in dev mode
```

Other commands:

```bash
pnpm run build        # Compile TypeScript (only needed if modifying src/)
pnpm run start        # Run the compiled MCP server (stdio)
pnpm run serve        # Start HTTP server on port 3000
```

If you are only adding or editing plugins (not modifying the MCP server source in `src/`), you do not need to run `pnpm run build`.

### Claude Code Commands

These slash commands are available when working in this repo with Claude Code:

| Command          | Purpose                                                                  |
|------------------|--------------------------------------------------------------------------|
| `/update-readme` | Regenerate the Current Plugins table in the README from plugin manifests |

## Current Plugins

| Plugin          | Type  | Description                                              |
|-----------------|-------|----------------------------------------------------------|
| `python-expert` | Agent | Python 3.11+, async/await, Pydantic, FastAPI, SQLAlchemy |
| `kotlin-expert` | Agent | Kotlin 2.0+, coroutines, Spring Boot, domain modeling    |
| `react-expert`  | Agent | React 19+, concurrent rendering, Tailwind, accessibility |

## MCP Server Integration

This repository doubles as an MCP server for plugin discovery. Any agentic tooling that supports the [Model Context Protocol](https://modelcontextprotocol.io) can connect to it and programmatically list, search, and retrieve plugins — including their full markdown content.

### Available Tools

| Tool             | Description                                                  | Parameters                                                 |
|------------------|--------------------------------------------------------------|------------------------------------------------------------|
| `list_plugins`   | List all plugins with optional filters                       | `type?` (`skill`, `agent`, `prompt`), `tag?` (string)      |
| `get_plugin`     | Get a plugin's full details or a single component's markdown | `name` (string), `component?` (`skill`, `agent`, `prompt`) |
| `search_plugins` | Full-text search across name, description, and tags          | `query` (string), `type?` (`skill`, `agent`, `prompt`)     |

### Connect from Claude Code Locally

Add the server to your project's `.mcp.json` (or `~/.claude/claude_mcp_settings.json` for global access):

```json
{
  "mcpServers": {
    "claude-plugins": {
      "command": "node",
      "args": ["/path/to/claude-plugins/dist/index.js"]
    }
  }
}
```

Then in any Claude Code session the three tools above become available automatically.

### Connect from other MCP clients

The server supports both **stdio** and **HTTP** transports.

**stdio** (default) — for local MCP clients:

```bash
node /path/to/claude-plugins/dist/index.js
```

Or in dev mode (no build step required):

```bash
npx tsx /path/to/claude-plugins/src/index.ts
```

**HTTP** — for remote access (defaults to port 3000):

```bash
pnpm run serve                # port 3000
PORT=8080 pnpm run serve      # custom port
```

This starts an HTTP server with the MCP Streamable HTTP transport at `POST /mcp`. Clients can connect using any MCP-compatible HTTP client:

```bash
curl -X POST http://localhost:3000/mcp \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2025-03-26","capabilities":{},"clientInfo":{"name":"test","version":"1.0.0"}}}'
```

### Example workflow

A typical agentic integration pattern:

1. Call `list_plugins` or `search_plugins` to discover relevant plugins
2. Call `get_plugin` with `component: "agent"` to retrieve the full markdown prompt
3. Use the returned markdown as a system prompt, agent instruction, or context injection

## Contributing

### Adding a Plugin

1. Create the plugin directory and manifest:

```bash
mkdir -p plugins/my-plugin/.claude-plugin
```

2. Write the manifest (`plugins/my-plugin/.claude-plugin/plugin.json`):

```json
{
  "name": "my-plugin",
  "description": "What this plugin does",
  "version": "1.0.0",
  "keywords": ["relevant", "tags"]
}
```

3. Add at least one component — an agent, skill, prompt, or MCP config. See the existing plugins for examples.

4. Run `/update-readme` in Claude Code to regenerate the Current Plugins table in the README.

### Writing a Good Agent

Agent prompts in `agents/*.md` define a specialized expert. A strong agent prompt:

- **States the role clearly** up front — what the agent is an expert in.
- **Encodes real opinions** — prefer pattern X over Y, always use Z. Generic advice is not useful.
- **Includes concrete patterns** — show the actual code structure you want, not just descriptions of it.
- **Covers failure modes** — what to watch out for, common mistakes, performance traps.
- **Stays focused** — one domain of expertise per agent. Compose multiple agents rather than building one that tries to cover everything.

### Writing a Good Skill

Skill prompts in `skills/*/SKILL.md` define a slash command. A strong skill prompt:

- **Defines the task** — what the skill does when invoked.
- **Specifies inputs** — what arguments or context it needs.
- **Describes the expected output** — format, structure, level of detail.

### Guidelines

- Keep plugin names lowercase and hyphenated (`my-plugin`, not `MyPlugin`).
- Use descriptive keywords in the manifest — they power the search tool.
- One concern per plugin. If you're mixing unrelated expertise, split it into separate plugins.
- Write prompts in plain Markdown. No frontmatter, no special syntax.
- Test your plugin by running the MCP server locally and calling `get_plugin` with your plugin name.

### Making Changes

1. Create a branch from `main`.
2. Add or modify plugins following the structure above.
3. Run `/update-readme` to update the plugins table in the README.
4. If you changed MCP server source in `src/`, run `pnpm run build` to verify the TypeScript compiles.
5. Open a pull request with a clear description of what the plugin does and why it's useful.
