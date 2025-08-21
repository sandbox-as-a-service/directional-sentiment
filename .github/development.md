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
└── polls/              # Test suites by feature
    ├── folder.bru      # Folder metadata
    ├── get-poll-feed.bru
    └── get-poll-feed-limit.bru
```

## Error Handling Pattern

API routes use structured error logging:

```typescript
catch (e) {
  if (e instanceof Error) {
    console.error(inspect({name: e.name, msg: e.message, cause: e.cause}))
  } else {
    console.error("Unknown Error:", e)
  }
  return NextResponse.json({error: "internal_error"}, {status: 500})
}
```

## Debugging

- Use `node:util.inspect` for detailed error logging
- Environment switching helps isolate data layer issues
- Bruno tests provide integration test coverage
