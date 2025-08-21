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
- **Types**: PascalCase with descriptive suffixes (`PollFeedSource`, `GetPollFeedOptions`)
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

- Use `type` for unions and primitives, `interface` for object shapes
- Prefix interfaces with purpose: `PollFeedSource`, `GetPollFeedOptions`
- Export types from dedicated `dto/` folders in domain layer
- Use `import type` rather than `import` when importing types and interfaces

## Error Handling

```typescript
// Structured error creation
throw new Error("supabase_query_failed", {cause: originalError})

// Zod validation errors
const result = Schema.safeParse(data)
if (!result.success) {
  const issues = result.error.issues.map(({path, message}) => ({
    message,
    path: path.join(".")
  }))
  return {ok: false, issues}
}
```
