# Architecture Guidelines

## Hexagonal/Ports & Adapters Pattern

This project uses strict hexagonal architecture with clear separation between domain and infrastructure:

```
src/app/
├── _domain/           # Pure domain logic (no external dependencies)
│   ├── ports/
│   │   ├── in/        # Use case contracts (what the domain offers)
│   │   └── out/       # Data source contracts (what the domain needs)
│   └── use-cases/     # Business logic implementation
├── (adapters)/
│   ├── (in)/          # Inbound adapters (API routes, Server Actions)
│   └── (out)/         # Outbound adapters (databases, external APIs)
└── (public)/          # UI pages, components and assets
```

## Domain Layer Rules

- **NEVER import from adapters** - domain stays pure
- **Use cases** contain business logic (e.g., pagination, validation)
- **Ports** define minimal interfaces for what domain needs
- **DTOs** are vendor-agnostic domain objects

## Adapter Pattern Example

```typescript
// Domain port (interface)
export interface PollFeedSource {
  page(input: {limit: number; cursor?: string}): Promise<Array<PollFeedItem>>
}

// Multiple implementations
createMemoryPollFeedSource(fixture) // for testing
createSupabasePollFeedSource(client) // for production
```

## Data Flow

1. **API Route** (`(adapters)/(in)/api/`) receives request
2. **Validates input** with Zod schemas
3. **Creates data source adapter** based on environment
4. **Calls use case** with dependency injection
5. **Use case** handles business logic (pagination, limits)
6. **Returns domain objects** to adapter
7. **Adapter formats response** for client

## Environment Switching

```typescript
const useMemory = process.env.USE_MEMORY === "1"
const source = useMemory
  ? createMemoryPollFeedSource(pollFeedFixture)
  : createSupabasePollFeedSource(await createClient())
```

This allows seamless switching between in-memory fixtures (testing) and real data sources (production).
