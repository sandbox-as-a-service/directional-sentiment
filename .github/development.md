# Development Workflow

## Commands

```bash
pnpm dev --turbopack        # Development server with Turbopack
pnpm test:unit:jest         # Run Jest unit tests
pnpm test:unit:jest:watch   # Run Jest unit tests in watch mode
pnpm test:unit:jest:cov      # Run Jest unit tests with coverage
pnpm typegen               # Generate Next.js route types (runs automatically on pnpm dev and pnpm build)
pnpm build                 # Production build
pnpm lint                  # ESLint check (runs automatically on pnpm build)
pnpm format                # Prettier formatting
```

**Setup Requirements:**

- Enable corepack: `corepack enable`

## Unit Testing with Jest

- **Location**: `__tests__/` folders per feature (e.g., `src/app/_domain/use-cases/polls/__tests__/`)
- **Format**: `*.test.ts` files using Jest v30 with Next.js helpers
- **Run tests**: `pnpm test:unit:jest` (uses Jest v30 with TypeScript configured via `next/jest`)
- **Configuration**: Jest configured with Next.js helpers for SWC transforms, auto mocking stylesheets/images, loading environment variables, and ignoring node_modules/Next.js build files
- **Guidelines**: See `testing.md` for detailed methodology and conventions

## Error Handling

API routes use structured error logging with semantic domain error mapping. See `conventions.md` for detailed error handling patterns and validation conventions.

## Middleware Infrastructure

### Composition Pattern

Middleware components are composed using the [`compose`](../src/app/_infra/edge/compose.ts) function. See [`src/middleware.ts`](../src/middleware.ts) for the implementation example.

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
