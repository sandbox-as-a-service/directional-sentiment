# Testing Guidelines

## Test Structure & Organization

### Feature-Based `__tests__` Folders

- **Use `__tests__` folders per feature**: Located within each use case directory (e.g., `src/app/_domain/use-cases/polls/__tests__/`)
- **Keeps domain folders clean**: DTOs, ports, use cases without test noise
- **Allows shared fakes/helpers**: Drop in same folder without leaking into prod code
- **Mirrors feature tree clearly**: `polls/` ↔ `polls/__tests__/`

## Test Structure & Conventions

### Scope & Structure

```typescript
// Top-level describe = unit under test (function name)
describe("getPollFeed", () => {
  // Nested describes = contexts/scenarios
  describe("without cursor", () => {
    it("returns 20 items and a nextCursor when more exist", async () => {
      // Test implementation
    })
  })

  describe("with cursor", () => {
    // Cursor-related tests
  })

  describe("limit handling", () => {
    // Boundary and validation tests
  })

  describe("edge cases", () => {
    // Empty datasets, error conditions
  })
})
```

### Test Naming Rules

- **Top-level describe**: Function name being tested (`getPollFeed`)
- **Nested describes**: Context or scenario (`"without cursor"`, `"limit handling"`)
- **Test titles**: Present tense, behavior-focused, no "should" prefix
- **Implementation details**: Keep in assertions/comments, not titles

### Typing Rules

- **No `any` types**: Use domain DTOs and port interfaces
- **Type mocks with Jest v30**: Use `jest.fn<FunctionType>()` for proper typing
- **Import domain types**: Use `PollFeedSource`, `PollFeedPageItem`, etc.
- **Import Jest globals**: Use `import {describe, expect, it, jest} from "@jest/globals"`

### Mocks & Test Doubles

- **Prefer in-memory fakes**: Small, deterministic implementations of port interfaces
- **Implement exact port surface**: Full interface, not partial mocks
- **Keep fakes typed**: Use domain types, avoid shortcuts

### Test Data & Fixtures

- **Use helper functions**: Create reusable, parameterized data builders
- **Keep fixtures realistic**: Match production data shapes and relationships
- **Make data deterministic**: Predictable timestamps, IDs, and ordering

#### Helper vs Inline Data Strategy

**Rule of thumb**: Choose based on whether the data is the point of the test or just scaffolding.

**Use inline data when** (≤3 items and each value matters):

- **Data is the assertion point**: Small, explicit data that tells the story at a glance
- **Values are meaningful**: Each item directly relates to what you're testing

```typescript
// ✅ Inline when data is the point - testing percentage calculation
const votes = makeVotesSource([
  {optionId: "o1", count: 2}, // Will be 66.7%
  {optionId: "o2", count: 1}, // Will be 33.3%
])
// Total = 3, percentages are obvious from the counts
```

**Use helpers when** (many items, repetitive shapes, or size matters more than values):

- **Shape is repetitive**: Consistent structure across many items
- **Size matters more than exact values**: Testing pagination, limits, ranges
- **Complex setup**: Timestamps, ordering, relationships

```typescript
// ✅ Helper when scaffolding pagination - 25 items with consistent spacing
const data = makeItems(25) // 1-minute apart, newest-first
const poll = makePollFeedSource(data)
// Focus is on pagination behavior, not specific item content
```

**Reused fixtures**: Use helpers (file-local or `__tests__/shared-helpers.ts`)

#### Helper Design Rules

- **Must be dumb and deterministic**: No randomness, no hidden side effects, no branching
- **Name by intent**: `makeItems`, `makePollsSource`, `makeVotesSource` (not "builder" or "factory")
- **Parameterized but simple**: Accept count/start values, maintain predictable output

### Edge Cases & Boundary Testing

- **Empty datasets**: Test with zero items
- **Boundary values**: Test limits, minimums, maximums
- **Invalid inputs**: Test validation and error handling
- **Off-by-one scenarios**: Test pagination boundaries

### Assertions & Verification

