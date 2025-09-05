# Directional Sentiment

A Next.js 15 application built with TypeScript, implementing hexagonal architecture patterns with clear separation between domain logic and infrastructure concerns.

## Quick Start for New Developers

### Prerequisites

- **Node.js 18+** - JavaScript runtime
- **pnpm** - Package manager (specified in `packageManager` field)
- **corepack** - Enable with `corepack enable` for automatic pnpm version management

### Environment Setup

1. **Copy environment template:**

   ```bash
   cp .env.example .env.local
   ```

2. **Configure Supabase (optional for basic development):**
   - Get your project URL and anon key from [Supabase Dashboard](https://supabase.com/dashboard)
   - Update `.env.local` with your values:
     ```bash
     NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
     NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
     ```

### Installation & First Run

```bash
# Enable pnpm if not already done
corepack enable

# Install dependencies
pnpm install

# Start development server with Turbopack
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) to see the application.

### Key Entry Points for Code Exploration

Start exploring the codebase with these key files:

- **`src/app/(public)/page.tsx`** - Main landing page component
- **`src/app/_domain/`** - Pure domain logic (business rules, entities, use cases)
- **`src/app/(adapters)/`** - Infrastructure implementations (database, APIs)
- **`src/app/_config/env.ts`** - Environment variable configuration and validation
- **`src/middleware.ts`** - Request middleware composition

### Essential Development Commands

```bash
pnpm dev                # Development server with hot reload
pnpm test:unit:jest     # Run unit tests  
pnpm build              # Production build
pnpm lint               # Check code style and errors
```

For comprehensive command documentation, testing workflows, and advanced development practices, see [Development Workflow](.github/development.md).

### Next Steps

For comprehensive development guidance, explore the [`.github`](.github/) documentation:

- **Start with:** [Development Workflow](.github/development.md) for detailed commands and testing
- **Understanding the code:** [Architecture Guidelines](.github/architecture.md) for hexagonal architecture patterns
- **Code standards:** [Code Conventions](.github/conventions.md) for style and commit formats

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

## Learn More

- [Next.js Documentation](https://nextjs.org/docs) - Learn about Next.js features and API
- [Supabase Documentation](https://supabase.com/docs) - Database and authentication platform
- [Tailwind CSS](https://tailwindcss.com/docs) - Utility-first CSS framework
