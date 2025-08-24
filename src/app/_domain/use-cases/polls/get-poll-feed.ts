import type {GetPollFeedInput, GetPollFeedResult} from "@/app/_domain/ports/in/get-poll-feed"
import type {PollFeedSource} from "@/app/_domain/ports/out/poll-feed-source"

/**
 * getPollFeed
 *
 * Domain use case: keyset-paginate the poll feed with a hard cap.
 * - Enforces a max page size.
 * - Uses the "fetch N+1" trick to learn if there’s another page.
 * - Emits a `nextCursor` (createdAt of the last returned item) when more pages exist.
 *
 * Assumptions (contract of PollFeedSource.page):
 * - Results come sorted by createdAt DESC (newest first) or a stable order compatible with `cursor`.
 * - `cursor` is an ISO datetime (TZ-aware) that the adapter knows how to use for keyset pagination.
 *
 * Extended:
 * - The feed source now returns **card-ready** items by calling the DB RPC.
 * - We pass `quorum` through so the adapter/RPC can mark "Warming up".
 */
export async function getPollFeed(args: {
  poll: PollFeedSource
  input: GetPollFeedInput
}): Promise<GetPollFeedResult> {
  const {poll, input} = args

  // Configurable defaults with a hard upper bound.
  // Single source of truth. You’ll likely have multiple edges (HTTP, SDK, CLI, cron).
  // If “default page size = 20” lives only in the HTTP Zod schema, the others drift.
  // Max page size, minimums, and fallback defaults affect semantics and perf; they should be enforced where the use case runs.
  // Zod defaults are great for DX and nicer request shapes, but they’re presentation-level conveniences.
  const DEFAULT_LIMIT = 20
  const MAX_LIMIT = 50
  const DEFAULT_QUORUM = 30

  // Clamp the requested limit into [1, MAX_LIMIT], with a default.
  const requested = input.limit ?? DEFAULT_LIMIT
  const limit = Math.min(Math.max(requested, 1), MAX_LIMIT)

  // Quorum controls when the UI shows the "Warming up" state (total < quorum).
  const quorum = input.quorum ?? DEFAULT_QUORUM

  // Fetch one extra record (N+1). If it exists, we know there’s another page.
  const cursor = input.cursor
  const cards = await poll.page({limit: limit + 1, cursor, quorum})

  const hasMore = cards.length > limit

  // Return only the requested amount; keep the extra record private.
  const items = hasMore ? cards.slice(0, limit) : cards

  // If there’s more, the next cursor is the createdAt of the last item we returned.
  // Card rows include createdAt (from poll.created_at), so this stays the same.
  const nextCursor = hasMore ? items[items.length - 1]!.createdAt : undefined

  return {items, nextCursor}
}
