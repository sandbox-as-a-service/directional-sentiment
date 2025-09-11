# Architecture Guidelines

## Hexagonal/Ports & Adapters Pattern

This project uses strict hexagonal architecture with clear separation between domain and infrastructure:

```
src/app/
├── _domain/           # Pure domain logic (no external dependencies)
│   ├── ports/         # Contracts between domain and infrastructure
│   │   ├── in/        # Use case interfaces (what domain offers)
│   │   └── out/       # Data source interfaces (what domain needs)
│   └── use-cases/     # Domain logic implementation
├── _infra/            # Cross-cutting infrastructure concerns
├── (adapters)/        # Infrastructure implementations
│   ├── (in)/          # Inbound adapters (API routes, UI)
│   └── (out)/         # Outbound adapters (databases, external APIs)
└── (public)/          # UI pages, components and assets
```

## Use Cases & Domain Logic

The domain layer implements the core use cases for the directional sentiment polling system. Each use case is a single function that encapsulates a specific piece of domain logic.

Key use cases include:

- **`getPollFeed`**: Retrieves a paginated feed of polls.
- **`getPersonalizedPollFeed`**: Retrieves a poll feed tailored to a user's interactions.
- **`getPollResults`**: Tallies votes and calculates results for a specific poll.
- **`getPollSummary`**: Fetches a pre-calculated summary for a poll, including vote counts and percentages.
- **`castVote`**: Validates and records a user's vote, ensuring idempotency.

Each use case is responsible for enforcing domain rules, such as pagination limits, poll status checks, and data validation. They interact with data sources through outbound ports to remain decoupled from infrastructure concerns.

## Port Contracts

All port interfaces are defined in the `_domain/ports/` directory. These contracts define the boundary between the domain layer and the infrastructure adapters.

### Inbound Ports (Use Case Interfaces)

Located in `src/app/_domain/ports/in/`, these define the interfaces for the use cases that the application provides. Each file corresponds to a specific use case's input and output contracts.

### Outbound Ports (Data Source Interfaces)

Located in `src/app/_domain/ports/out/`, these define the interfaces for the data sources that the domain logic needs to function (e.g., fetching polls, storing votes).

## Domain Layer Rules

- **NEVER import from adapters** - domain stays pure
- **Use cases** contain domain logic (e.g., pagination, validation, idempotency)
- **Ports** define minimal interfaces for what domain needs
- **DTOs** are vendor-agnostic domain objects
- **Error handling** uses semantic domain errors (not technical exceptions)

## Error Handling Strategy

**Domain Layer**: Uses semantic errors that represent business rule violations:

- `"not_found"` → Resource doesn't exist
- `"poll_closed"` → Business rule violation
- `"option_mismatch"` → Data validation failure

**Adapter Layer**: Maps domain errors to appropriate HTTP responses and handles infrastructure errors.

**Error Flow**: Use cases → domain errors → adapter mapping → HTTP responses

## Data Flow

**Request Processing**: API Route → Input Validation → Authentication → Use Case Execution → Response Formatting

**Dependency Injection**: Adapters are injected into use cases through port interfaces, keeping domain logic decoupled from infrastructure.

## Infrastructure

### Middleware

Composable middleware components handle cross-cutting concerns at the edge layer:

- **Composition Pattern**: Middleware chain with pass-through vs terminal response logic
- **Available Components**: Rate limiting, authentication, session management
- **Fail-Open Design**: Infrastructure failures don't break public functionality

### Authentication & Authorization

Authentication is implemented as a cross-cutting concern spanning multiple architectural layers:

#### Edge Layer (Middleware)

- Session management and token refresh
- Fail-open design for public resources
- Cookie state preservation

#### Adapter Layer (API Routes)

- Authentication enforcement for protected endpoints
- OAuth flow management (sign-in, callback, sign-out)
- Error mapping to HTTP responses

#### Domain Layer Integration

- User context injection into use cases
- Domain rules enforcement (voting requires authentication)
- No authentication logic in domain layer

## Architectural Patterns

### Vote Idempotency

Prevents duplicate votes through idempotency keys. See [`cast-vote.ts`](../src/app/_domain/use-cases/polls/cast-vote.ts) for implementation details.

### Real-time Vote Tallying

Results are calculated on-demand from vote history. See [`get-poll-results.ts`](../src/app/_domain/use-cases/polls/get-poll-results.ts) for implementation details.
