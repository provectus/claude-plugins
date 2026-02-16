import { mkdirSync, copyFileSync } from "fs";
import { glob } from "glob";
import { join, dirname, basename } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const pluginsDir = join(root, "plugins");
const commandsDir = join(root, ".claude", "commands");

mkdirSync(commandsDir, { recursive: true });

const skillFiles = glob.sync(join(pluginsDir, "*/skills/*/SKILL.md"));
let synced = 0;

for (const skillFile of skillFiles) {
  // plugins/{name}/skills/{skill}/SKILL.md → .claude/commands/{name}.md
  const parts = skillFile.split("/");
  const pluginsIdx = parts.indexOf("plugins");
  const pluginName = parts[pluginsIdx + 1];
  const dest = join(commandsDir, `${pluginName}.md`);
  copyFileSync(skillFile, dest);
  synced++;
  console.log(`Synced: ${pluginName}`);
}

console.log(`Done. Synced ${synced} skill(s) to .claude/commands/`);
