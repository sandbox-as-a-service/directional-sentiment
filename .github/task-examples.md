# Task Examples - Common Development Patterns

This guide provides step-by-step instructions for common development tasks in the Directional Sentiment project.

## Adding a New Use Case

### Example: Adding a "Get Poll Summary" Feature

**Goal**: Create a use case that returns basic poll metadata without vote counts.

#### Step 1: Define the Port Interface

```typescript
// src/app/_domain/ports/in/get-poll-summary.ts
export interface GetPollSummaryInput {
  slug: string
}

export interface GetPollSummaryOutput {
  id: string
  slug: string
  question: string
  options: Array<{id: string; text: string}>
  status: "draft" | "open" | "closed"
  createdAt: string
}

export type GetPollSummary = (input: GetPollSummaryInput) => Promise<GetPollSummaryOutput>
```

#### Step 2: Implement the Use Case

```typescript
// src/app/_domain/use-cases/polls/get-poll-summary.ts
import type {GetPollSummary} from "@/app/_domain/ports/in/get-poll-summary"
import type {PollsSource} from "@/app/_domain/ports/out/polls-source"

/**
 * Domain use case: retrieve basic poll metadata without vote tallies
 * 
 * @param pollsSource - Source for poll metadata lookup
 * @param input - Poll slug to lookup
 * @returns Poll summary or throws domain error
 * 
 * Domain errors:
 * - "not_found" → poll slug doesn't exist
 */
export function createGetPollSummary(pollsSource: PollsSource): GetPollSummary {
  return async (input) => {
    const poll = await pollsSource.findBySlug(input.slug)
    
    if (!poll) {
      throw new Error("not_found")
    }

    return {
      id: poll.id,
      slug: poll.slug,
      question: poll.question,
      options: poll.options,
      status: poll.status,
      createdAt: poll.createdAt,
    }
  }
}
```

#### Step 3: Write Unit Tests

```typescript
// src/app/_domain/use-cases/polls/__tests__/get-poll-summary.test.ts
import {describe, expect, it} from "@jest/globals"
import {createGetPollSummary} from "../get-poll-summary"
import {makePollsSource} from "./shared-helpers"

describe("getPollSummary", () => {
  describe("with valid slug", () => {
    it("returns poll summary without vote data", async () => {
      const pollsSource = makePollsSource([
        {
          id: "poll-1",
          slug: "favorite-color",
          question: "What's your favorite color?",
          options: [{id: "red", text: "Red"}, {id: "blue", text: "Blue"}],
          status: "open",
          createdAt: "2024-01-01T00:00:00Z",
        }
      ])
      
      const getPollSummary = createGetPollSummary(pollsSource)
      
      const result = await getPollSummary({slug: "favorite-color"})
      
      expect(result).toEqual({
        id: "poll-1",
        slug: "favorite-color", 
        question: "What's your favorite color?",
        options: [{id: "red", text: "Red"}, {id: "blue", text: "Blue"}],
        status: "open",
        createdAt: "2024-01-01T00:00:00Z",
      })
    })
  })

  describe("with invalid slug", () => {
    it("throws not_found error", async () => {
      const pollsSource = makePollsSource([])
      const getPollSummary = createGetPollSummary(pollsSource)
      
      await expect(getPollSummary({slug: "nonexistent"}))
        .rejects.toThrow("not_found")
    })
  })
})
```

#### Step 4: Create API Route

```typescript
// src/app/(adapters)/(in)/api/polls/[slug]/summary/route.ts
import {NextRequest, NextResponse} from "next/server"
import {z} from "zod"
import {createGetPollSummary} from "@/app/_domain/use-cases/polls/get-poll-summary"
import {createPollsSource} from "@/app/(adapters)/(out)/supabase/create-polls-source"

const ParamsSchema = z.object({
  slug: z.string().min(1),
})

export async function GET(
  request: NextRequest,
  context: {params: Promise<unknown>}
) {
  try {
    const params = ParamsSchema.parse(await context.params)
    
    const pollsSource = createPollsSource()
    const getPollSummary = createGetPollSummary(pollsSource)
    
    const result = await getPollSummary({slug: params.slug})
    
    return NextResponse.json(result)
  } catch (error) {
    const message = error instanceof Error ? error.message : "unknown_error"
    
    if (message === "not_found") {
      return NextResponse.json({message}, {status: 404})
    }
    
    return NextResponse.json({message: "internal_error"}, {status: 500})
  }
}
```

