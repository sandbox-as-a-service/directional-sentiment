# Code Conventions

## Commit Message Format

Follow Conventional Commits:

### Format: type(scope?): subject

**Allowed types:** feat, fix, docs, style, refactor, perf, test, chore, ci, build

**Rules:**

- Subject: imperative, concise (≤ 72 chars), no trailing period
- Body (optional): provide additional context if needed
- Footer (optional): use for BREAKING CHANGE: description or issue references

### Examples

```
feat(parser): add ability to parse directional sentiment
fix(api): handle null responses from upstream
docs(readme): update setup instructions
```

## Naming Conventions

### Files & Directories

- **Files**: kebab-case (`get-poll-feed.ts`)
- **Directories**: Next.js route groups `(adapters)`, `(in)`, `(out)`, `(public)`

### Functions & Types

- **Functions**: camelCase factory functions (`createPollFeedSource`)
- **Types**: PascalCase with descriptive suffixes (`PollFeedSource`, `GetPollFeedInput`)
- **Constants**: SCREAMING_SNAKE_CASE for module-level constants

### Variables

Use descriptive names that convey purpose and context:

- ✅ `pollTitle`, `userEmail`, `voteCount`
- ❌ `title`, `email`, `count`
- ✅ `currentPoll`, `selectedOption`
- ❌ `x`, `y`,

**Transformation Variables**

Use specific names when the transformation is specific:

- ✅ `clampedLimit` (after Math.min/Math.max clamp)
- ✅ `resolvedQuorum` (after applying defaults)
- ✅ `validatedLimit` (after schema/domain validation)

**Collection Variables**

Avoid vague prefixes like `effective*` on collections. Name by role instead:

- ✅ `pageItems`, `visibleItems`, `currentPolls`
- ❌ `effectivePolls`, `effectiveItems`

## Import Organization

```typescript
// Import order (automatically enforced by @trivago/prettier-plugin-sort-imports)
import {external} from "external-package"

import {internal} from "@/app/internal"

import type {Type} from "./types"
```

**Note**: Import ordering is automatically handled by `@trivago/prettier-plugin-sort-imports` - no manual sorting required.

## Code Structure Patterns

### Factory Function Pattern

```typescript
// Factory function pattern for creating adapters
export function createSomethingSource(config: Config): SomethingSource {
  return {
    async operation() {
      // implementation
    },
  }
}
```

## TypeScript Patterns

- Use `type` for all type definitions (avoid mixing `interface` and `type` keywords)
- Prefix interfaces with purpose: `PollFeedSource`, `GetPollFeedInput`
- Export types from dedicated `dto/` folders in domain layer
- Use `import type` rather than `import` when importing types and interfaces
- Prefer functions over classes for implementation
- Favor functional programming patterns over imperative loops
  - ✅ `items.map(item => transform(item))`
  - ❌ `for (const item of items) { ... }`
  - ✅ `items.filter(predicate).find(condition)`
  - ❌ Manual loop with break/continue statements

## Validation & Data Patterns

### Zod Schema Patterns

```typescript
const QuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(50).default(20),
  cursor: z.iso.datetime().optional(), // ISO with timezone
})
```

### Supabase Query Patterns

```typescript
// Server-side (request-scoped)
const client = await createSupabaseServerClient()

// Query pattern with error handling
const {data, error} = await client
  .from("table")
  .select("fields")
  .order("created_at", {ascending: false})
  .limit(limit)

if (error) {
  throw new Error("supabase_query_failed", {cause: error})
}
```

## Error Handling Conventions

### Adapter Error Mapping

```typescript
// In API routes - map domain errors to HTTP responses
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

### Validation Error Handling

```typescript
// Zod validation with structured logging
const result = Schema.safeParse(data)
if (!parsed.success) {
  const message = z.treeifyError(parsed.error).properties
  console.warn(message)
  return NextResponse.json({error: "bad_request", message}, {status: 400})
}
```

## Logging Conventions

### Structured Logging Pattern

```typescript
// Success operations
console.info("🎉") // Use emoji for quick visual parsing (might change before the launch)

// Validation failures
console.warn(z.treeifyError(paramsParsed.error).properties) // Zod validation errors
console.warn(error.message, error.cause) // Auth/service warnings

// Unhandled exceptions
console.error(message, cause) // Always include cause when available
```

### Log Levels by Use Case

- **`console.info`**: Successful operations, business events
- **`console.warn`**: Validation failures, recoverable errors
- **`console.error`**: Unhandled exceptions, service failures
