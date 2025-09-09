# Development Workflow

## Commands

```bash
pnpm dev                    # Development server with Turbopack
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

## Middleware

For middleware architecture, composition pattern, and available components, see Architecture → Middleware in `.github/architecture.md`.
