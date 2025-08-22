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
  const poll = await polls.findBySlug(slug)
  if (!poll) {
    throw new Error("not_found")
  }

  const tallies = await votes.tallyCurrent(poll.pollId)
  const total = tallies.reduce((n, x) => n + x.count, 0)
  const items = tallies.map((x) => ({
    optionId: x.optionId,
    count: x.count,
    pct: total === 0 ? 0 : Math.round((x.count * 1000) / total) / 10, // 1 decimal
  }))

  return {
    items,
    total,
    status: poll.status,
    updatedAt: new Date().toISOString(),
  }
}
