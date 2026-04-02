List all plan files in the current project.

Search for `.md` files in these directories:
- `.claude/plans/`
- `docs/plans/`

For each file found, display:
- Filename
- Date (extracted from `YYYY-MM-DD-` prefix if present)
- Title (derived from filename: remove date prefix, replace hyphens with spaces, title case)

Sort by date descending (most recent first). Format as a table.

If no plan files are found, tell the user and suggest creating one with `/project:plans-new`.
