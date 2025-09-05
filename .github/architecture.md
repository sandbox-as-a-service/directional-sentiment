# Architecture Guidelines

## Project Structure Overview

Complete directory tree showing the hexagonal architecture organization:

```
directional-sentiment/
├── .github/                    # Documentation and workflows
│   ├── copilot-instructions.md # Main AI assistant instructions
│   ├── architecture.md         # This file - architecture patterns  
│   ├── development.md          # Commands and workflows
│   ├── testing.md              # Unit testing methodology
│   ├── conventions.md          # Code style and naming
│   ├── tech-stack.md           # Dependencies and frameworks
│   ├── database.md             # Database schema and usage
│   ├── quick-start.md          # Onboarding for new developers
│   ├── task-examples.md        # Step-by-step development guides
│   ├── environment-setup.md    # Environment variable configuration
│   ├── troubleshooting.md      # Common errors and solutions
│   ├── sequence-diagrams/      # API flow documentation
│   │   ├── get-poll-feed.md    # Paginated poll listing flow
│   │   ├── get-poll-results.md # Vote tallying and results flow
│   │   ├── get-poll-summary.md # Poll metadata retrieval flow
│   │   └── cast-vote.md        # Vote validation and storage flow
│   └── workflows/              # GitHub Actions CI/CD
├── src/
│   ├── middleware.ts           # Edge middleware composition
│   └── app/
│       ├── _domain/            # 🏛️ Pure domain logic (hexagon core)
│       │   ├── ports/
│       │   │   ├── in/         # Use case contracts (what domain offers)
│       │   │   │   ├── cast-vote.ts
│       │   │   │   ├── get-poll-feed.ts
│       │   │   │   ├── get-poll-results.ts
│       │   │   │   └── get-poll-summary.ts
│       │   │   └── out/        # Data source contracts (what domain needs)
│       │   │       ├── poll-feed-source.ts
│       │   │       ├── polls-source.ts
│       │   │       └── votes-source.ts
│       │   └── use-cases/      # Domain logic implementation
│       │       └── polls/
│       │           ├── cast-vote.ts           # Vote validation & idempotency
│       │           ├── get-poll-feed.ts       # Paginated poll listing
│       │           ├── get-poll-results.ts    # Vote tallying & results
│       │           ├── get-poll-summary.ts    # Poll metadata retrieval
│       │           ├── __tests__/             # Feature test folder
│       │           │   ├── cast-vote.test.ts
│       │           │   ├── get-poll-feed.test.ts
│       │           │   ├── get-poll-results.test.ts
│       │           │   └── shared-helpers.ts  # Test utilities
│       │           └── dto/
│       │               └── poll.ts            # Domain transfer objects
│       ├── _infra/             # 🔧 Infrastructure concerns (cross-cutting)
│       │   └── edge/           # Edge middleware components
│       │       ├── compose.ts  # Middleware composition utility
│       │       ├── auth/       # Authentication middleware
│       │       │   └── with-supabase.ts
│       │       └── rate-limit/ # Rate limiting middleware
│       │           └── with-rate-limit.ts
│       ├── _config/            # 🔧 Application configuration
│       │   └── env.ts          # Environment validation with Zod
│       ├── (adapters)/         # 🔌 Infrastructure implementations (hexagon edges)
│       │   ├── (in)/           # Inbound adapters (API routes, Server Actions)
│       │   │   └── api/
│       │   │       ├── health/
│       │   │       │   └── route.ts       # Health check endpoint
│       │   │       └── polls/
│       │   │           ├── feed/
│       │   │           │   └── route.ts   # GET /api/polls/feed
│       │   │           └── [slug]/
│       │   │               ├── results/
│       │   │               │   └── route.ts  # GET /api/polls/:slug/results
│       │   │               ├── summary/
│       │   │               │   └── route.ts  # GET /api/polls/:slug/summary
│       │   │               └── votes/
│       │   │                   └── route.ts  # POST /api/polls/:slug/votes
│       │   └── (out)/          # Outbound adapters (databases, external APIs)
│       │       └── supabase/   # Production Supabase adapters
│       │           ├── create-poll-feed-source.ts
│       │           ├── create-polls-source.ts
│       │           ├── create-votes-source.ts
│       │           ├── client.ts           # Client-side Supabase
│       │           ├── server.ts           # Server-side Supabase
│       │           ├── types.ts            # Generated Supabase types
│       │           └── types-extended.ts   # Extended type definitions
│       ├── (public)/           # 🎨 UI pages, components and assets
│       │   ├── page.tsx        # Homepage
│       │   ├── layout.tsx      # Root layout
│       │   └── globals.css     # Global styles
│       └── favicon.ico
├── rest-client/                # 🧪 API testing with REST Client extension
│   ├── polls-feed.http
│   ├── polls-results.http
│   ├── polls-votes.http
│   └── health-check.http
├── supabase/                   # 🗄️ Database schema and configuration
│   ├── config.toml             # Supabase project configuration
│   └── migrations/             # Database schema migrations
├── public/                     # 📁 Static assets
│   ├── next.svg
│   ├── vercel.svg
│   └── favicon.ico
├── .env.example               # Environment variable template
├── .gitignore                 # Git ignore patterns
├── README.md                  # Project overview and getting started
├── AGENTS.md                  # AI agent instructions (canonical)
├── package.json               # Dependencies and scripts
├── next.config.ts             # Next.js configuration
├── tailwind.config.ts         # Tailwind CSS configuration
├── jest.config.ts             # Jest testing configuration
├── eslint.config.mjs          # ESLint configuration
└── tsconfig.json              # TypeScript configuration
```

