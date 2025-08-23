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
- **Prettier**: v3.6+ with Tailwind plugin and import sorting
- **Import Sorting**: `@trivago/prettier-plugin-sort-imports`

### Testing

- **Unit Testing**: Jest v30 with Next.js helpers (`next/jest`) for ts-node, environment variables, and module mapping
- **API Testing**: Bruno CLI (`@usebruno/cli`) v2.9+
- **Test Runner**: Bruno collections in `collections/` directory

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
