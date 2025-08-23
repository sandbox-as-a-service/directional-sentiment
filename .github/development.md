# Development Workflow

## Commands

```bash
pnpm dev --turbopack        # Development server with Turbopack
pnpm test                  # Run Jest unit tests
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

## Unit Testing with Jest

- **Location**: `src/app/_domain/use-cases/` directory (co-located with use cases)
- **Format**: `*.test.ts` files using Jest
- **Run tests**: `pnpm test` (uses Jest with TypeScript)

### Test Structure & Conventions

#### Scope & Structure

```typescript
// Top-level describe = unit under test (function name)
describe("getPollFeed", () => {
  // Nested describes = contexts/scenarios
  describe("without cursor", () => {
    it("returns 20 items and a nextCursor when more exist", async () => {
      // Test implementation
    })
  })

  describe("with cursor", () => {
    // Cursor-related tests
  })

  describe("limit handling", () => {
    // Boundary and validation tests
  })

  describe("edge cases", () => {
    // Empty datasets, error conditions
  })
})
```

#### Test Naming Rules

- **Top-level describe**: Function name being tested (`getPollFeed`)
- **Nested describes**: Context or scenario (`"without cursor"`, `"limit handling"`)
- **Test titles**: Present tense, behavior-focused, no "should" prefix
- **Implementation details**: Keep in assertions/comments, not titles

```typescript
// ✅ Good test titles
it("returns 20 items and a nextCursor when more exist")
it("clamps an excessive limit to 50")
it("returns the next page after the cursor")

// ❌ Avoid these patterns
it("should return 20 items") // No "should"
it("fetches N+1 items for pagination") // Implementation detail
it("works with cursor") // Too vague
```

#### Typing Rules

- **No `any` types**: Use domain DTOs and port interfaces
- **Type mocks properly**: Use `Parameters<>` and `ReturnType<>` for port methods
- **Import domain types**: Use `PollFeedSource`, `PollFeedItem`, etc.

```typescript
import type {PollFeedSource} from "@/app/_domain/ports/out/poll-feed-source"
import type {PollFeedItem} from "@/app/_domain/use-cases/polls/dto/poll"

// Typed mock using Parameters<> helper
function makePollFeedSource(allItems: PollFeedItem[]): PollFeedSource {
  const page = jest.fn(async ({limit, cursor}: Parameters<PollFeedSource["page"]>[0]) => {
    // Implementation
  })

  return {page}
}
```

#### Mocks & Test Doubles

- **Prefer in-memory fakes**: Small, deterministic implementations of port interfaces
- **Implement exact port surface**: Full interface, not partial mocks
- **Keep fakes typed**: Use domain types, avoid shortcuts

```typescript
// ✅ Typed fake implementing full port interface
function makePollFeedSource(allItems: PollFeedItem[]): PollFeedSource {
  const page = jest.fn(async ({limit, cursor}) => {
    // Deterministic logic matching production behavior
    let startIndex = 0
    if (cursor) {
      const cursorIndex = allItems.findIndex((item) => item.createdAt === cursor)
      startIndex = cursorIndex === -1 ? allItems.length : cursorIndex + 1
    }
    return allItems.slice(startIndex, startIndex + limit)
  })

  return {page} // Complete interface
}

// ❌ Avoid partial mocks or any types
const mockSource = {
  page: jest.fn().mockResolvedValue(/* any */),
} as any
```

#### Test Data & Fixtures

- **Use helper functions**: Create reusable, parameterized data builders
- **Keep fixtures realistic**: Match production data shapes and relationships
- **Make data deterministic**: Predictable timestamps, IDs, and ordering

```typescript
// Helper: newest-first items, 1-minute apart
function makeItems(count: number, startISO = "2025-08-20T12:00:00.000Z"): PollFeedItem[] {
  const startMs = new Date(startISO).getTime()
  return Array.from({length: count}, (_unused, index) => ({
    pollId: `p${index + 1}`,
    createdAt: new Date(startMs - index * 60_000).toISOString(), // DESC timestamps
  }))
}

// Usage in tests
const data = makeItems(25) // 25 items for pagination test
const smallData = makeItems(3) // 3 items for edge case
```

#### Edge Cases & Boundary Testing

- **Empty datasets**: Test with zero items
- **Boundary values**: Test limits, minimums, maximums
- **Invalid inputs**: Test validation and error handling
- **Off-by-one scenarios**: Test pagination boundaries

```typescript
describe("edge cases", () => {
  it("returns an empty result for an empty feed", async () => {
    const poll = makePollFeedSource([])
    const result = await getPollFeed({poll, input: {}})

    expect(result.items).toHaveLength(0)
    expect(result.nextCursor).toBeUndefined()
  })
})

describe("limit handling", () => {
  it("clamps an excessive limit to 50", async () => {
    const data = makeItems(120)
    const poll = makePollFeedSource(data)

    const result = await getPollFeed({poll, input: {limit: 100}})

    expect(result.items).toHaveLength(50) // Domain policy: max 50
  })
})
```

#### Assertions & Verification

- **Check meaningful state**: Verify lengths, key IDs, critical business fields
- **Assert domain invariants**: Test policy numbers (defaults, limits) explicitly
- **Include implementation checks**: Verify adapter calls in assertions/comments

```typescript
it("returns 20 items and a nextCursor when more exist", async () => {
  const data = makeItems(25)
  const poll = makePollFeedSource(data)

  const result = await getPollFeed({poll, input: {}})

  // Domain assertions
  expect(result.items).toHaveLength(20) // Default page size
  expect(result.nextCursor).toBe(result.items[19].createdAt)

  // Implementation verification (N+1 fetch for hasMore detection)
  expect(poll.page).toHaveBeenCalledWith({limit: 21, cursor: undefined})
})
```

#### Domain Invariants Testing

- **Treat domain defaults as authoritative**: Use cases enforce policy, not adapters
- **Test policy numbers explicitly**: Default page sizes, limits, clamps
- **Verify business rules**: Pagination logic, validation rules, idempotency

```typescript
describe("limit handling", () => {
  it("honors a smaller requested limit", async () => {
    // Test: domain respects user preference within bounds
  })

  it("clamps an excessive limit to 50", async () => {
    // Test: domain enforces maximum policy (50 items)
  })

  it("floors invalid limits to 1", async () => {
    // Test: domain enforces minimum policy (1 item)
  })
})
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
