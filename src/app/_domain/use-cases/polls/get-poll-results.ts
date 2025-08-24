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

const MIN_QUORUM = 30 // tune/externally config if you want

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

  // 2) Fetch all options and current tallies (latest-per-user) in parallel.
  const [allOptions, tallies] = await Promise.all([
    polls.listOptions(poll.pollId), // [{ optionId }]
    votes.tallyCurrent(poll.pollId), // [{ optionId, count }] (only >0 rows)
  ])

  // 3) Ensure every option appears (0 when missing).
  const tallyByOptionId = new Map<string, number>()
  for (const {optionId, count} of tallies) tallyByOptionId.set(optionId, count)

  const mergedCounts = allOptions.map(({optionId, label}) => ({
    optionId,
    label,
    count: tallyByOptionId.get(optionId) ?? 0,
  }))

  // 4) Totals + percentages (1 decimal place). Guard divide-by-zero.
  const totalVotes = mergedCounts.reduce((sum, {count}) => sum + count, 0)

  const items = mergedCounts.map(({optionId, count, label}) => ({
    optionId,
    count,
    label,
    pct: totalVotes === 0 ? 0 : Math.round((count * 1000) / totalVotes) / 10,
  }))

  // 5) Include warming-up signal
  const warmingUp = totalVotes < MIN_QUORUM

  return {
    items,
    total: totalVotes,
    status: poll.status,
    updatedAt: new Date().toISOString(),
    warmingUp,
    minQuorum: MIN_QUORUM,
  }
}
