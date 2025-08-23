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
│   │           ├── route.ts      # GET /api/polls (poll feed)
│   │           └── [slug]/
│   │               ├── results/  # GET /api/polls/:slug/results
│   │               └── votes/    # POST /api/polls/:slug/votes
│   └── (out)/         # Outbound adapters (databases, external APIs)
│       ├── memory/               # In-memory test adapters
│       │   ├── compose-memory-sources.ts         # Singleton source composition
│       │   ├── create-memory-poll-feed-source.ts
│       │   ├── create-memory-polls-source.ts
│       │   ├── create-memory-votes-source.ts
│       │   └── fixtures/         # Test data fixtures
│       └── supabase/             # Production Supabase adapters
│           ├── create-supabase-poll-feed-source.ts
│           ├── create-supabase-polls-source.ts
│           ├── create-supabase-votes-source.ts
│           ├── client.ts         # Client-side Supabase
│           └── server.ts         # Server-side Supabase
└── (public)/          # UI pages, components and assets
```

## Use Cases & Domain Logic

The domain layer implements three core use cases for the directional sentiment polling system. Each use case includes comprehensive documentation above the function signature with purpose, business logic, source contracts, and error handling details.

### 1. Poll Feed (`get-poll-feed.ts`)

**Domain use case**: keyset-paginate the poll feed with a hard cap.

- **Domain Logic**:
  - Enforces a max page size
  - Uses the "fetch N+1" trick to learn if there's another page
  - Emits a `nextCursor` (createdAt of the last returned item) when more pages exist

- **Source Contracts**:
  - Results come sorted by createdAt DESC (newest first) or a stable order compatible with `cursor`
  - `cursor` is an ISO datetime (TZ-aware) that the adapter knows how to use for keyset pagination

### 2. Cast Vote (`cast-vote.ts`)

**Domain use case**: validate poll & option, ensure idempotency, append-only write.

- **Domain Logic**:
  - Lookup poll by slug and ensure it's open
  - Validate that the chosen option belongs to the poll
  - If an idempotencyKey is provided and already used by this user, act as a no-op
  - Append a new vote event (no overwrites here; readers compute "latest vote wins")

- **Source Contracts**:
  - `PollsSource.findBySlug(slug)` → returns the poll or null/undefined if not found
  - `PollsSource.listOptions(pollId)` → returns all options for the poll
  - `VotesSource.wasUsed(userId, key)` → boolean, scoped per user+key
  - `VotesSource.append(event)` → persists a vote event (append-only)

- **Domain Errors**:
  - `"not_found"` → poll slug doesn't exist
  - `"poll_closed"` → poll.status !== "open"
  - `"option_mismatch"` → optionId not part of the poll's options

### 3. Get Poll Results (`get-poll-results.ts`)

**Domain use case**: snapshot of "current" vote tallies (latest-per-user).

- **Domain Logic**:
  - Resolve poll by slug (id + status only)
  - Ask VotesSource for per-option tallies of current votes
  - Sum totals and compute percentages to 1 decimal place (guard /0)

- **Source Contracts**:
  - `PollsSource.findBySlug(slug)` → `{ pollId, status } | null`
  - `VotesSource.tallyCurrent(pollId)` → `Array<{ optionId: string; count: number }>` where `count` is the number of unique users whose latest vote targets that option

- **Domain Errors**:
  - `"not_found"` → poll slug doesn't exist

- **Implementation Notes**:
  - Percentages may not sum to exactly 100.0 due to rounding
  - If you need zero-count options included, merge with `PollsSource.listOptions()` and fill missing tallies with `{ count: 0 }` before computing percentages

## Port Contracts

### Inbound Ports (Use Case Interfaces)

```typescript
// Cast Vote
type CastVoteInput = {
  slug: string
  optionId: string
  userId: string
  idempotencyKey?: string
}

// Get Poll Results
type GetPollResultsResult = {
  items: PollResultsItem[]
  total: number
  status: PollStatus
  updatedAt: string
}
```

### Outbound Ports (Data Source Interfaces)

```typescript
// Poll metadata access
type PollsSource = {
  findBySlug(slug: string): Promise<PollSummary | null>
  listOptions(pollId: string): Promise<Array<PollOption>>
}

// Vote storage and tallying
type VotesSource = {
  append(input: {pollId: string; optionId: string; userId: string; idempotencyKey?: string}): Promise<void>
  wasUsed(userId: string, idempotencyKey: string): Promise<boolean>
  tallyCurrent(pollId: string): Promise<Array<{optionId: string; count: number}>>
}

// Poll feed pagination
type PollFeedSource = {
  page(input: {limit: number; cursor?: string}): Promise<Array<PollFeedItem>>
}
```

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

### Error Flow Pattern

1. **Use case** validates business rules and throws semantic errors
2. **Adapter** catches domain errors and maps to HTTP responses
3. **Logging** captures both error message and cause for debugging
4. **Client** receives consistent error format with appropriate status codes

### Adapter Error Handling

```typescript
try {
  await useCaseFunction(input)
  return NextResponse.json(result, {status: 200})
} catch (e) {
  const message = e instanceof Error ? e.message : String(e)
  const cause = e instanceof Error ? e.cause : undefined
  console.error(message, cause)

  // Map domain errors to HTTP status codes
  if (message === "not_found") {
    return NextResponse.json({error: "not_found"}, {status: 404})
  }
  // ... other mappings
}
```

## Adapter Pattern Examples

### Multiple Data Source Implementations

```typescript
// Domain port (interface)
export type PollFeedSource = {
  page(input: {limit: number; cursor?: string}): Promise<Array<PollFeedItem>>
}

// Multiple implementations
createMemoryPollFeedSource(fixture) // for testing
createSupabasePollFeedSource(client) // for production
```

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

## Middleware Infrastructure

The `_infra/edge/` directory contains composable middleware for cross-cutting concerns that run at the edge (Next.js middleware). Middleware components can be composed together to handle authentication, rate limiting, and other edge concerns before requests reach the application routes.

## Key Architectural Patterns

### Vote Idempotency

Prevents duplicate votes through idempotency keys:

```typescript
// Client provides optional idempotency key
{optionId: "option-a", idempotencyKey: "user-action-123"}

// Use case checks if key was previously used
if (input.idempotencyKey) {
  const used = await votes.wasUsed(input.userId, input.idempotencyKey)
  if (used) return // No-op, already processed
}

// Store vote with idempotency key for future checks
await votes.append({pollId, optionId, userId, idempotencyKey})
```

### Real-time Vote Tallying

Results are calculated on-demand from vote history:

```typescript
// No pre-computed aggregates - always fresh from source
const tallies = await votes.tallyCurrent(pollId)
const total = tallies.reduce((sum, t) => sum + t.count, 0)
const items = tallies.map((t) => ({
  optionId: t.optionId,
  count: t.count,
  pct: total > 0 ? Math.round((t.count / total) * 100) : 0,
}))
```

### Environment Switching

Seamless switching between test fixtures and production data:

```typescript
// Example from GET /api/polls route
let source: {poll: PollFeedSource}
if (env.USE_MEMORY === "1") {
  source = {
    poll: createMemoryPollFeedSource(memoryPollFeed),
  }
} else {
  const supabase = await createClient()
  source = {
    poll: createSupabasePollFeedSource(supabase),
  }
}
```

This enables testing with controlled data while using real databases in production. Each route creates its own source object with the specific adapters it needs (e.g., `poll`, `polls`, `votes`).

**Note**: Routes that need to share state (like vote casting and results) use `composeMemorySource()` for the singleton pattern, while routes that only need specific adapters (like poll feed) create individual source objects.
