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

## File Organization

```typescript
// Import order (handled by prettier-plugin-sort-imports)
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

## TypeScript Patterns

- Use `type` for unions and primitives, `type` for object shapes
- Prefix interfaces with purpose: `PollFeedSource`, `GetPollFeedInput`
- Export types from dedicated `dto/` folders in domain layer
- Use `import type` rather than `import` when importing types and interfaces

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
  console.warn(result.error.issues) // Log validation details
  return NextResponse.json({
    error: "bad_request",
    message: result.error.message
  }, {status: 400})
}
```

### Logging Conventions

```typescript
// Success operations
console.info("🎉") // Use emoji for quick visual parsing

// Validation failures
console.warn(parsed.error.issues)
console.warn(error.message, error.cause) // Auth/service warnings

// Unhandled exceptions
console.error(message, cause) // Always include cause when available
```
