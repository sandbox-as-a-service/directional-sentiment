# AGENTS.md

Purpose

- Central entry point for AI/agent instructions in this repo.

Scope & Precedence

- This file is canonical for agent behavior and precedence.
- When conflicts arise, follow this order:
  1. `AGENTS.md`
  2. `.github/copilot-instructions.md`
  3. Docs referenced by `.github/copilot-instructions.md`
  4. Other `.github/*.md` docs not referenced by `.github/copilot-instructions.md`
  5. `README.md`

Quick Start

- Start with `.github/copilot-instructions.md` for detailed guidance.
- Prefer minimal, targeted changes; avoid unrelated refactors/fixes.
- Use clear plans and concise progress updates when work spans steps.
- Verify behavior with existing tests and scripts where possible.
- Avoid network access or new dependencies unless explicitly required.
- Follow hexagonal architecture and DDD terminology ("domain logic").

Primary Source

- `.github/copilot-instructions.md` - entry point that links all project-specific policies and playbooks.

Operational Rules

- Conform to repository conventions and code style.
- Keep changes scoped; fix root causes without broad rewrites.
- Document deviations and rationale in PR descriptions.
- When uncertainty exists, prefer safer, reversible changes.

Change Management

- Propose updates to these instructions via PRs.
- Keep links current if files move; update this file first.
