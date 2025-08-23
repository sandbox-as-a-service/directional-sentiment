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
pnpm dev     # Development with Turbopack
pnpm build   # Build the project
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

## General Guidelines

**Best Practice vs Technical Possibility:**
When providing solutions, clearly distinguish between what's technically possible and what's considered best practice or industry standard. Always explain the trade-offs and recommend the approach that aligns with established conventions and maintainability.

**Domain-Driven Design Terminology:**
Use "domain logic" instead of "business logic" for consistency with our domain-driven design architecture. This reinforces that our use cases contain domain-specific rules and operations within the hexagonal architecture pattern.

Examples:

- ✅ "You could commit API keys directly to the codebase, but it's not secure best practice. Use environment variables instead."
- ✅ "While `any` type works technically, it defeats TypeScript's purpose. Use proper typing for better code safety."
- ✅ "Direct database queries in components are possible, but violate separation of concerns. Use the established adapter pattern."