#### Step 5: Test the API

```http
# rest-client/polls-summary.http
GET http://localhost:3000/api/polls/favorite-color/summary
```

**Related Files**: See [sequence-diagrams/get-poll-summary.md](./sequence-diagrams/get-poll-summary.md) for complete data flow.

---

## Adding a Data Source

### Example: Adding a New Database Adapter

**Goal**: Create a Redis cache adapter for poll data.

#### Step 1: Identify the Port Interface

Use existing port: `src/app/_domain/ports/out/polls-source.ts`

#### Step 2: Implement the Adapter

```typescript
// src/app/(adapters)/(out)/redis/create-polls-source.ts
import Redis from "ioredis"
import type {PollsSource} from "@/app/_domain/ports/out/polls-source"

export function createPollsSource(): PollsSource {
  const redis = new Redis(process.env.REDIS_URL)
  
  return {
    async findBySlug(slug: string) {
      const cached = await redis.get(`poll:${slug}`)
      
      if (cached) {
        return JSON.parse(cached)
      }
      
      // Fallback to database or return null
      return null
    }
  }
}
```

#### Step 3: Update Environment

```bash
# .env.local
REDIS_URL=redis://localhost:6379
```

#### Step 4: Wire Up in Route

```typescript
// In your API route, replace:
import {createPollsSource} from "@/app/(adapters)/(out)/supabase/create-polls-source"

// With:
import {createPollsSource} from "@/app/(adapters)/(out)/redis/create-polls-source"
```

---

## Writing Unit Tests

### Example: Testing a Use Case with Multiple Dependencies

**Goal**: Test vote casting with poll validation and idempotency.

#### Step 1: Create Test Helpers

```typescript
// src/app/_domain/use-cases/polls/__tests__/shared-helpers.ts
import type {PollsSource} from "@/app/_domain/ports/out/polls-source"
import type {VotesSource} from "@/app/_domain/ports/out/votes-source"

export function makePollsSource(polls: Array<{id: string; slug: string; status: string; options: Array<{id: string}>}>): PollsSource {
  return {
    async findBySlug(slug) {
      return polls.find(p => p.slug === slug) || null
    }
  }
}

export function makeVotesSource(existingVotes: Array<{userId: string; optionId: string}> = []): VotesSource {
  const votes = [...existingVotes]
  
  return {
    async findLatestByUser(userId, pollId) {
      return votes.find(v => v.userId === userId) || null
    },
    
    async create(vote) {
      votes.push(vote)
      return vote
    }
  }
}
```

#### Step 2: Test Happy Path and Edge Cases