### Architecture Legend

- 🏛️ **Domain Layer** (`_domain/`): Pure business logic with no external dependencies
- 🔌 **Adapters** (`(adapters)/`): Infrastructure implementations for databases, APIs, etc.
- 🔧 **Infrastructure** (`_infra/`, `_config/`): Cross-cutting concerns like middleware and configuration
- 🎨 **Presentation** (`(public)/`): UI pages, components, and user interface
- 🧪 **Testing** (`rest-client/`, `__tests__/`): Manual API testing and unit tests
- 🗄️ **Database** (`supabase/`): Schema migrations and database configuration

## Hexagonal/Ports & Adapters Pattern

This project implements strict hexagonal architecture with clear separation between domain and infrastructure. See the [complete directory structure](#project-structure-overview) above for the full layout.

### Core Architecture Principles

The hexagonal pattern organizes code into distinct layers:

## Use Cases & Domain Logic

The domain layer implements three core use cases for the directional sentiment polling system. Each use case includes comprehensive documentation above the function signature with purpose, business logic, source contracts, and error handling details.

### 1. Poll Feed (`get-poll-feed.ts`)

**Domain use case**: keyset-paginate the poll feed with a hard cap.

- **Source Contracts**: See [`poll-feed-source.ts`](../src/app/_domain/ports/out/poll-feed-source.ts) for complete interface definitions

### 2. Cast Vote (`cast-vote.ts`)

**Domain use case**: validate poll & option, ensure idempotency, append-only write.

- **Source Contracts**: See [`polls-source.ts`](../src/app/_domain/ports/out/polls-source.ts) and [`votes-source.ts`](../src/app/_domain/ports/out/votes-source.ts) for complete interface definitions

- **Domain Errors**:
  - `"not_found"` → poll slug doesn't exist
  - `"poll_closed"` → poll.status !== "open"
  - `"option_mismatch"` → optionId not part of the poll's options

### 3. Get Poll Results (`get-poll-results.ts`)

**Domain use case**: snapshot of "current" vote tallies (latest-per-user).

- **Source Contracts**: See [`polls-source.ts`](../src/app/_domain/ports/out/polls-source.ts) and [`votes-source.ts`](../src/app/_domain/ports/out/votes-source.ts) for complete interface definitions

- **Domain Errors**:
  - `"not_found"` → poll slug doesn't exist

## Port Contracts

All port interfaces are defined in the `_domain/ports/` directory:

### Inbound Ports (Use Case Interfaces)

- **[`cast-vote.ts`](../src/app/_domain/ports/in/cast-vote.ts)** - Vote casting input/output types
- **[`get-poll-feed.ts`](../src/app/_domain/ports/in/get-poll-feed.ts)** - Poll feed query input/output types
- **[`get-poll-results.ts`](../src/app/_domain/ports/in/get-poll-results.ts)** - Poll results query input/output types

### Outbound Ports (Data Source Interfaces)

- **[`poll-feed-source.ts`](../src/app/_domain/ports/out/poll-feed-source.ts)** - Poll feed pagination contract
- **[`polls-source.ts`](../src/app/_domain/ports/out/polls-source.ts)** - Poll metadata access contract
- **[`votes-source.ts`](../src/app/_domain/ports/out/votes-source.ts)** - Vote storage and tallying contract

## Domain Layer Rules

- **NEVER import from adapters** - domain stays pure
- **Use cases** contain domain logic (e.g., pagination, validation, idempotency)
- **Ports** define minimal interfaces for what domain needs
- **DTOs** are vendor-agnostic domain objects
- **Error handling** uses semantic domain errors (not technical exceptions)

## Error Handling Strategy

### Domain Error Types

The domain layer uses semantic error messages that adapters translate to HTTP status codes:

```typescript
// Domain errors (thrown from use cases)
"not_found"        → 404 Not Found
"poll_closed"      → 409 Conflict
"option_mismatch"  → 422 Unprocessable Entity
"supabase_*"       → 503 Service Unavailable
"*"                → 500 Internal Server Error
```

### Domain Error Patterns

```typescript
// Semantic domain errors (thrown from use cases)
throw new Error("not_found") // → 404
throw new Error("poll_closed") // → 409
throw new Error("option_mismatch") // → 422
throw new Error("supabase_query_failed", {cause: originalError}) // → 503
```

### Error Flow Pattern

1. **Use case** validates business rules and throws semantic errors
2. **Adapter** catches domain errors and maps to HTTP responses
3. **Logging** captures both error message and cause for debugging
4. **Client** receives consistent error format with appropriate status codes

## Data Flow

### Request Processing Pipeline

1. **API Route** (`(adapters)/(in)/api/`) receives HTTP request
2. **Input Validation** with Zod schemas (params, body, headers)
3. **Authentication** extracts user ID (Supabase auth or test header)
4. **Adapter Selection** creates data source adapters based on environment
5. **Dependency Injection** calls use case with ports and input
6. **Domain Logic** executes in use case (validation, idempotency, storage)
7. **Domain Objects** returned from use case to adapter
8. **Response Formatting** adapter transforms to HTTP response
9. **Error Mapping** domain errors translated to appropriate HTTP status codes

Each outbound port can have multiple implementations (see [`(adapters)/(out)/`](<../src/app/(adapters)/(out)/>) directory). All implementations must satisfy the same port interface contracts defined in [`_domain/ports/out/`](../src/app/_domain/ports/out/).

## Infrastructure

### Middleware

The `_infra/edge/` directory contains composable middleware for cross-cutting concerns that run at the edge (Next.js middleware). Middleware components can be composed together to handle authentication, rate limiting, and other edge concerns before requests reach the application routes.

## Architectural Patterns

### Vote Idempotency

Prevents duplicate votes through idempotency keys. See [`cast-vote.ts`](../src/app/_domain/use-cases/polls/cast-vote.ts) for implementation details.

### Real-time Vote Tallying

Results are calculated on-demand from vote history. See [`get-poll-results.ts`](../src/app/_domain/use-cases/polls/get-poll-results.ts) for implementation details.
