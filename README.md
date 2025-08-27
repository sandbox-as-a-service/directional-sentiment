# Directional Sentiment

A Next.js 15 application built with TypeScript, implementing hexagonal architecture patterns with clear separation between domain logic and infrastructure concerns.

## Getting Started

Install dependencies and start the development server:

```bash
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Architecture

This project follows hexagonal (ports & adapters) architecture with:

- **Domain Layer** (`_domain/`): Pure business logic with no external dependencies
- **Adapters** (`(adapters)/`): Infrastructure implementations for databases, APIs, etc.
- **Infrastructure** (`_infra/`): Cross-cutting concerns like middleware and configuration

## Documentation

Comprehensive development documentation is available in the [`.github`](.github/) directory:

- **[Architecture Guidelines](.github/architecture.md)** - Hexagonal architecture patterns, domain structure, and data flow
- **[Development Workflow](.github/development.md)** - Commands, testing workflows, and debugging practices
- **[Code Conventions](.github/conventions.md)** - Code style, naming, and commit message formats
- **[Tech Stack Details](.github/tech-stack.md)** - Dependencies, frameworks, and tool-specific guidance

### Sequence Diagrams

Detailed API flow documentation:

- **[Poll Feed Flow](.github/sequence-diagrams/get-poll-feed.md)** - Paginated data retrieval with cursor-based navigation
- **[Poll Results Flow](.github/sequence-diagrams/get-poll-results.md)** - Real-time vote tallying and percentage calculations
- **[Vote Casting Flow](.github/sequence-diagrams/cast-vote.md)** - Vote validation with idempotency protection

## Quick Commands

```bash
pnpm dev            # Development server with Turbopack
pnpm build          # Production build
pnpm test:unit:jest # Run unit tests
pnpm lint           # ESLint check
pnpm format         # Prettier formatting
```

## Learn More

- [Next.js Documentation](https://nextjs.org/docs) - Learn about Next.js features and API
- [Supabase Documentation](https://supabase.com/docs) - Database and authentication platform
- [Tailwind CSS](https://tailwindcss.com/docs) - Utility-first CSS framework
