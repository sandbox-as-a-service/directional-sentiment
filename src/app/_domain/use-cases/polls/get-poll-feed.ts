import type {GetPollFeedInput, GetPollFeedResult} from "@/app/_domain/ports/in/get-poll-feed"
import type {PollFeedSource} from "@/app/_domain/ports/out/poll-feed-source"

import type {PollStatus} from "./dto/poll"

/**
 * getPollFeed
 *
 * Domain use case: keyset-paginate the poll feed with a hard cap.
 * - Enforces a max page size.
 * - Enforces a minimum quorum.
 * - Uses the "fetch N+1" trick to learn if there’s another page.
 * - Emits a `nextCursor` (createdAt of the last returned item) when more pages exist.
 * - The feed source returns **card-ready** items by calling the DB RPC.
 * - We pass `quorum` through so the adapter/RPC can mark "Warming up".
 *
 * Assumptions (contract of PollFeedSource.page):
 * - Results come sorted by createdAt DESC (newest first) or a stable order compatible with `cursor`.
 * - `cursor` is an ISO datetime (TZ-aware) that the adapter knows how to use for keyset pagination.
 */
export async function getPollFeed(args: {
  pollFeed: PollFeedSource
  input: GetPollFeedInput
}): Promise<GetPollFeedResult> {
  const {pollFeed, input} = args
  const {cursor, limit, quorum} = input

  // Configurable defaults with a hard upper bound.
  // Single source of truth. I’ll likely have multiple edges (HTTP, SDK, CLI, cron).
  // If “default page size = 20” lives only in the HTTP Zod schema, the others drift.
  // Max page size, minimums, and fallback defaults affect semantics and perf; they should be enforced where the use case runs.
  // Zod defaults are great for DX and nicer request shapes, but they’re presentation-level conveniences.
  const DEFAULT_LIMIT = 20
  const MAX_LIMIT = 50
  const DEFAULT_QUORUM = 30 // tune/externally config if you want
  const DEFAULT_FEED_STATUSES: PollStatus[] = ["open"] // domain policy

  // Clamp the requested limit between 1 and MAX_LIMIT
  // Math.max(requested, 1) ensures minimum value of 1
  // Math.min(..., MAX_LIMIT) ensures maximum value of MAX_LIMIT
  const requestedLimit = limit ?? DEFAULT_LIMIT
  const pageSize = Math.min(Math.max(requestedLimit, 1), MAX_LIMIT)

  // Quorum controls when the UI shows the "Warming up" state (total < quorum).
  const quorumThreshold = quorum ?? DEFAULT_QUORUM

  // Hardcoded for now. Might expose later to query params
  const statuses = DEFAULT_FEED_STATUSES

  // Fetch one extra record (N+1). If it exists, we know there’s another page.
  const polls = await pollFeed.page({
    cursor,
    statuses,
    limit: pageSize + 1,
    quorum: quorumThreshold,
  })

  // Return only the requested amount; keep the extra record private.
  const hasMore = polls.length > pageSize
  const items = hasMore ? polls.slice(0, pageSize) : polls

  // If there’s more, the next cursor is the createdAt of the last item we returned.
  // Poll rows include createdAt (from poll.created_at), so this stays the same.
  const nextCursor = hasMore ? items[items.length - 1].createdAt : undefined

  return {items, nextCursor}
}
