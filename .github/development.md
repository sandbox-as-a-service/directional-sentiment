# Development Workflow

## Commands

```bash
pnpm dev --turbopack        # Development server with Turbopack
pnpm test:unit:jest         # Run Jest unit tests
pnpm test:unit:jest:watch   # Run Jest unit tests in watch mode
pnpm test:unit:jest:cov      # Run Jest unit tests with coverage
pnpm test:api:bruno         # Run Bruno API tests
pnpm test:api:bruno:local   # Run Bruno API tests against localhost
pnpm test:api:bruno:prod    # Run Bruno API tests against production
pnpm typegen               # Generate Next.js route types (runs automatically on pnpm dev and pnpm build)
pnpm build                 # Production build
pnpm lint                  # ESLint check (runs automatically on pnpm build)
pnpm format                # Prettier formatting
```

**Setup Requirements:**

- Enable corepack: `corepack enable`

## Environment Modes

```bash
# Development with in-memory fixtures
USE_MEMORY=1 pnpm dev

# Development with Supabase
pnpm dev
```

### Environment Switching

API routes use conditional adapter selection based on environment:

```typescript
// In API routes - conditional adapter selection
let userId: string | null = null
let source: {polls: PollsSource; votes: VotesSource}

if (env.USE_MEMORY === "1") {
  // Test environment - use shared singleton for state consistency
  userId = req.headers.get("x-user-id")
  source = composeMemorySource() // Singleton ensures vote persistence across routes
} else {
  // Production environment - use Supabase
  const supabase = await createSupabaseServerClient()
  const {data, error} = await supabase.auth.getUser()
  if (error) console.warn(error.message, error.cause)

  userId = data?.user?.id ?? null
  source = {
    polls: createSupabasePollsSource(supabase),
    votes: createSupabaseVotesSource(supabase),
  }
}
```

### Memory Source Composition

The `compose-memory-sources.ts` provides a singleton pattern for in-memory testing that maintains state consistency across different API routes:

```typescript
// Singleton instance shared across all route handlers (per Node.js process)
// This ensures votes cast in one route are visible in other routes
let memorySource: ReturnType<typeof source> | null = null

export function composeMemorySource() {
  if (!memorySource) {
    memorySource = source()
  }
  return memorySource
}
```

**Key Benefits:**

- **State Persistence**: Votes cast via `POST /api/polls/:slug/votes` are immediately visible in `GET /api/polls/:slug/results`
- **Cross-Route Consistency**: All routes share the same in-memory data instance within a Node.js process
- **Test Reliability**: Enables realistic end-to-end testing workflows without external dependencies
- **Singleton Pattern**: Prevents creating multiple disconnected memory instances that would lose data

## Unit Testing with Jest

- **Location**: `__tests__/` folders per feature (e.g., `src/app/_domain/use-cases/polls/__tests__/`)
- **Format**: `*.test.ts` files using Jest v30 with Next.js helpers
- **Run tests**: `pnpm test:unit:jest` (uses Jest v30 with TypeScript configured via `next/jest`)
- **Configuration**: Jest configured with Next.js helpers for SWC transforms, auto mocking stylesheets/images, loading environment variables, and ignoring node_modules/Next.js build files
- **Guidelines**: See `testing.md` for detailed methodology and conventions

## API Testing with Bruno

- **Location**: `collections/` directory
- **Format**: `.bru` files with HTTP requests
- **Environments**: `collections/environments/` (localhost, production)
- **Run tests**: `pnpm test:api:bruno:prod` or `pnpm test:api:bruno:local` (uses `@usebruno/cli`)
- **Guidelines**: See `testing.md` for naming conventions and structure

## Error Handling

API routes use structured error logging with semantic domain error mapping. See `conventions.md` for detailed error handling patterns and validation conventions.

## Middleware Infrastructure

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
