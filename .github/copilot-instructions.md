# AI Coding Assistant Instructions

# AI Coding Assistant Instructions

This directory contains modular instructions for AI coding assistants working on this project.

## Onboarding & Quick Start

- [`quick-start.md`](./quick-start.md) - **START HERE** - Concise onboarding guide for new developers with setup steps, key commands, and entry-point files
- [`task-examples.md`](./task-examples.md) - Step-by-step guides for common development tasks (adding use cases, data sources, tests)
- [`environment-setup.md`](./environment-setup.md) - Complete environment variable and configuration instructions for dev/prod
- [`troubleshooting.md`](./troubleshooting.md) - Common errors, troubleshooting steps, and known gotchas

## Core Documentation

- [`architecture.md`](./architecture.md) - Hexagonal architecture patterns, domain structure, directory tree, and data flow
- [`development.md`](./development.md) - Commands, environment setup, and development workflows
- [`testing.md`](./testing.md) - Unit testing methodology with practical examples, API testing guidelines, and test conventions
- [`conventions.md`](./conventions.md) - Code style, naming, and commit message formats
- [`tech-stack.md`](./tech-stack.md) - Dependencies, frameworks, and tool-specific guidance
- [`database.md`](./database.md) - Database schema, access patterns, and Supabase usage

## Sequence Diagrams

- [`sequence-diagrams/get-poll-feed.md`](./sequence-diagrams/get-poll-feed.md) - Complete data flow for GET /api/polls endpoint with pagination
- [`sequence-diagrams/get-poll-results.md`](./sequence-diagrams/get-poll-results.md) - Complete data flow for GET /api/polls/:slug/results endpoint with vote tallying
- [`sequence-diagrams/get-poll-summary.md`](./sequence-diagrams/get-poll-summary.md) - Complete data flow for GET /api/polls/:slug/summary endpoint
- [`sequence-diagrams/cast-vote.md`](./sequence-diagrams/cast-vote.md) - Complete data flow for POST /api/polls/:slug/votes endpoint with validation and idempotency

## Quick Reference

**Key Commands:**

```bash
pnpm dev     # Development with Turbopack
pnpm build   # Build the project
```

**Architecture Pattern:**
Domain (`_domain/`) → Use Cases → Ports → Adapters (`(adapters)/`)

- **Database**: Supabase with `@supabase/supabase-js`
- **Validation**: Zod for runtime type checking
- **Styling**: Tailwind CSS
- **Package Manager**: pnpm (specified in packageManager field)
- **Testing**: REST Client for manual API testing, Jest for unit testing

## General Guidelines

**Best Practice vs Technical Possibility:**
When providing solutions, clearly distinguish between what's technically possible and what's considered best practice or industry standard. Always explain the trade-offs and recommend the approach that aligns with established conventions and maintainability.

**Domain-Driven Design Terminology:**
Use "domain logic" instead of "business logic" for consistency with our domain-driven design architecture. This reinforces that our use cases contain domain-specific rules and operations within the hexagonal architecture pattern.

Examples:

- ✅ "You could commit API keys directly to the codebase, but it's not secure best practice. Use environment variables instead."
- ✅ "While `any` type works technically, it defeats TypeScript's purpose. Use proper typing for better code safety."
- ✅ "Direct database queries in components are possible, but violate separation of concerns. Use the established adapter pattern."
