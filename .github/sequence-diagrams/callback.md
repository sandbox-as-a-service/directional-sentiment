# Auth Callback Sequence Diagram

This sequence diagram shows the data flow for the `GET /api/auth/callback` endpoint. This route handles the callback from an OAuth provider after a user has successfully authenticated.

```mermaid
sequenceDiagram
    participant OAuthProvider as OAuth Provider (e.g., GitHub)
    participant Client
    participant Route as API Route<br/>/api/auth/callback/route.ts
    participant Zod as Zod Validator<br/>QuerySchema
    participant SupabaseClient as Supabase Server Client<br/>createSupabaseServerClient
    participant SupabaseAuth as Supabase Auth<br/>exchangeCodeForSession

    OAuthProvider->>Client: Redirect to /api/auth/callback?code=...&next=/

    Client->>Route: GET /api/auth/callback?code=...&next=/

    Note over Route: Input Validation
    Route->>Zod: validate query parameters
    Zod-->>Route: {code: "...", next: "/"}

    Note over Route: Supabase Client Creation
    Route->>SupabaseClient: createSupabaseServerClient()
    SupabaseClient-->>Route: supabase instance

    Note over Route: Exchange Code for Session
    Route->>SupabaseAuth: exchangeCodeForSession(code)
    SupabaseAuth-->>Route: {error}

    Note over Route: Determine Final Redirect
    Route->>Route: Check for x-forwarded-host header
    Route-->>Client: 307 Redirect to / (or original 'next' path)

    Note over Route,Client: Error Handling
    alt Validation Error
        Route-->>Client: 400 Bad Request<br/>{error: "bad_request"}
    else Supabase Auth Error
        Route-->>Client: Redirect to /error
    else Supabase Error
        Route-->>Client: 503 Service Unavailable<br/>{error: "service_unavailable"}
    else Unknown Error
        Route-->>Client: 500 Internal Server Error<br/>{error: "internal_server_error"}
    end
```

## Key Components

### 1. Input Validation

- **Zod Schema**: Validates the `code` (required) and `next` (optional) query parameters.
- **Error Handling**: Returns 400 on validation failure.

### 2. Code Exchange

- The route receives a one-time authorization `code` from the OAuth provider.
- It calls `exchangeCodeForSession` to trade this code for a valid user session with Supabase.

### 3. Session Creation

- On successful code exchange, Supabase Auth creates a session for the user and automatically handles setting the session cookie on the response.

### 4. Redirection

- The user is redirected back to the application, typically to the page they were trying to access before authentication began (the `next` path).
- The logic correctly handles `x-forwarded-host` headers to ensure proper redirection in production environments behind a load balancer.
