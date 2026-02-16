Update the "Current Plugins" table in README.md to reflect all plugins currently in the `plugins/` directory.

Steps:
1. Read every `plugins/*/. claude-plugin/plugin.json` manifest file
2. For each plugin, detect which components exist:
   - Agent: `agents/*.md` exists
   - Skill: `skills/*/SKILL.md` exists
   - Prompt: `prompt.md` exists
   - MCP: `.mcp.json` exists
3. Read the current README.md
4. Replace the markdown table under the "## Current Plugins" heading with a new table containing columns: Plugin, Type, Description
   - Plugin: the plugin name from the manifest, formatted as inline code
   - Type: comma-separated list of detected component types
   - Description: the description from the manifest
   - Sort rows alphabetically by plugin name
5. Write the updated README.md, preserving everything outside the table

Do not modify anything else in the README. Only replace the table rows and separator under "## Current Plugins".
