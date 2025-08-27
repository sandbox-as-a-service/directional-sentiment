import type {GetPollResultsResult} from "@/app/_domain/ports/in/get-poll-results"
import type {PollsSource} from "@/app/_domain/ports/out/polls-source"
import type {VotesSource} from "@/app/_domain/ports/out/votes-source"
import {POLLS} from "@/app/_domain/config/polls"

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

  const {pollId, status} = poll

  // 2) Fetch all options and current tallies (latest-per-user) in parallel.
  const [options, tallies] = await Promise.all([polls.listOptions(pollId), votes.tallyCurrent(pollId)])

  // 3) Ensure every option appears (0 when missing).
  const tallyByOptionId = new Map<string, number>()
  for (const tally of tallies) {
    tallyByOptionId.set(tally.optionId, tally.count)
  }

  const mergedCounts = options.map((option) => ({
    optionId: option.optionId,
    label: option.label,
    count: tallyByOptionId.get(option.optionId) ?? 0,
  }))

  // 4) Totals + percentages (1 decimal place). Guard divide-by-zero.
  const totalVotes = mergedCounts.reduce((sum, item) => {
    return sum + item.count
  }, 0)

  const items = mergedCounts.map((option) => ({
    optionId: option.optionId,
    count: option.count,
    label: option.label,
    pct: totalVotes === 0 ? 0 : Math.round((option.count * 1000) / totalVotes) / 10,
  }))

  // 5) Include warming-up signal
  const warmingUp = totalVotes < POLLS.DEFAULT_QUORUM

  return {
    items,
    status,
    total: totalVotes,
    updatedAt: new Date().toISOString(), // In-memory when the results were computed. Not when the poll was last updated or when the user voted.
    warmingUp,
  }
}