```typescript
// src/app/_domain/use-cases/polls/__tests__/cast-vote.test.ts
import {describe, expect, it} from "@jest/globals"
import {createCastVote} from "../cast-vote"
import {makePollsSource, makeVotesSource} from "./shared-helpers"

describe("castVote", () => {
  describe("valid vote", () => {
    it("creates new vote for first-time voter", async () => {
      const pollsSource = makePollsSource([
        {id: "poll-1", slug: "test", status: "open", options: [{id: "opt-1"}]}
      ])
      const votesSource = makeVotesSource([])
      
      const castVote = createCastVote(pollsSource, votesSource)
      
      const result = await castVote({
        slug: "test",
        optionId: "opt-1", 
        userId: "user-1"
      })
      
      expect(result.optionId).toBe("opt-1")
      expect(result.userId).toBe("user-1")
    })
  })

  describe("poll validation", () => {
    it("throws not_found for nonexistent poll", async () => {
      const pollsSource = makePollsSource([])
      const votesSource = makeVotesSource([])
      const castVote = createCastVote(pollsSource, votesSource)
      
      await expect(castVote({slug: "missing", optionId: "opt-1", userId: "user-1"}))
        .rejects.toThrow("not_found")
    })
    
    it("throws poll_closed for closed poll", async () => {
      const pollsSource = makePollsSource([
        {id: "poll-1", slug: "test", status: "closed", options: [{id: "opt-1"}]}
      ])
      const votesSource = makeVotesSource([])
      const castVote = createCastVote(pollsSource, votesSource)
      
      await expect(castVote({slug: "test", optionId: "opt-1", userId: "user-1"}))
        .rejects.toThrow("poll_closed")
    })
  })

  describe("idempotency", () => {
    it("returns existing vote without creating duplicate", async () => {
      const pollsSource = makePollsSource([
        {id: "poll-1", slug: "test", status: "open", options: [{id: "opt-1"}]}
      ])
      const votesSource = makeVotesSource([
        {userId: "user-1", optionId: "opt-1"}
      ])
      
      const castVote = createCastVote(pollsSource, votesSource)
      
      const result = await castVote({
        slug: "test",
        optionId: "opt-1",
        userId: "user-1"
      })
      
      expect(result.optionId).toBe("opt-1")
      // Verify no duplicate was created by checking votes count
    })
  })
})
```

---

## API Endpoint Development

### Example: Creating a New REST Endpoint

**Goal**: Add PATCH endpoint to update poll status.

#### Step 1: Create Use Case (if needed)

Follow "Adding a New Use Case" pattern above.

#### Step 2: Create Route File

```typescript
// src/app/(adapters)/(in)/api/polls/[slug]/status/route.ts
import {NextRequest, NextResponse} from "next/server"
import {z} from "zod"
import {createUpdatePollStatus} from "@/app/_domain/use-cases/polls/update-poll-status"
import {createPollsSource} from "@/app/(adapters)/(out)/supabase/create-polls-source"

const ParamsSchema = z.object({
  slug: z.string().min(1),
})

const BodySchema = z.object({
  status: z.enum(["draft", "open", "closed"]),
})

export async function PATCH(
  request: NextRequest,
  context: {params: Promise<unknown>}
) {
  try {
    const params = ParamsSchema.parse(await context.params)
    const body = BodySchema.parse(await request.json())
    
    const pollsSource = createPollsSource()
    const updatePollStatus = createUpdatePollStatus(pollsSource)
    
    const result = await updatePollStatus({
      slug: params.slug,
      status: body.status
    })
    
    return NextResponse.json(result)
  } catch (error) {
    // Handle domain errors → HTTP status codes
    const message = error instanceof Error ? error.message : "unknown_error"
    
    if (message === "not_found") {
      return NextResponse.json({message}, {status: 404})
    }
    
    if (message === "invalid_transition") {
      return NextResponse.json({message}, {status: 422})
    }
    
    return NextResponse.json({message: "internal_error"}, {status: 500})
  }
}
```

#### Step 3: Test with REST Client

```http
# rest-client/polls-status.http
PATCH http://localhost:3000/api/polls/favorite-color/status
Content-Type: application/json

{
  "status": "closed"
}
```

#### Step 4: Add to Sequence Diagram

Create `sequence-diagrams/update-poll-status.md` documenting the flow.

---

## Best Practices

### Domain Layer Rules
- **Never import from adapters** in domain code
- **Use semantic error messages** (`"not_found"`, `"poll_closed"`)
- **Keep use cases pure** - no side effects except through ports
- **Document domain logic** in use case function comments

### Testing Patterns
- **Use `__tests__` folders** per feature
- **Create reusable helpers** for test data
- **Test domain errors** with `rejects.toThrow()`
- **Mock at port boundaries** not implementation details

### Architecture Guidelines
- **Follow hexagonal pattern** - domain → ports → adapters
- **Use dependency injection** in use case creation
- **Map domain errors** to HTTP status codes in adapters
- **Keep adapters thin** - business logic belongs in domain

For more detailed patterns, see:
- [Architecture Guidelines](./architecture.md)
- [Testing Guidelines](./testing.md) 
- [Code Conventions](./conventions.md)