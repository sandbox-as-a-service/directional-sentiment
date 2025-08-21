# Copilot Instructions for Directional Sentiment

## Architecture Overview

This is a Next.js 15 project using **Hexagonal/Ports & Adapters architecture** with clear separation between domain logic and infrastructure:

- `src/app/_domain/` - Pure domain logic (use cases, DTOs, port interfaces)
- `src/app/(adapters)/(in)/` - Inbound adapters (API routes)
- `src/app/(adapters)/(out)/` - Outbound adapters (data sources: memory, Supabase)
- `src/app/(public)/` - UI components and public assets

## Key Patterns

### Domain-Driven Structure

- **Use Cases** in `_domain/use-cases/` contain business logic (e.g., `getPollFeed`)
- **Ports** define interfaces: `ports/in/` for use case contracts, `ports/out/` for data source contracts
- **DTOs** in `dto/` folders are vendor-agnostic domain objects
- Domain layer NEVER imports from adapters - only the reverse

### Adapter Pattern Examples

```typescript
// Domain port (interface)
export interface PollFeedSource {
  page(input: {limit: number; cursor?: string}): Promise<Array<PollFeedItem>>
}

// Multiple implementations
createMemoryPollFeedSource(fixture) // for testing
createSupabasePollFeedSource(client) // for production
```

### API Route Pattern

Routes in `(adapters)/(in)/api/` follow this structure:

1. Parse/validate query params with Zod schemas
2. Choose adapter based on environment (`USE_MEMORY=1` for testing)
3. Call domain use case with dependency injection
4. Handle errors with structured logging using `node:util.inspect`

### Environment Switching

- `USE_MEMORY=1` enables in-memory fixtures for development/testing
- Production uses Supabase via `createSupabasePollFeedSource`

## Development Workflow

### Key Commands

```bash
pnpm dev --turbopack        # Development server with Turbopack
pnpm test-api              # Run Bruno API tests
pnpm typegen               # Generate Next.js types
```

### API Testing

- Uses Bruno CLI (`@usebruno/cli`) in `collections/` directory
- Test files are `.bru` format with environment variables in `environments/`
- Run `pnpm test-api` to execute all API tests

### Data Flow Example

1. `GET /api/polls` → `route.ts` (input adapter)
2. Validates with Zod → Creates data source adapter
3. Calls `getPollFeed` use case → Returns paginated results
4. Use case handles pagination logic, cursor-based paging

## Naming Conventions

- **Files**: kebab-case (`get-poll-feed.ts`)
- **Directories**: Use Next.js route groups `(adapters)`, `(in)`, `(out)`, `(public)`
- **Functions**: camelCase factory functions (`createSupabasePollFeedSource`)
- **Types**: PascalCase with descriptive suffixes (`PollFeedSource`, `GetPollFeedOptions`)

## Dependencies & Tech Stack

- **Framework**: Next.js 15 with App Router and Turbopack
- **Database**: Supabase with `@supabase/supabase-js`
- **Validation**: Zod for runtime type checking
- **Styling**: Tailwind CSS
- **Package Manager**: pnpm (specified in packageManager field)
- **Testing**: Bruno for API testing, in-memory fixtures for unit testing
