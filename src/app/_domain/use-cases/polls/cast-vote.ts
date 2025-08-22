import type {CastVoteInput} from "@/app/_domain/ports/in/cast-vote"
import type {PollsSource} from "@/app/_domain/ports/out/polls-source"
import type {VotesSource} from "@/app/_domain/ports/out/votes-source"

// Use case: validate, idempotency, append-only vote. No DB details here.
export async function castVote(args: {
  polls: PollsSource
  votes: VotesSource
  input: CastVoteInput
}): Promise<void> {
  const {polls, votes, input} = args

  const poll = await polls.findBySlug(input.slug)

  if (!poll) {
    throw new Error("not_found")
  }

  if (poll.status !== "open") {
    throw new Error("poll_closed")
  }

  const options = await polls.listOptions(poll.pollId)
  const belongs = options.some((o) => o.optionId === input.optionId)
  if (!belongs) {
    throw new Error("option_mismatch")
  }

  if (input.idempotencyKey) {
    const used = await votes.wasUsed(input.userId, input.idempotencyKey)
    if (used) {
      return // idempotent no-op
    }
  }

  await votes.append({
    pollId: poll.pollId,
    optionId: input.optionId,
    userId: input.userId,
    idempotencyKey: input.idempotencyKey,
  })
}
