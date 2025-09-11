# Architecture Guidelines

## Hexagonal/Ports & Adapters Pattern

This project uses strict hexagonal architecture with clear separation between domain and infrastructure:

```
src/app/
├── _domain/           # Pure domain logic (no external dependencies)
│   ├── ports/
│   │   ├── in/        # Use case contracts (what the domain offers)
│   │   │   ├── cast-vote.ts
│   │   │   ├── get-personalized-poll-feed.ts
│   │   │   ├── get-poll-feed.ts
│   │   │   ├── get-poll-results.ts
│   │   │   └── get-poll-summary.ts
│   │   └── out/       # Data source contracts (what the domain needs)
│   │       ├── poll-feed-source.ts
│   │       ├── polls-source.ts
│   │       └── votes-source.ts
│   └── use-cases/     # Domain logic implementation
│       └── polls/
│           ├── cast-vote.ts
│           ├── get-personalized-poll-feed.ts
│           ├── get-poll-feed.ts
│           ├── get-poll-results.ts
│           ├── get-poll-summary.ts
│           ├── __tests__/
│           │   ├── cast-vote.test.ts
│           │   ├── get-personalized-poll-feed.test.ts
│           │   ├── get-poll-feed.test.ts
│           │   ├── get-poll-results.test.ts
│           │   ├── get-poll-summary.test.ts
│           │   └── shared-helpers.ts
│           └── dto/
│               └── poll.ts
├── _infra/            # Infrastructure concerns (cross-cutting)
│   └── edge/          # Edge middleware components
│       ├── compose.ts
│       ├── auth/
│       └── rate-limit/
├── (adapters)/
│   ├── (in)/          # Inbound adapters (API routes, Server Actions)
│   │   └── api/
│   │       ├── auth/
│   │       │   ├── callback/
│   │       │   │   └── route.ts
│   │       │   ├── sign-in/
│   │       │   │   └── route.ts
│   │       │   └── sign-out/
│   │       │       └── route.ts
│   │       ├── health/
│   │       └── polls/
│   │           ├── feed/
│   │           │   └── route.ts
│   │           └── [slug]/
│   │               ├── results/
│   │               ├── summary/
│   │               └── votes/
│   └── (out)/         # Outbound adapters (databases, external APIs)
│       └── supabase/
│           ├── create-poll-feed-source.ts
│           ├── create-polls-source.ts
│           ├── create-votes-source.ts
│           ├── client.ts
│           ├── server.ts
│           └── types.ts
└── (public)/          # UI pages, components and assets
```

## Use Cases & Domain Logic

The domain layer implements the core use cases for the directional sentiment polling system. Each use case is a single function that encapsulates a specific piece of domain logic.

Key use cases include:

- **`getPollFeed`**: Retrieves a paginated feed of polls.
- **`getPersonalizedPollFeed`**: Retrieves a poll feed tailored to a user's interactions.
- **`getPollResults`**: Tallies votes and calculates results for a specific poll.
- **`getPollSummary`**: Fetches a pre-calculated summary for a poll, including vote counts and percentages.
- **`castVote`**: Validates and records a user's vote, ensuring idempotency.

Each use case is responsible for enforcing domain rules, such as pagination limits, poll status checks, and data validation. They interact with data sources through outbound ports to remain decoupled from infrastructure concerns.

## Port Contracts

All port interfaces are defined in the `_domain/ports/` directory. These contracts define the boundary between the domain layer and the infrastructure adapters.

### Inbound Ports (Use Case Interfaces)

Located in `src/app/_domain/ports/in/`, these define the interfaces for the use cases that the application provides. Each file corresponds to a specific use case's input and output contracts.

### Outbound Ports (Data Source Interfaces)

Located in `src/app/_domain/ports/out/`, these define the interfaces for the data sources that the domain logic needs to function (e.g., fetching polls, storing votes).

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
// Semantic domain errors (thrown from use cases only)
// Domain never throws vendor-specific codes; outbound adapters surface those.
throw new Error("not_found") // → 404
throw new Error("poll_closed") // → 409
throw new Error("option_mismatch") // → 422
// Vendor/infra failures are represented by adapter-specific errors (e.g., "supabase_query_failed")
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

The `_infra/edge/` directory contains composable middleware for cross-cutting concerns that run at the edge (Next.js middleware). Middleware components are composed using the `compose` helper and run before application routes.

**Composition:**

- Entry point: `src/middleware.ts` composes steps with `compose(req, [withRateLimit, withSupabase])`.
- Helper: `src/app/_infra/edge/compose.ts` orchestrates pass-through vs terminal responses.

**Contract:**

```ts
// Every middleware MUST return a NextResponse
export type Middleware = (req: NextRequest, res: NextResponse) => Promise<NextResponse> | NextResponse
```

**Rules:**

- Return a `NextResponse` (never `void`).
- Status 200 = pass-through to next middleware.
- Non-200 = terminal; immediately return.
- Preserve context by forwarding the latest `NextResponse`.

**Available Middleware:**

- `withRateLimit` — Rate limiting (fail-open for resilience)
- `withSupabase` — Supabase auth session and cookie management

**Execution Flow:**

1. Start with `NextResponse.next({request: req})`.
2. Each middleware receives `(req, currentResponse)` and returns a new `NextResponse`.
3. If status is 200, continue; otherwise, stop and return.
4. Return the final response after the chain.

See source: `src/app/_infra/edge/compose.ts`, `src/app/_infra/edge/rate-limit/with-rate-limit.ts`, `src/app/_infra/edge/auth/with-supabase.ts`, and `src/middleware.ts`.

## Architectural Patterns

### Vote Idempotency

Prevents duplicate votes through idempotency keys. See [`cast-vote.ts`](../src/app/_domain/use-cases/polls/cast-vote.ts) for implementation details.

### Real-time Vote Tallying

Results are calculated on-demand from vote history. See [`get-poll-results.ts`](../src/app/_domain/use-cases/polls/get-poll-results.ts) for implementation details.
