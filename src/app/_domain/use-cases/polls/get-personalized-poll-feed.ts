import {POLLS} from "@/app/_domain/config/polls"
import type {
  GetPersonalizedPollFeedInput,
  GetPersonalizedPollFeedResult,
} from "@/app/_domain/ports/in/get-personalized-poll-feed"
import type {PollFeedSource} from "@/app/_domain/ports/out/poll-feed-source"
import type {VotesSource} from "@/app/_domain/ports/out/votes-source"

/**
 * getPollFeed
 *
 * Domain use case: keyset-paginate the poll feed with a hard cap.
 * - Enforces a max page size.
 * - Enforces a minimum quorum.
 * - Uses the "fetch N+1" trick to learn if there’s another page.
 * - Emits a `nextCursor` (openedAt of the last returned item) when more pages exist.
 * - The feed source returns DTO-ready items via the DB RPC.
 * - We pass `quorum` through so the adapter/RPC can mark "Warming up".
 *
 * Optional personalization:
 * - If `input.userId` is provided AND a `votes` port is supplied,
 *   enrich each returned item with `current` = the caller’s latest optionId for that poll (or null).
 *
 * Assumptions (contract of PollFeedSource.page):
 * - Results come sorted by openedAt DESC (newest first) or a stable order compatible with `cursor`.
 * - `cursor` is an ISO datetime (TZ-aware) that the adapter knows how to use for keyset pagination.
 */
export async function getPersonalizedPollFeed(args: {
  pollFeed: PollFeedSource
  votes: VotesSource
  input: GetPersonalizedPollFeedInput
}): Promise<GetPersonalizedPollFeedResult> {
  const {pollFeed, votes, input} = args
  const {cursor, limit, quorum, userId} = input

  // ---- Pagination & quorum normalization ------------------------------------
  // Single source of truth for limits and defaults at the domain boundary.
  const requestedLimit = limit ?? POLLS.FEED_DEFAULT_LIMIT
  const pageSize = Math.min(Math.max(requestedLimit, 1), POLLS.FEED_MAX_LIMIT)
  const quorumThreshold = quorum ?? POLLS.DEFAULT_QUORUM

  // ---- Fetch feed (N+1 to detect another page) ------------------------------
  const page = await pollFeed.page({
    cursor,
    limit: pageSize + 1,
    quorum: quorumThreshold,
  })

  const hasMore = page.length > pageSize
  const items = hasMore ? page.slice(0, pageSize) : page
  const nextCursor = hasMore ? items[items.length - 1].openedAt : undefined

  // Personalization (required deps → no guards)
  const pollIds = items.map((i) => i.pollId)

  // Strongly type the return so inference downstream is crisp
  const mine = await votes.currentByUserInPolls(pollIds, userId)

  // Map<pollId, optionId> — value is the string you want to stick into `current`
  const currentByPoll = new Map<string, string>(mine.map((row) => [row.pollId, row.optionId]))

  // Map.get returns string | undefined; we normalize “no vote” to null.
  const personalizedItems = items.map((item) => ({
    ...item,
    current: currentByPoll.get(item.pollId) ?? null,
  }))

  return {items: personalizedItems, nextCursor}
}
