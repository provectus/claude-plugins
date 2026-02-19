# Claude Plugins

A shared repository of plugins for Claude Code. Each plugin packages reusable expertise — agents, skills, prompts, and MCP server configs — into a standard format that can be discovered and consumed through the built-in MCP server. Available as an [npm package](https://www.npmjs.com/package/claude-plugins) for easy integration via `npx`.

## Philosophy

**Codify expertise, not just code.** The best engineering knowledge lives in people's heads — how to structure a Kotlin coroutine scope, when to reach for React Server Components, which Python async patterns actually work in production. This repo turns that knowledge into portable, versionable plugins that any Claude Code session can pull in on demand.

A few principles guide the design:

- **Convention over configuration.** Drop files in the right directories and the system picks them up. No central registry to maintain, no config files to wire together.
- **Composable pieces.** Plugins are made of independent components (agents, skills, prompts, MCP configs). Use what you need, ignore what you don't.
- **Plain text wins.** Plugin logic lives in Markdown files. They're easy to read, easy to review, and easy to edit without tooling.
- **Discovery is built in.** The repo itself is an MCP server. Other tools and Claude Code instances can search and retrieve plugins programmatically via `list_plugins`, `get_plugin`, and `search_plugins`.

## Current Plugins

| Plugin          | Type  | Description                                              |
|-----------------|-------|----------------------------------------------------------|
| `python-expert` | Agent | Python 3.11+, async/await, Pydantic, FastAPI, SQLAlchemy |
| `kotlin-expert` | Agent | Kotlin 2.0+, coroutines, Spring Boot, domain modeling    |
| `react-expert`  | Agent | React 19+, concurrent rendering, Tailwind, accessibility |

## Installation & Usage

### Add to Claude Code

This registers the MCP server globally so it's available in every Claude Code session.

Alternatively, add it manually to your project's `.mcp.json` (project-level) or `~/.claude/claude_mcp_settings.json` (global):

```json
{
  "mcpServers": {
    "claude-plugins": {
      "command": "npx",
      "args": ["-y", "@provectus/claude-plugins"]
    }
  }
}
```

### Using the plugins

Once connected, three tools become available in your Claude Code sessions:

| Tool             | What it does                              | Example prompt                                |
|------------------|-------------------------------------------|-----------------------------------------------|
| `list_plugins`   | Browse all plugins, filter by type or tag | *"List all available plugins"*                |
| `get_plugin`     | Retrieve a plugin's full content          | *"Get the python-expert agent prompt"*        |
| `search_plugins` | Search plugins by keyword                 | *"Search for plugins related to code review"* |

You can ask Claude naturally and it will call the right tool:

- *"What plugins are available for Python?"*
- *"Show me the react-expert agent"*
- *"Find plugins tagged with 'git'"*

Claude will use the retrieved plugin content (agent prompts, skills, etc.) to enhance its responses with specialized expertise.

### Add to other MCP clients

Any MCP-compatible client can connect to the server via stdio. The server binary is `claude-plugins`:

```bash
npx -y claude-plugins
```

Configure your client to spawn this command and communicate over stdin/stdout using the [MCP protocol](https://modelcontextprotocol.io).

---

## Current Repo

This repository is both a collection of plugins and an MCP server. The server exposes tools that allow any MCP-compatible client — including other Claude Code sessions — to discover, search, and retrieve plugins programmatically.

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

### Getting Started

```bash
pnpm install
pnpm run dev          # Start the MCP server in dev mode
```

Other commands:

```bash
pnpm run build        # Compile TypeScript (only needed if modifying src/)
pnpm run start        # Run the compiled MCP server (stdio)
pnpm run test         # Run the test suite
```

If you are only adding or editing plugins (not modifying the MCP server source in `src/`), you do not need to run `pnpm run build`.

### Testing Locally

#### Run the test suite

```bash
pnpm run test
```

This runs integration tests that verify tool registration, plugin filtering, search, and error handling using an in-memory MCP transport.

#### Test the server manually

You can test the stdio server by piping JSON-RPC messages directly:

```bash
# Build first (or use tsx for dev mode)
pnpm run build

# Send an initialize + list_plugins request
echo '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2025-03-26","capabilities":{},"clientInfo":{"name":"test","version":"1.0.0"}}}
{"jsonrpc":"2.0","method":"notifications/initialized"}
{"jsonrpc":"2.0","id":2,"method":"tools/call","params":{"name":"list_plugins","arguments":{}}}' | node dist/index.js
```

#### Test with Claude Code

Add the local server to your project's `.mcp.json`:

```json
{
  "mcpServers": {
    "claude-plugins": {
      "command": "npx",
      "args": ["tsx", "/path/to/claude-plugins/src/index.ts"]
    }
  }
}
```

Then start a Claude Code session — the `list_plugins`, `get_plugin`, and `search_plugins` tools will be available. Try asking Claude to "list all available plugins" to verify the connection.

#### Test the npm package before publishing

```bash
# Simulate an npm install locally
pnpm pack

# Test the packed tarball works as a CLI
npx ./claude-plugins-1.0.0.tgz
```

### Claude Code Commands

These slash commands are available when working in this repo with Claude Code:

| Command          | Purpose                                                                  |
|------------------|--------------------------------------------------------------------------|
| `/update-readme` | Regenerate the Current Plugins table in the README from plugin manifests |

### MCP Server

Any agentic tooling that supports the [Model Context Protocol](https://modelcontextprotocol.io) can connect to this server and programmatically list, search, and retrieve plugins — including their full markdown content.

#### Available Tools

| Tool             | Description                                                  | Parameters                                                 |
|------------------|--------------------------------------------------------------|------------------------------------------------------------|
| `list_plugins`   | List all plugins with optional filters                       | `type?` (`skill`, `agent`, `prompt`), `tag?` (string)      |
| `get_plugin`     | Get a plugin's full details or a single component's markdown | `name` (string), `component?` (`skill`, `agent`, `prompt`) |
| `search_plugins` | Full-text search across name, description, and tags          | `query` (string), `type?` (`skill`, `agent`, `prompt`)     |

#### Connect from a local clone

If you're developing plugins locally, point directly at the built server:

Or in dev mode (no build step required):

```bash
npx tsx /path/to/claude-plugins/src/index.ts
```

### Contributing

#### Adding a Plugin

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

#### Making Changes

1. Create a branch from `main`.
2. Add or modify plugins following the structure above.
3. Run `/update-readme` to update the plugins table in the README.
4. If you changed MCP server source in `src/`, run `pnpm run build` to verify the TypeScript compiles.
5. Open a pull request with a clear description of what the plugin does and why it's useful.
