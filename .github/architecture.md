# Architecture Guidelines

## Hexagonal/Ports & Adapters Pattern

This project uses strict hexagonal architecture with clear separation between domain and infrastructure:

```
src/app/
├── _domain/           # Pure domain logic (no external dependencies)
│   ├── ports/
│   │   ├── in/        # Use case contracts (what the domain offers)
│   │   └── out/       # Data source contracts (what the domain needs)
│   └── use-cases/     # Business logic implementation
├── _infra/            # Infrastructure concerns (cross-cutting)
│   └── edge/          # Edge middleware components
│       ├── compose.ts # Middleware composition utility
│       ├── auth/      # Authentication middleware
│       └── rate-limit/ # Rate limiting middleware
├── (adapters)/
│   ├── (in)/          # Inbound adapters (API routes, Server Actions)
│   └── (out)/         # Outbound adapters (databases, external APIs)
└── (public)/          # UI pages, components and assets
```

## Domain Layer Rules

- **NEVER import from adapters** - domain stays pure
- **Use cases** contain business logic (e.g., pagination, validation)
- **Ports** define minimal interfaces for what domain needs
- **DTOs** are vendor-agnostic domain objects

## Adapter Pattern Example

```typescript
// Domain port (type)
export type PollFeedSource {
  page(input: {limit: number; cursor?: string}): Promise<Array<PollFeedItem>>
}

// Multiple implementations
createMemoryPollFeedSource(fixture) // for testing
createSupabasePollFeedSource(client) // for production
```

## Data Flow

1. **API Route** (`(adapters)/(in)/api/`) receives request
2. **Validates input** with Zod schemas
3. **Creates data source adapter** based on environment
4. **Calls use case** with dependency injection
5. **Use case** handles business logic (pagination, limits)
6. **Returns domain objects** to adapter
7. **Adapter formats response** for client

## Environment Switching

```typescript
const useMemory = process.env.USE_MEMORY === "1"
const source = useMemory
  ? createMemoryPollFeedSource(pollFeedFixture)
  : createSupabasePollFeedSource(await createClient())
```

This allows seamless switching between in-memory fixtures (testing) and real data sources (production).

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
