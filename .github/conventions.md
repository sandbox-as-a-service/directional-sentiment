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

- **Files**: kebab-case (`get-poll-feed.ts`)
- **Directories**: Next.js route groups `(adapters)`, `(in)`, `(out)`, `(public)`
- **Functions**: camelCase factory functions (`createSupabasePollFeedSource`)
- **Types**: PascalCase with descriptive suffixes (`PollFeedSource`, `GetPollFeedInput`)
- **Constants**: SCREAMING_SNAKE_CASE for module-level constants
- **Variables**: Use descriptive names that convey purpose and context
  - ✅ `pollTitle`, `userEmail`, `voteCount`
  - ❌ `title`, `email`, `count`
  - ✅ `currentPoll`, `selectedOption`
  - ❌ `x`, `y`,

## File Organization

```typescript
// Import order (automatically enforced by @trivago/prettier-plugin-sort-imports)
import {external} from "external-package"

import {internal} from "@/app/internal"

import type {Type} from "./types"

// Factory function pattern
export function createSomethingSource(config: Config): SomethingSource {
  return {
    async operation() {
      // implementation
    },
  }
}
```

**Note**: Import ordering is automatically handled by `@trivago/prettier-plugin-sort-imports` - no manual sorting required.

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

## Error Handling

### Domain Error Patterns

```typescript
// Semantic domain errors (thrown from use cases)
throw new Error("not_found") // → 404
throw new Error("poll_closed") // → 409
throw new Error("option_mismatch") // → 422
throw new Error("supabase_query_failed", {cause: originalError}) // → 503
```

### Adapter Error Mapping

```typescript
// In API routes - map domain errors to HTTP responses
catch (e) {
  const message = e instanceof Error ? e.message : String(e)
  const cause = e instanceof Error ? e.cause : undefined
  console.error(message, cause)

  if (message === "not_found") {
    return NextResponse.json({error: "not_found"}, {status: 404})
  }
  // ... other mappings
}
```

### Validation Error Handling

```typescript
// Zod validation with structured logging
const result = Schema.safeParse(data)
if (!result.success) {
  console.warn(result.error.issues)
  return NextResponse.json(
    {error: "bad_request", message: z.treeifyError(result.error).properties},
    {status: 400},
  )
}
```

### Logging Conventions

```typescript
// Success operations
console.info("🎉") // Use emoji for quick visual parsing (might change before the launch)

// Validation failures
console.warn(z.treeifyError(paramsParsed.error).properties) // Zod validation errors
console.warn(error.message, error.cause) // Auth/service warnings

// Unhandled exceptions
console.error(message, cause) // Always include cause when available
```
