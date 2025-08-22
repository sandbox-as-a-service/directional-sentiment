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
│   └── use-cases/     # Business logic implementation
│       └── polls/
│           ├── cast-vote.ts        # Vote validation & idempotency
│           ├── get-poll-feed.ts    # Paginated poll listing
│           ├── get-poll-results.ts # Vote tallying & results
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

## Use Cases & Business Logic

The domain layer implements three core use cases for the directional sentiment polling system:

### 1. Poll Feed (`get-poll-feed.ts`)

- **Purpose**: Paginated listing of available polls
- **Input**: Limit and optional cursor for pagination
- **Output**: Array of poll items with metadata
- **Business Rules**: Enforces pagination limits, cursor validation

### 2. Cast Vote (`cast-vote.ts`)

- **Purpose**: Record user votes with validation and idempotency
- **Input**: Poll slug, option ID, user ID, optional idempotency key
- **Output**: Void (success) or throws domain error
- **Business Rules**:
  - Poll must exist and be in "open" status
  - Option must belong to the poll
  - Idempotency key prevents duplicate votes
  - Append-only vote storage

### 3. Get Poll Results (`get-poll-results.ts`)

- **Purpose**: Retrieve vote tallies and poll statistics
- **Input**: Poll slug
- **Output**: Vote counts, percentages, poll status, timestamps
- **Business Rules**: Real-time vote tallying, percentage calculations

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
- **Use cases** contain business logic (e.g., pagination, validation, idempotency)
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

### Authentication & Environment Switching

```typescript
// In API routes - conditional adapter selection
let userId: string | null = null
let source: {polls: PollsSource; votes: VotesSource}

if (env.USE_MEMORY === "1") {
  // Test environment - use fixtures
  userId = req.headers.get("x-user-id")
  source = {
    polls: createMemoryPollsSource({polls: memoryPolls, options: memoryOptions}),
    votes: createMemoryVotesSource(),
  }
} else {
  // Production environment - use Supabase
  const supabase = await createClient()
  const {data, error} = await supabase.auth.getUser()
  if (error) console.warn(error.message, error.cause)

  userId = data?.user?.id ?? null
  source = {
    polls: createSupabasePollsSource(supabase),
    votes: createSupabaseVotesSource(supabase),
  }
}
```

## Logging & Observability

### Structured Logging Pattern

```typescript
// Success logging
console.info("🎉") // Use emoji for quick visual parsing

// Error logging with context
console.error(message, cause) // Always include cause when available

// Warning for validation issues
console.warn(parsed.error.issues) // Log validation details
console.warn(error.message, error.cause) // Log auth/service warnings
```

### Log Levels by Use Case

- **`console.info`**: Successful operations, business events
- **`console.warn`**: Validation failures, recoverable errors
- **`console.error`**: Unhandled exceptions, service failures

## Data Flow

### Request Processing Pipeline

1. **API Route** (`(adapters)/(in)/api/`) receives HTTP request
2. **Input Validation** with Zod schemas (params, body, headers)
3. **Authentication** extracts user ID (Supabase auth or test header)
4. **Adapter Selection** creates data source adapters based on environment
5. **Dependency Injection** calls use case with ports and input
6. **Business Logic** executes in use case (validation, idempotency, storage)
7. **Domain Objects** returned from use case to adapter
8. **Response Formatting** adapter transforms to HTTP response
9. **Error Mapping** domain errors translated to appropriate HTTP status codes

### Example: Cast Vote Flow

```typescript
POST /api/polls/poll-123/votes
Body: {optionId: "option-a", idempotencyKey: "unique-key"}

→ Validate params/body with Zod
→ Extract userId from auth or headers
→ Create polls/votes adapters (memory or Supabase)
→ Call castVote use case with dependencies
  ↳ Verify poll exists and is open
  ↳ Verify option belongs to poll
  ↳ Check idempotency key hasn't been used
  ↳ Append vote to storage
→ Return 204 No Content on success
→ Map domain errors to HTTP status (404, 409, 422, etc.)
```

## Middleware Infrastructure

The `_infra/edge/` directory contains composable middleware for cross-cutting concerns that run at the edge (Next.js middleware).

### Composition Pattern

```typescript
// src/middleware.ts
import {withSupabase} from "@/app/_infra/edge/auth/with-supabase"
import {compose} from "@/app/_infra/edge/compose"
import {withRateLimit} from "@/app/_infra/edge/rate-limit/with-rate-limit"

export default function middleware(req: NextRequest) {
  return compose(req, [withRateLimit, withSupabase])
}
```

### Middleware Contract

Each middleware follows a strict contract:

```typescript
export type Middleware = (req: NextRequest, res: NextResponse) => Promise<NextResponse> | NextResponse
```

**Rules:**

- **MUST return a NextResponse** - never void or undefined
- **Status 200 = pass-through** - continue to next middleware
- **Non-200 status = terminal** - stop chain and return immediately
- **Preserve context** - carry forward cookies/headers from previous middleware

### Available Middleware

- **`withRateLimit`** - Rate limiting (fail-open for resilience)
- **`withSupabase`** - Supabase auth session management and cookie handling

### Execution Flow

1. **Chain starts** with `NextResponse.next({request: req})`
2. **Each middleware** receives current request and response
3. **Pass-through** (status 200) continues to next middleware
4. **Terminal response** (non-200) stops chain immediately
5. **Final response** returned to client

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
const useMemory = env.USE_MEMORY === "1"
const source = useMemory
  ? createMemoryPollFeedSource(memoryPollFeed)
  : createSupabasePollFeedSource(await createClient())
```

This enables testing with controlled data while using real databases in production.
