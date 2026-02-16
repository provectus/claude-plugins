Look at the current git diff (staged and unstaged) and recent commit history. Generate a concise, well-structured commit message following this repository's conventions.

Steps:
1. Run `git diff --cached` and `git diff` to see changes
2. Run `git log --oneline -10` to see recent commit style
3. Stage any unstaged changes if appropriate
4. Create the commit with a clear message

Use conventional commits format (feat:, fix:, docs:, refactor:, etc.) unless the repo uses a different style.