- **Check meaningful state**: Verify lengths, key IDs, critical business fields
- **Assert domain invariants**: Test policy numbers (defaults, limits) explicitly
- **Include implementation checks**: Verify adapter calls in assertions/comments

### Domain Invariants Testing

- **Treat domain defaults as authoritative**: Use cases enforce policy, not adapters
- **Test policy numbers explicitly**: Default page sizes, limits, clamps
- **Verify business rules**: Pagination logic, validation rules, idempotency

## Practical Testing Examples

### Complete Use Case Test Example

This example shows a comprehensive test for the `getPollResults` use case with realistic data and edge cases:

```typescript
// src/app/_domain/use-cases/polls/__tests__/get-poll-results.test.ts
import {describe, expect, it} from "@jest/globals"
import {createGetPollResults} from "../get-poll-results"
import {makePollsSource, makeVotesSource} from "./shared-helpers"

describe("getPollResults", () => {
  describe("with vote data", () => {
    it("calculates percentages correctly for multiple votes", async () => {
      // Realistic poll data
      const pollsSource = makePollsSource([
        {
          id: "poll-123",
          slug: "favorite-framework",
          question: "What's your favorite frontend framework?",
          options: [
            {id: "react", text: "React"},
            {id: "vue", text: "Vue.js"},
            {id: "angular", text: "Angular"},
            {id: "svelte", text: "Svelte"}
          ],
          status: "open",
          createdAt: "2024-01-01T00:00:00Z"
        }
      ])

      // Realistic vote distribution (latest vote per user)
      const votesSource = makeVotesSource([
        // React: 3 votes (50%)
        {pollId: "poll-123", userId: "user-1", optionId: "react", createdAt: "2024-01-01T10:00:00Z"},
        {pollId: "poll-123", userId: "user-2", optionId: "react", createdAt: "2024-01-01T11:00:00Z"},
        {pollId: "poll-123", userId: "user-3", optionId: "react", createdAt: "2024-01-01T12:00:00Z"},
        
        // Vue: 2 votes (33.3%)
        {pollId: "poll-123", userId: "user-4", optionId: "vue", createdAt: "2024-01-01T13:00:00Z"},
        {pollId: "poll-123", userId: "user-5", optionId: "vue", createdAt: "2024-01-01T14:00:00Z"},
        
        // Angular: 1 vote (16.7%)
        {pollId: "poll-123", userId: "user-6", optionId: "angular", createdAt: "2024-01-01T15:00:00Z"},
        
        // Svelte: 0 votes (0%)
        
        // User changed their mind (only latest vote counts)
        {pollId: "poll-123", userId: "user-1", optionId: "react", createdAt: "2024-01-01T09:00:00Z"}, // Older vote, ignored
      ])

      const getPollResults = createGetPollResults(pollsSource, votesSource)
      
      const result = await getPollResults({slug: "favorite-framework"})
      
      // Verify poll metadata
      expect(result.poll.id).toBe("poll-123")
      expect(result.poll.question).toBe("What's your favorite frontend framework?")
      expect(result.poll.status).toBe("open")
      
      // Verify vote tallies and percentages
      expect(result.totalVotes).toBe(6)
      expect(result.results).toEqual([
        {optionId: "react", optionText: "React", voteCount: 3, percentage: 50.0},
        {optionId: "vue", optionText: "Vue.js", voteCount: 2, percentage: 33.3},
        {optionId: "angular", optionText: "Angular", voteCount: 1, percentage: 16.7},
        {optionId: "svelte", optionText: "Svelte", voteCount: 0, percentage: 0.0},
      ])
    })

    it("handles vote changes with idempotency", async () => {
      const pollsSource = makePollsSource([
        {id: "poll-1", slug: "simple", options: [{id: "a"}, {id: "b"}]}
      ])

      const votesSource = makeVotesSource([
        // User initially voted for option A
        {pollId: "poll-1", userId: "user-1", optionId: "a", createdAt: "2024-01-01T10:00:00Z"},
        // Then changed to option B (later timestamp wins)
        {pollId: "poll-1", userId: "user-1", optionId: "b", createdAt: "2024-01-01T11:00:00Z"},
      ])

      const getPollResults = createGetPollResults(pollsSource, votesSource)
      const result = await getPollResults({slug: "simple"})

      // Only the latest vote should count
      expect(result.totalVotes).toBe(1)
      expect(result.results.find(r => r.optionId === "a")?.voteCount).toBe(0)
      expect(result.results.find(r => r.optionId === "b")?.voteCount).toBe(1)
    })
  })

  describe("edge cases", () => {
    it("handles poll with no votes", async () => {
      const pollsSource = makePollsSource([
        {id: "poll-1", slug: "empty", options: [{id: "yes"}, {id: "no"}]}
      ])
      const votesSource = makeVotesSource([]) // No votes

      const getPollResults = createGetPollResults(pollsSource, votesSource)
      const result = await getPollResults({slug: "empty"})

      expect(result.totalVotes).toBe(0)
      expect(result.results.every(r => r.voteCount === 0)).toBe(true)
      expect(result.results.every(r => r.percentage === 0)).toBe(true)
    })

    it("throws not_found for missing poll", async () => {
      const pollsSource = makePollsSource([])
      const votesSource = makeVotesSource([])
      const getPollResults = createGetPollResults(pollsSource, votesSource)

      await expect(getPollResults({slug: "nonexistent"}))
        .rejects.toThrow("not_found")
    })
  })

  describe("percentage calculation precision", () => {
    it("handles rounding edge cases", async () => {
      const pollsSource = makePollsSource([
        {id: "poll-1", slug: "thirds", options: [{id: "a"}, {id: "b"}, {id: "c"}]}
      ])

      // 3 votes that should create 33.3% each (rounding scenario)
      const votesSource = makeVotesSource([
        {pollId: "poll-1", userId: "user-1", optionId: "a"},
        {pollId: "poll-1", userId: "user-2", optionId: "b"},
        {pollId: "poll-1", userId: "user-3", optionId: "c"},
      ])

      const getPollResults = createGetPollResults(pollsSource, votesSource)
      const result = await getPollResults({slug: "thirds"})

      // Verify percentage precision
      const percentages = result.results.map(r => r.percentage)
      expect(percentages).toEqual([33.3, 33.3, 33.3])
      
      // Total should be close to 100% (accounting for rounding)
      const total = percentages.reduce((sum, p) => sum + p, 0)
      expect(total).toBeCloseTo(100, 1)
    })
  })
})
```

