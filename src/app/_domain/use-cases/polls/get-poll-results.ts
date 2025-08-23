import type {GetPollResultsResult} from "@/app/_domain/ports/in/get-poll-results"
import type {PollsSource} from "@/app/_domain/ports/out/polls-source"
import type {VotesSource} from "@/app/_domain/ports/out/votes-source"

/**
 * getPollResults
 *
 * Domain use case: snapshot of “current” vote tallies (latest-per-user).
 * - Resolve poll by slug (id + status only).
 * - Ask VotesSource for per-option tallies of current votes.
 * - Sum totals and compute percentages to 1 decimal place (guard /0).
 *
 * Assumptions (contracts of sources):
 * - PollsSource.findBySlug(slug) → { pollId, status } | null.
 * - VotesSource.tallyCurrent(pollId) → Array<{ optionId: string; count: number }>
 *   where `count` is the number of unique users whose latest vote targets that option.
 *
 * Errors (domain codes thrown as Error.message):
 * - "not_found" → poll slug doesn’t exist.
 *
 * Notes:
 * - Percentages may not sum to exactly 100.0 due to rounding.
 * - If you need zero-count options included, merge with PollsSource.listOptions()
 *   and fill missing tallies with { count: 0 } before computing percentages.
 */
export async function getPollResults(args: {
  polls: PollsSource
  votes: VotesSource
  slug: string
}): Promise<GetPollResultsResult> {
  const {polls, votes, slug} = args

  // 1) Resolve poll or fail fast.
  const poll = await polls.findBySlug(slug)
  if (!poll) {
    throw new Error("not_found")
  }

  // 2) Ask votes port for current tallies: [{ optionId, count }]
  const tallies = await votes.tallyCurrent(poll.pollId)

  // 3) Total unique voters (size of “current votes” set).
  const total = tallies.reduce((sum, t) => sum + t.count, 0)

  // 4) Map to presentation with percentage at 1 decimal place.
  //    pct = round((count / total) * 100, 1dp) → round((count * 1000) / total) / 10
  const items = tallies.map((t) => {
    const pct = total === 0 ? 0 : Math.round((t.count * 1000) / total) / 10

    return {
      optionId: t.optionId,
      count: t.count,
      pct,
    }
  })

  // 5) Emit snapshot with status and server timestamp.
  return {
    items,
    total,
    status: poll.status,
    updatedAt: new Date().toISOString(),
  }
}
