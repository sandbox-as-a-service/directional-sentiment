# Development Workflow

## Commands

```bash
pnpm dev --turbopack        # Development server with Turbopack
pnpm test-api              # Run Bruno API tests
pnpm typegen               # Generate Next.js route types (runs automatically on pnpm dev and pnpm build)
pnpm build                 # Production build
pnpm lint                  # ESLint check (runs automatically on pnpm build)
pnpm format                # Prettier formatting
```

## Environment Modes

```bash
# Development with in-memory fixtures
USE_MEMORY=1 pnpm dev

# Development with Supabase
pnpm dev
```

## API Testing with Bruno

- **Location**: `collections/` directory
- **Format**: `.bru` files with HTTP requests
- **Environments**: `collections/environments/` (localhost, production)
- **Run tests**: `pnpm test-api` (uses `@usebruno/cli`)

### Bruno Test Structure

```
collections/
├── bruno.json           # Bruno configuration
├── environments/        # Environment variables
│   ├── localhost.bru
│   └── production.bru
├── health/             # Health check tests
│   ├── folder.bru      # Folder metadata
│   └── health.bru      # Health endpoint test
└── polls/              # Test suites by feature
    ├── folder.bru      # Folder metadata
    ├── get-poll-feed.bru
    ├── get-poll-feed-limit.bru
    ├── get-poll-feed-limit-cursor.bru
    ├── get-poll-feed-limit-cursor-invalid.bru
    ├── get-poll-feed-limit-invalid.bru
    ├── get-poll-results.bru
    └── cast-vote.bru
```

## Error Handling Pattern

API routes use structured error logging with semantic domain error mapping:

```typescript
try {
  await useCaseFunction(input)
  console.info("🎉") // Success indicator
  return NextResponse.json(result, {status: 200})
} catch (e) {
  const message = e instanceof Error ? e.message : String(e)
  const cause = e instanceof Error ? e.cause : undefined
  console.error(message, cause)

  // Map domain errors to HTTP status codes
  if (message === "not_found") {
    return NextResponse.json({error: "not_found"}, {status: 404})
  }
  if (message === "poll_closed") {
    return NextResponse.json({error: "poll_closed"}, {status: 409})
  }
  if (message === "option_mismatch") {
    return NextResponse.json({error: "option_mismatch"}, {status: 422})
  }
  if (message.startsWith("supabase")) {
    return NextResponse.json({error: "service_unavailable"}, {status: 503})
  }
  return NextResponse.json({error: "internal_server_error"}, {status: 500})
}
```

### Validation Error Logging

```typescript
const parsed = Schema.safeParse(input)
if (!parsed.success) {
  console.warn(parsed.error.issues) // Log validation details
  return NextResponse.json({error: "bad_request", message: parsed.error.message}, {status: 400})
}
```