### Shared Test Helpers Example

Reusable test utilities that create deterministic data:

```typescript
// src/app/_domain/use-cases/polls/__tests__/shared-helpers.ts
import type {PollsSource} from "@/app/_domain/ports/out/polls-source"
import type {VotesSource} from "@/app/_domain/ports/out/votes-source"
import type {PollFeedSource} from "@/app/_domain/ports/out/poll-feed-source"

// Poll metadata helper
export function makePollsSource(polls: Array<Partial<Poll>>): PollsSource {
  const defaultPoll = {
    id: "default-id",
    slug: "default-slug",
    question: "Default question?",
    options: [{id: "default", text: "Default option"}],
    status: "open" as const,
    createdAt: "2024-01-01T00:00:00Z"
  }

  const fullPolls = polls.map(poll => ({...defaultPoll, ...poll}))

  return {
    async findBySlug(slug) {
      return fullPolls.find(p => p.slug === slug) || null
    }
  }
}

// Vote data helper
export function makeVotesSource(votes: Array<Partial<Vote>> = []): VotesSource {
  const defaultVote = {
    id: "default-vote-id",
    pollId: "default-poll-id",
    userId: "default-user-id",
    optionId: "default-option-id",
    createdAt: "2024-01-01T00:00:00Z"
  }

  const fullVotes = votes.map(vote => ({...defaultVote, ...vote}))

  return {
    async findLatestByUser(userId, pollId) {
      // Find latest vote for this user and poll
      return fullVotes
        .filter(v => v.userId === userId && v.pollId === pollId)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0] || null
    },

    async countByPoll(pollId) {
      // Group by option and count latest votes per user
      const latestVotes = new Map()
      
      fullVotes
        .filter(v => v.pollId === pollId)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
        .forEach(vote => {
          if (!latestVotes.has(vote.userId)) {
            latestVotes.set(vote.userId, vote)
          }
        })

      const counts = new Map()
      Array.from(latestVotes.values()).forEach(vote => {
        counts.set(vote.optionId, (counts.get(vote.optionId) || 0) + 1)
      })

      return Array.from(counts.entries()).map(([optionId, count]) => ({
        optionId,
        count
      }))
    },

    async create(vote) {
      fullVotes.push({...defaultVote, ...vote})
      return {...defaultVote, ...vote}
    }
  }
}

// Pagination helper for feed tests
export function makePollFeedSource(items: Array<Partial<PollFeedItem>>): PollFeedSource {
  const defaultItem = {
    id: "default-id",
    slug: "default-slug", 
    question: "Default question?",
    status: "open" as const,
    voteTotal: 0,
    voteLatestAt: "2024-01-01T00:00:00Z",
    createdAt: "2024-01-01T00:00:00Z"
  }

  const fullItems = items.map((item, index) => ({
    ...defaultItem,
    id: `item-${index + 1}`,
    slug: `item-${index + 1}`,
    createdAt: new Date(Date.parse("2024-01-01T00:00:00Z") + index * 60000).toISOString(),
    ...item
  }))

  return {
    async getPaginated({cursor, limit = 20}) {
      // Sort by createdAt descending (newest first)
      const sorted = fullItems.sort((a, b) => 
        b.createdAt.localeCompare(a.createdAt)
      )

      let startIndex = 0
      if (cursor) {
        startIndex = sorted.findIndex(item => item.id === cursor) + 1
      }

      const page = sorted.slice(startIndex, startIndex + limit)
      const hasMore = startIndex + limit < sorted.length
      const nextCursor = hasMore ? page[page.length - 1]?.id : null

      return {
        items: page,
        nextCursor
      }
    }
  }
}

// Deterministic data builders
export function makeItems(count: number, startDate = "2024-01-01T00:00:00Z"): Array<PollFeedItem> {
  const baseTime = Date.parse(startDate)
  
  return Array.from({length: count}, (_, i) => ({
    id: `item-${i + 1}`,
    slug: `poll-${i + 1}`,
    question: `Poll question ${i + 1}?`,
    status: "open" as const,
    voteTotal: i * 2, // Predictable vote counts
    voteLatestAt: new Date(baseTime + i * 60000).toISOString(), // 1 minute apart
    createdAt: new Date(baseTime + i * 60000).toISOString()
  }))
}
```

