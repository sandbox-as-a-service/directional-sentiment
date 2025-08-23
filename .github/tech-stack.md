# Tech Stack & Dependencies

## Core Framework

- **Framework**: Next.js 15 with App Router and Turbopack
- **Language**: TypeScript 5
- **Package Manager**: pnpm (specified in packageManager field)
- **Runtime**: Node.js 22 with React 19

## Database & Validation

- **Database**: Supabase with `@supabase/supabase-js` v2.55+
- **Validation**: Zod v4+ for runtime type checking
- **SSR**: `@supabase/ssr` for server-side rendering

## Styling & UI

- **Styling**: Tailwind CSS v4
- **PostCSS**: `@tailwindcss/postcss` for processing
- **UI Library**: React 19 with built-in components

## Development Tools

### Linting & Formatting

- **ESLint**: v9 with Next.js config and Prettier integration
  - `@next/eslint-plugin-next`: v15.5+ for Next.js specific rules
  - `eslint-config-next`: v15.5+ for Next.js ESLint configuration
  - `eslint-config-prettier`: v10.1+ for Prettier integration
  - `eslint-plugin-react-hooks`: v5.2+ for React Hooks rules
  - `@eslint/eslintrc`: v3.3+ for legacy config support
- **Prettier**: v3.6+ with Tailwind plugin and import sorting
- **Import Sorting**: `@trivago/prettier-plugin-sort-imports` v5.2+

### Testing

- **Unit Testing**: Jest v30 with Next.js helpers (`next/jest`) for ts-node, environment variables, and module mapping
  - `@jest/globals`: v30+ for Jest globals in TypeScript
- **API Testing**: Bruno CLI (`@usebruno/cli`) v2.9+
- **Test Runner**: Bruno collections in `collections/` directory

### TypeScript & Development

- **TypeScript**: v5.9+ with strict type checking
- **ts-node**: v10.9+ for TypeScript execution in Node.js
- **Type Definitions**:
  - `@types/node`: v24.3+ for Node.js types
  - `@types/react`: v19.1+ for React types
  - `@types/react-dom`: v19.1+ for React DOM types

## Tool-Specific Guidance

### pnpm Usage

```bash
# Enable corepack first (if not already done)
corepack enable

# Install dependencies
pnpm install

# Development
pnpm dev --turbopack
```

### Zod Patterns

```typescript
const QuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(50).default(20),
  cursor: z.iso.datetime().optional(), // ISO with timezone
})
```

### Supabase Client Pattern

```typescript
// Server-side (request-scoped)
const client = await createClient()

// Query pattern
const {data, error} = await client
  .from("table")
  .select("fields")
  .order("created_at", {ascending: false})
  .limit(limit)

if (error) {
  throw new Error("supabase_query_failed", {cause: error})
}
```

### Tailwind Configuration

- Uses Tailwind CSS v4 with `@tailwindcss/postcss`
- Prettier plugin for class sorting: `prettier-plugin-tailwindcss`
