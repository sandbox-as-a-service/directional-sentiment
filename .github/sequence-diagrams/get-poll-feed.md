# Get Poll Feed Sequence Diagram

This sequence diagram shows the data flow for the `GET /api/polls` endpoint, which implements the poll feed use case with pagination support.

```mermaid
sequenceDiagram
    participant Client
    participant Route as API Route<br/>/api/polls/route.ts
    participant Zod as Zod Validator<br/>QuerySchema
    participant SupabaseAdapter as Supabase Adapter<br/>createSupabasePollFeedSource
    participant UseCase as Use Case<br/>getPollFeed
    participant PollFeedSource as PollFeedSource<br/>Port Interface

    Client->>Route: GET /api/polls?limit=20&cursor=2025-01-15T10:00:00Z

    Note over Route: Input Validation
    Route->>Zod: validate query parameters
    Zod-->>Route: {limit: 20, cursor: "2025-01-15T10:00:00Z"}

    Note over Route: Adapter Creation
    Note over Route: In development: USE_MEMORY=1 enables in-memory fixtures<br/>In production: Uses Supabase database
    Route->>SupabaseAdapter: createSupabasePollFeedSource(client)
    SupabaseAdapter-->>Route: PollFeedSource implementation

    Note over Route: Domain Logic Execution
    Route->>UseCase: getPollFeed({poll, input})

    Note over UseCase: Pagination Logic
    UseCase->>UseCase: limit = Math.min(input.limit ?? 20, 50)
    UseCase->>PollFeedSource: page({limit: limit + 1, cursor})    PollFeedSource->>SupabaseAdapter: page({limit: 21, cursor})
    Note over SupabaseAdapter: SELECT id, created_at<br/>FROM polls<br/>WHERE created_at < cursor<br/>ORDER BY created_at DESC<br/>LIMIT 21
    SupabaseAdapter-->>PollFeedSource: Array<PollFeedItem>

    PollFeedSource-->>UseCase: rows (21 items max)

    Note over UseCase: Cursor Calculation
    UseCase->>UseCase: hasMore = rows.length > limit
    UseCase->>UseCase: slice = hasMore ? rows.slice(0, limit) : rows
    UseCase->>UseCase: nextCursor = hasMore ? slice[last].createdAt : undefined

    UseCase-->>Route: {items: PollFeedItem[], nextCursor?: string}

    Note over Route: Response Formatting
    Route->>Route: console.info("🎉")
    Route-->>Client: 200 OK<br/>{items, nextCursor}<br/>Cache-Control: no-store

    Note over Route,Client: Error Handling
    alt Validation Error
        Route-->>Client: 400 Bad Request<br/>{error: "bad_request", message}
    else Supabase Error
        Route-->>Client: 503 Service Unavailable<br/>{error: "service_unavailable"}
    else Unknown Error
        Route-->>Client: 500 Internal Server Error<br/>{error: "internal_server_error"}
    end
```

## Key Components

### 1. Input Validation

- **Zod Schema**: Validates `limit` (1-50, default 20) and optional ISO `cursor`
- **Error Handling**: Returns 400 with validation details on failure

### 2. Adapter Selection

- **Development Mode**: `USE_MEMORY=1` switches to in-memory fixtures for testing
- **Production**: Uses Supabase database with real-time data
- **Port Pattern**: Both adapters implement `PollFeedSource` interface

### 3. Domain Logic (Use Case)

- **Limit Enforcement**: Caps at 50 items maximum
- **Pagination**: Requests `limit + 1` to detect if more pages exist
- **Cursor Generation**: Uses last item's `createdAt` as next page cursor

### 4. Data Source (Supabase Adapter)

- **SQL Query**: `ORDER BY created_at DESC` for newest-first ordering
- **Keyset Pagination**: `WHERE created_at < cursor` prevents duplicates
- **Error Mapping**: Supabase errors → domain errors

### 5. Response Format

```json
{
  "items": [
    {
      "pollId": "poll-123",
      "createdAt": "2025-01-15T10:00:00Z"
    }
  ],
  "nextCursor": "2025-01-14T15:30:00Z"
}
```

## Architectural Patterns

- **Hexagonal Architecture**: Clear separation between domain and infrastructure
- **Port/Adapter Pattern**: `PollFeedSource` port with multiple implementations
- **Dependency Injection**: Use case receives adapter through dependency injection
- **Error Mapping**: Domain errors mapped to appropriate HTTP status codes
- **Environment Switching**: Seamless testing/production mode switching
