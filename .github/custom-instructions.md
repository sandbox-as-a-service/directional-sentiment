Copilot: When generating commit messages, please follow Conventional Commits.

- Format: type(scope?): subject
- Allowed types: feat, fix, docs, style, refactor, perf, test, chore, ci, build
- Subject: imperative, short (<= 72 chars), no period at end
- Body: optional, use for additional context
- Footer: use for BREAKING CHANGE: description or issue references

Examples:

- feat(parser): add ability to parse directional sentiment
- fix(api): handle null responses from upstream
