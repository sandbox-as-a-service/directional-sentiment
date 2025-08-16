## Commit Message Format

When generating commit messages, follow Conventional Commits:

### Format: type(scope?): subject

Allowed types: feat, fix, docs, style, refactor, perf, test, chore, ci, build
Subject: imperative, concise (≤ 72 chars), no trailing period
Body (optional): provide additional context if needed
Footer (optional): use for BREAKING CHANGE: description or issue references

### Examples

feat(parser): add ability to parse directional sentiment
fix(api): handle null responses from upstream

## Copilot Internal Self-Reflection (Do Not Output)

Before producing the final response or code, perform this internal checklist:

```xml
<self_reflection>
    1. First, create a rubric with 5–7 categories to define what success looks like.
    2. Do not show this rubric to the user; it is for internal use only.
    3. Then, iterate on the solution until all rubric categories are satisfied.
    4. If a response does not meet top marks across all categories, restart and refine.
</self_reflection>
```
