# Get Poll Results Sequence Diagram

This sequence diagram shows the data flow for the `GET /api/polls/:slug/results` endpoint, which implements the poll results use case with vote tallying.

```mermaid
sequenceDiagram
    participant Client
    participant Route as API Route<br/>/api/polls/[slug]/results/route.ts
    participant Zod as Zod Validator<br/>ParamsSchema
    participant SupabasePollsAdapter as Supabase Polls Adapter<br/>createSupabasePollsSource
    participant SupabaseVotesAdapter as Supabase Votes Adapter<br/>createSupabaseVotesSource
    participant UseCase as Use Case<br/>getPollResults
    participant PollsSource as PollsSource<br/>Port Interface
    participant VotesSource as VotesSource<br/>Port Interface

    Client->>Route: GET /api/polls/poll-123/results

    Note over Route: Input Validation
    Route->>Zod: validate slug parameter
    Zod-->>Route: {slug: "poll-123"}

    Note over Route: Adapter Creation
    Note over Route: In development: USE_MEMORY=1 uses shared singleton for state consistency<br/>In production: Uses Supabase database
    Route->>SupabasePollsAdapter: createSupabasePollsSource(client)
    Route->>SupabaseVotesAdapter: createSupabaseVotesSource(client)
    SupabasePollsAdapter-->>Route: PollsSource implementation
    SupabaseVotesAdapter-->>Route: VotesSource implementation

    Note over Route: Domain Logic Execution
    Route->>UseCase: getPollResults({polls, votes, slug})

    Note over UseCase: Poll Resolution
    UseCase->>PollsSource: findBySlug("poll-123")

    PollsSource->>SupabasePollsAdapter: findBySlug("poll-123")
    Note over SupabasePollsAdapter: SELECT id, status<br/>FROM poll<br/>WHERE slug = 'poll-123'<br/>LIMIT 1
    SupabasePollsAdapter-->>PollsSource: {pollId, status} | null

    PollsSource-->>UseCase: pollSummary

    alt Poll Not Found
        UseCase->>UseCase: throw new Error("not_found")
        UseCase-->>Route: Error: "not_found"
        Route-->>Client: 404 Not Found<br/>{error: "not_found"}
    else Poll Found
        Note over UseCase: Vote Tallying
        UseCase->>VotesSource: tallyCurrent(pollId)

        VotesSource->>SupabaseVotesAdapter: tallyCurrent(pollId)
        Note over SupabaseVotesAdapter: SELECT id, userId, optionId, votedAt<br/>FROM vote<br/>WHERE pollId = pollId<br/>ORDER BY votedAt DESC, id DESC
        Note over SupabaseVotesAdapter: Client-side reduction:<br/>latest vote per user
        SupabaseVotesAdapter-->>VotesSource: Array<{optionId, count}>

        VotesSource-->>UseCase: tallies

        Note over UseCase: Results Calculation
        UseCase->>UseCase: totalCurrentVotes = sum(tallies.count)
        UseCase->>UseCase: calculate percentages with 1 decimal precision
        UseCase->>UseCase: format response with status & timestamp

        UseCase-->>Route: {items, total, status, updatedAt}

        Note over Route: Response Formatting
        Route->>Route: console.info("🎉")
        Route-->>Client: 200 OK<br/>{items, total, status, updatedAt}<br/>Cache-Control: no-store
    end

    Note over Route,Client: Error Handling
    alt Validation Error
        Route-->>Client: 400 Bad Request<br/>{error: "bad_request", message}
    else Poll Not Found
        Route-->>Client: 404 Not Found<br/>{error: "not_found"}
    else Supabase Error
        Route-->>Client: 503 Service Unavailable<br/>{error: "service_unavailable"}
    else Unknown Error
        Route-->>Client: 500 Internal Server Error<br/>{error: "internal_server_error"}
    end
```

## Key Components

### 1. Input Validation

- **Zod Schema**: Validates `slug` parameter as non-empty string
- **Error Handling**: Returns 400 with validation details on failure

### 2. Adapter Selection

- **Development Mode**: `USE_MEMORY=1` uses shared singleton for state consistency
- **Production**: Creates separate Supabase adapters for polls and votes
- **Port Pattern**: Both implementations provide `PollsSource` and `VotesSource` interfaces

### 3. Domain Logic (Use Case)

#### Poll Resolution

- **Poll Lookup**: Finds poll by slug to get `pollId` and `status`
- **Not Found Handling**: Throws semantic "not_found" error if poll doesn't exist

#### Vote Tallying

- **Latest Vote Logic**: For each user, only their most recent vote counts
- **Percentage Calculation**: Computed to 1 decimal place with divide-by-zero protection
- **Real-time Results**: Always calculated fresh from current vote state

### 4. Data Sources (Supabase Adapters)

- **Polls Adapter**: Handles poll metadata queries (`poll` table)
- **Votes Adapter**: Handles vote queries and tallying (`vote` table)
- **Client-side Reduction**: Fetches all votes for poll, reduces latest per user
- **SQL Ordering**: `ORDER BY votedAt DESC, id DESC` for consistent results

### 5. Response Format

```json
{
  "items": [
    {
      "optionId": "option-a",
      "count": 15,
      "pct": 62.5
    },
    {
      "optionId": "option-b",
      "count": 9,
      "pct": 37.5
    }
  ],
  "total": 24,
  "status": "open",
  "updatedAt": "2025-08-23T10:30:00.000Z"
}
```

## Architectural Patterns

- **Hexagonal Architecture**: Clear separation between domain and infrastructure
- **Multiple Port Pattern**: Uses both `PollsSource` and `VotesSource` ports
- **Dependency Injection**: Use case receives both adapters through dependency injection
- **Error Mapping**: Domain errors mapped to appropriate HTTP status codes
- **State Consistency**: Memory source singleton ensures votes persist across routes
- **Real-time Calculation**: Results computed on-demand from current vote state