### Integration Test Pattern

Testing API routes with realistic request/response cycles:

```typescript
// src/app/(adapters)/(in)/api/polls/__tests__/votes-route.test.ts
import {describe, expect, it, jest} from "@jest/globals"
import {NextRequest} from "next/server"
import {POST} from "../[slug]/votes/route"

// Mock the domain layer
const mockCastVote = jest.fn()
jest.mock("@/app/_domain/use-cases/polls/cast-vote", () => ({
  createCastVote: () => mockCastVote
}))

describe("POST /api/polls/[slug]/votes", () => {
  describe("valid request", () => {
    it("creates vote and returns 201", async () => {
      // Setup mock response
      mockCastVote.mockResolvedValue({
        id: "vote-123",
        optionId: "red",
        userId: "user-456",
        createdAt: "2024-01-01T12:00:00Z"
      })

      // Create realistic request
      const request = new NextRequest("http://localhost:3000/api/polls/color-poll/votes", {
        method: "POST",
        headers: {"content-type": "application/json"},
        body: JSON.stringify({optionId: "red"})
      })

      const context = {
        params: Promise.resolve({slug: "color-poll"})
      }

      // Call the route handler
      const response = await POST(request, context)
      
      // Verify response
      expect(response.status).toBe(201)
      
      const body = await response.json()
      expect(body).toEqual({
        id: "vote-123",
        optionId: "red",
        userId: "user-456", 
        createdAt: "2024-01-01T12:00:00Z"
      })

      // Verify domain use case was called correctly
      expect(mockCastVote).toHaveBeenCalledWith({
        slug: "color-poll",
        optionId: "red",
        userId: expect.any(String) // From auth
      })
    })
  })

  describe("domain errors", () => {
    it("maps not_found to 404", async () => {
      mockCastVote.mockRejectedValue(new Error("not_found"))

      const request = new NextRequest("http://localhost:3000/api/polls/missing/votes", {
        method: "POST",
        body: JSON.stringify({optionId: "red"})
      })

      const response = await POST(request, {params: Promise.resolve({slug: "missing"})})

      expect(response.status).toBe(404)
      expect(await response.json()).toEqual({message: "not_found"})
    })

    it("maps poll_closed to 409", async () => {
      mockCastVote.mockRejectedValue(new Error("poll_closed"))

      const request = new NextRequest("http://localhost:3000/api/polls/closed-poll/votes", {
        method: "POST",
        body: JSON.stringify({optionId: "red"})
      })

      const response = await POST(request, {params: Promise.resolve({slug: "closed-poll"})})

      expect(response.status).toBe(409)
      expect(await response.json()).toEqual({message: "poll_closed"})
    })
  })

  describe("validation errors", () => {
    it("rejects missing optionId", async () => {
      const request = new NextRequest("http://localhost:3000/api/polls/test/votes", {
        method: "POST",
        body: JSON.stringify({}) // Missing optionId
      })

      const response = await POST(request, {params: Promise.resolve({slug: "test"})})

      expect(response.status).toBe(400)
      expect(await response.json()).toMatchObject({
        message: expect.stringContaining("validation")
      })
    })
  })
})
```

