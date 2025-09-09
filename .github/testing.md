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
