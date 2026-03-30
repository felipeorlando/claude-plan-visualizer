Create a new plan file in `.claude/plans/`.

Arguments: $ARGUMENTS (optional title for the plan)

Steps:
1. If `.claude/plans/` does not exist, create it.
2. Generate a filename using today's date and the slugified title:
   - Format: `YYYY-MM-DD-<slugified-title>.md`
   - If no title is provided, use `YYYY-MM-DD-untitled-plan.md`
   - Slugify: lowercase, replace spaces with hyphens, remove non-alphanumeric characters except hyphens
3. Create the file with this template:

```markdown
# <Title>

## Overview

_Describe the goal and context of this plan._

## Plan

- [ ] Step 1
- [ ] Step 2
- [ ] Step 3

## Notes

_Additional context, links, or references._
```

4. Tell the user the file was created and its path.
