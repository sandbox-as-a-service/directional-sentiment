# Sign In Sequence Diagram

This sequence diagram shows the data flow for the `GET /api/auth/sign-in` endpoint, which initiates the OAuth sign-in flow with a provider like GitHub.

```mermaid
sequenceDiagram
    participant Client
    participant Route as API Route<br/>/api/auth/sign-in/route.ts
    participant Zod as Zod Validator<br/>QuerySchema
    participant SupabaseClient as Supabase Server Client<br/>createSupabaseServerClient
    participant SupabaseAuth as Supabase Auth<br/>signInWithOAuth

    Client->>Route: GET /api/auth/sign-in?provider=github

    Note over Route: Input Validation
    Route->>Zod: validate query parameters
    Zod-->>Route: {provider: "github"}

    Note over Route: Supabase Client Creation
    Route->>SupabaseClient: createSupabaseServerClient()
    SupabaseClient-->>Route: supabase instance

    Note over Route: OAuth Sign-In
    Route->>SupabaseAuth: signInWithOAuth({provider, options})
    SupabaseAuth-->>Route: {data, error}

    Note over Route: Redirection
    Route-->>Client: 307 Redirect to data.url (GitHub OAuth)

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

- **Zod Schema**: Validates the `provider` query parameter. Defaults to "github".
- **Error Handling**: Returns 400 on validation failure.

### 2. Supabase Client

- A server-side Supabase client is created for the request.

### 3. OAuth Flow Initiation

- **`signInWithOAuth`**: The route calls Supabase Auth to get a provider-specific OAuth URL.
- **`redirectTo`**: It specifies a callback URL (`/api/auth/callback`) for Supabase to redirect to after the user authenticates with the provider.

### 4. Redirection

- **Success**: The client's browser is redirected to the OAuth provider's authentication page.
- **Error**: If Supabase returns an error during the `signInWithOAuth` call, the user is redirected to a generic error page.
