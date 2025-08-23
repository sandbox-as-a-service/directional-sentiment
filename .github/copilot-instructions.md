# AI Coding Assistant Instructions

This directory contains modular instructions for AI coding assistants working on this project.

## Instruction Files

- [`architecture.md`](./architecture.md) - Hexagonal architecture patterns, domain structure, and data flow
- [`development.md`](./development.md) - Commands, testing workflows, and debugging practices
- [`conventions.md`](./conventions.md) - Code style, naming, and commit message formats
- [`tech-stack.md`](./tech-stack.md) - Dependencies, frameworks, and tool-specific guidance

## Sequence Diagrams

- [`sequence-diagrams/get-poll-feed.md`](./sequence-diagrams/get-poll-feed.md) - Complete data flow for GET /api/polls endpoint with pagination
- [`sequence-diagrams/get-poll-results.md`](./sequence-diagrams/get-poll-results.md) - Complete data flow for GET /api/polls/:slug/results endpoint with vote tallying
- [`sequence-diagrams/cast-vote.md`](./sequence-diagrams/cast-vote.md) - Complete data flow for POST /api/polls/:slug/votes endpoint with validation and idempotency

## Quick Reference

**Key Commands:**

```bash
pnpm dev --turbopack     # Development with Turbopack
pnpm test-api           # Run Bruno API tests
```

**Environment Switch:**

```bash
USE_MEMORY=1 pnpm dev   # Use in-memory fixtures instead of Supabase
```

**Architecture Pattern:**
Domain (`_domain/`) → Use Cases → Ports → Adapters (`(adapters)/`)

- **Database**: Supabase with `@supabase/supabase-js`
- **Validation**: Zod for runtime type checking
- **Styling**: Tailwind CSS
- **Package Manager**: pnpm (specified in packageManager field)
- **Testing**: Bruno for API testing, in-memory fixtures for unit testing
