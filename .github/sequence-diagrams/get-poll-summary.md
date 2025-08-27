# Get Poll Summary Sequence Diagram

This sequence diagram shows the data flow for the `GET /api/polls/:slug/summary` endpoint, which implements the poll summary use case.

```mermaid
sequenceDiagram
    participant Client
    participant Route as API Route<br/>/api/polls/[slug]/summary/route.ts
    participant Zod as Zod Validator<br/>ParamsSchema, QuerySchema
    participant SupabaseAdapter as Supabase Adapter<br/>createPollSummarySource
    participant UseCase as Use Case<br/>getPollSummary
    participant PollSummarySource as PollSummarySource<br/>Port Interface

    Client->>Route: GET /api/polls/poll-123/summary?quorum=100

    Note over Route: Input Validation
    Route->>Zod: validate slug and quorum
    Zod-->>Route: {slug: "poll-123", quorum: 100}

    Note over Route: Adapter Creation
    Route->>SupabaseAdapter: createPollSummarySource(client)
    SupabaseAdapter-->>Route: PollSummarySource implementation

    Note over Route: Domain Logic Execution
    Route->>UseCase: getPollSummary({pollSummary, input})

    Note over UseCase: Poll Summary Retrieval
    UseCase->>PollSummarySource: get({slug, quorum})

    PollSummarySource->>SupabaseAdapter: get({slug, quorum})
    Note over SupabaseAdapter: Calls 'get_poll_summaries' RPC
    SupabaseAdapter-->>PollSummarySource: PollSummary DTO | null

    alt Poll Not Found
        PollSummarySource-->>UseCase: null
        UseCase->>UseCase: throw new Error("not_found")
        UseCase-->>Route: Error: "not_found"
        Route-->>Client: 404 Not Found<br/>{error: "not_found"}
    else Poll Found
        PollSummarySource-->>UseCase: PollSummary DTO
        UseCase-->>Route: PollSummary DTO

        Note over Route: Response Formatting
        Route->>Route: console.info("🎉")
        Route-->>Client: 200 OK<br/>{...pollSummaryData}<br/>Cache-Control: no-store
    end

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

- **Zod Schemas**: Validates `slug` (required string) and optional `quorum` (number).
- **Error Handling**: Returns 400 with validation details on failure.

### 2. Adapter Selection

- **Production**: Uses Supabase database with a dedicated `PollSummarySource`.
- **Port Pattern**: Adapter implements the `PollSummarySource` interface.

### 3. Domain Logic (Use Case)

- **Data Fetching**: Directly calls the `get` method on the `PollSummarySource`.
- **Error Handling**: Throws a semantic "not_found" error if the summary is not returned.

### 4. Data Sources (Supabase Adapter)

- **Stored Procedure**: Calls the `get_poll_summaries` RPC in Supabase.
- **Parameters**: Passes `slug` and a default `quorum` to the stored procedure.
- **Error Mapping**: Supabase errors are mapped to domain errors.

### 5. Response Format

Returns the poll summary data directly from the use case. See `PollSummary` DTO for the complete response structure.

## Architectural Patterns

- **Hexagonal Architecture**: Clear separation between domain and infrastructure.
- **Port/Adapter Pattern**: `PollSummarySource` port with a Supabase implementation.
- **Dependency Injection**: Use case receives the adapter through dependency injection.
- **Database Logic**: Complex query logic is encapsulated in a database stored procedure (`RPC`).
- **Error Mapping**: Domain errors are mapped to appropriate HTTP status codes.