## API Testing with REST Client

API testing is handled manually inside the VS Code editor with the REST Client extension. All REST endpoint definitions are located in the `rest-client/` directory.

### REST Client Examples

```http
# rest-client/polls-comprehensive.http
@baseUrl = http://localhost:3000
@pollSlug = favorite-framework

### Get poll feed (pagination test)
GET {{baseUrl}}/api/polls/feed

### Get poll feed with cursor
GET {{baseUrl}}/api/polls/feed?cursor=poll-123&limit=5

### Get poll results  
GET {{baseUrl}}/api/polls/{{pollSlug}}/results

### Cast a vote
POST {{baseUrl}}/api/polls/{{pollSlug}}/votes
Content-Type: application/json

{
  "optionId": "react"
}

### Try to vote again (idempotency test)
POST {{baseUrl}}/api/polls/{{pollSlug}}/votes
Content-Type: application/json

{
  "optionId": "vue"
}

### Vote on closed poll (error test)
POST {{baseUrl}}/api/polls/closed-poll/votes
Content-Type: application/json

{
  "optionId": "any"
}

### Get nonexistent poll (404 test)
GET {{baseUrl}}/api/polls/does-not-exist/results
```

### Test Scenarios Checklist

When testing new features, verify these scenarios:

#### Use Case Testing
- [ ] Happy path with valid data
- [ ] Edge cases (empty data, boundaries)
- [ ] Domain error conditions
- [ ] Input validation failures
- [ ] Idempotency where applicable

#### API Route Testing  
- [ ] Valid requests return expected data
- [ ] Domain errors map to correct HTTP status codes
- [ ] Validation errors return 400 with details
- [ ] Authentication works correctly
- [ ] Content-Type headers handled properly

#### Integration Testing
- [ ] End-to-end API calls work via REST Client
- [ ] Database state changes as expected
- [ ] Error responses match API documentation
- [ ] Performance within acceptable limits

For more testing patterns and examples, see the actual test files in the `__tests__/` directories throughout the codebase.
