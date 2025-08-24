# Architecture Guidelines

## Hexagonal/Ports & Adapters Pattern

This project uses strict hexagonal architecture with clear separation between domain and infrastructure:

```
src/app/
├── _domain/           # Pure domain logic (no external dependencies)
│   ├── ports/
│   │   ├── in/        # Use case contracts (what the domain offers)
│   │   │   ├── cast-vote.ts       # Vote casting input/output types
│   │   │   ├── get-poll-feed.ts   # Poll feed query types
│   │   │   └── get-poll-results.ts # Poll results query types
│   │   └── out/       # Data source contracts (what the domain needs)
│   │       ├── poll-feed-source.ts # Poll feed data access
│   │       ├── polls-source.ts     # Poll metadata access
│   │       └── votes-source.ts     # Vote storage and tallying
│   └── use-cases/     # Domain logic implementation
│       └── polls/
│           ├── cast-vote.ts        # Vote validation & idempotency
│           ├── get-poll-feed.ts    # Paginated poll listing
│           ├── get-poll-results.ts # Vote tallying & results
│           ├── __tests__/          # Feature test folder
│           │   ├── get-poll-feed.test.ts
│           │   ├── get-poll-results.test.ts
│           │   └── shared-helpers.ts # Test utilities
│           └── dto/
│               └── poll.ts         # Domain transfer objects
├── _infra/            # Infrastructure concerns (cross-cutting)
│   └── edge/          # Edge middleware components
│       ├── compose.ts # Middleware composition utility
│       ├── auth/      # Authentication middleware
│       └── rate-limit/ # Rate limiting middleware
├── (adapters)/
│   ├── (in)/          # Inbound adapters (API routes, Server Actions)
│   │   └── api/
│   │       ├── health/           # Health check endpoint
│   │       └── polls/
│   │           ├── feed/
│   │           │   └── route.ts  # GET /api/polls/feed (poll feed)
│   │           └── [slug]/
│   │               ├── results/  # GET /api/polls/:slug/results
│   │               └── votes/    # POST /api/polls/:slug/votes
│   └── (out)/         # Outbound adapters (databases, external APIs)
│       └── supabase/             # Production Supabase adapters
│           ├── create-poll-feed-source.ts
│           ├── create-polls-source.ts
│           ├── create-votes-source.ts
│           ├── client.ts         # Client-side Supabase
│           └── server.ts         # Server-side Supabase
│           └── types.ts          # Supabase Typescript types
└── (public)/          # UI pages, components and assets
```

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
