import type {GetPollResultsResult} from "@/app/_domain/ports/in/get-poll-results"
import type {PollsSource} from "@/app/_domain/ports/out/polls-source"
import type {VotesSource} from "@/app/_domain/ports/out/votes-source"

// Use case: snapshot of "current vote" tallies (latest-per-user)
export async function getPollResults(args: {
  polls: PollsSource
  votes: VotesSource
  slug: string
}): Promise<GetPollResultsResult> {
  const {polls, votes, slug} = args

  // Resolve poll by slug (domain summary only: id + status)
  const pollSummary = await polls.findBySlug(slug)

  if (!pollSummary) {
    throw new Error("not_found")
  }

  // Ask the votes port for the current tallies:
  // returns [{ optionId, count }], where "count" is the number of *users*
  // whose latest vote currently points at that option for this poll.
  // (The port may implement this via DB view/window fn or in-memory reduction.)
  const tallies = await votes.tallyCurrent(pollSummary.pollId)

  // Total unique voters for this poll (i.e., number of current votes)
  const totalCurrentVotes = tallies.reduce((accumulatedCount, tally) => {
    return accumulatedCount + tally.count
  }, 0)

  // Convert to presentation items with percentage to 1 decimal place.
  // - Guard against divide-by-zero when there are no votes.
  // - Math: pct = round( (count/total)*100, 1dp )
  //   We do: round( (count*1000)/total ) / 10 -> 1 decimal.
  // - Note: due to rounding, displayed percentages may sum to ~99.9–100.1.
  const items = tallies.map((tally) => {
    const percentage = totalCurrentVotes === 0 ? 0 : Math.round((tally.count * 1000) / totalCurrentVotes) / 10 // 1 decimal

    return {
      optionId: tally.optionId,
      count: tally.count,
      pct: percentage,
    }
  })

  // Return domain result for the in-port:
  // - status echoes current poll status (open/closed/draft)
  // - updatedAt is server timestamp so clients can show "as of" freshness
  // Note: due to rounding, displayed percentages may not sum to exactly 100.0
  return {
    items,
    total: totalCurrentVotes,
    status: pollSummary.status,
    updatedAt: new Date().toISOString(),
  }
}
