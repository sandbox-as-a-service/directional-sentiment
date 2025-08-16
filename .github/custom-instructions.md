## Commit Message Format

When generating commit messages, follow Conventional Commits:

### Format: type(scope?): subject

- Allowed types: feat, fix, docs, style, refactor, perf, test, chore, ci, build
- Subject: imperative, concise (≤ 72 chars), no trailing period
- Body (optional, use sparingly): provide additional context if needed.
- Footer (optional, use sparingly): use for BREAKING CHANGE: description or issue references

### Examples

- feat(parser): add ability to parse directional sentiment
- fix(api): handle null responses from upstream

## Copilot Internal Self-Reflection (Do Not Output)

Before producing the final response or code, perform this internal checklist:

```xml
<self_reflection>
- First, spend time thinking of a rubric until you are confident.
- Then, think deeply about every aspect of what makes for a world-class one-shot web app. Use that knowledge to create a rubric that has 5–7 categories.
- e.g. (Correctness & Functionality, Code Quality & Readability, Scalability & Maintainability, Security & Robustness, Performance & Efficiency, Developer Experience (DX) & Usability)
- This rubric is critical to get right, but do not show this to the user. This is for your purposes only.
- Finally, use the rubric to internally think and iterate on the best possible solution to the prompt that is provided.
- Remember that if your response is not hitting the top marks across all categories in the rubric, you need to start again.
</self_reflection>
```
