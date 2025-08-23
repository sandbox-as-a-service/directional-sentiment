import type {CastVoteInput} from "@/app/_domain/ports/in/cast-vote"
import type {PollsSource} from "@/app/_domain/ports/out/polls-source"
import type {VotesSource} from "@/app/_domain/ports/out/votes-source"

/**
 * castVote
 *
 * Domain use case: validate poll & option, ensure idempotency, append-only write.
 * - Lookup poll by slug and ensure it’s open.
 * - Validate that the chosen option belongs to the poll.
 * - If an idempotencyKey is provided and already used by this user, act as a no-op.
 * - Append a new vote event (no overwrites here; readers compute “latest vote wins”).
 *
 * Assumptions (contracts of sources):
 * - PollsSource.findBySlug(slug) → returns the poll or null/undefined if not found.
 * - PollsSource.listOptions(pollId) → returns all options for the poll.
 * - VotesSource.wasUsed(userId, key) → boolean, scoped per user+key.
 * - VotesSource.append(event) → persists a vote event (append-only).
 *
 * Errors (domain codes thrown as Error.message):
 * - "not_found"     → poll slug doesn’t exist.
 * - "poll_closed"   → poll.status !== "open".
 * - "option_mismatch" → optionId not part of the poll’s options.
 */
export async function castVote(args: {
  polls: PollsSource
  votes: VotesSource
  input: CastVoteInput
}): Promise<void> {
  const {polls, votes, input} = args
  const {slug, optionId, userId, idempotencyKey} = input

  // 1) Fetch poll and validate existence.
  const poll = await polls.findBySlug(slug)
  if (!poll) {
    throw new Error("not_found")
  }

  // 2) Validate poll is open for voting.
  if (poll.status !== "open") {
    throw new Error("poll_closed")
  }

  // 3) Ensure the option belongs to the poll.
  const options = await polls.listOptions(poll.pollId)
  const optionExistsInPoll = options.some((o) => o.optionId === optionId)
  if (!optionExistsInPoll) {
    throw new Error("option_mismatch")
  }

  // 4) Idempotency check (no-op if user already used this key for this action).
  if (idempotencyKey) {
    const alreadyUsed = await votes.wasUsed(userId, idempotencyKey)
    if (alreadyUsed) {
      return // idempotent no-op
    }
  }

  // 5) Append the vote event; persistence & sequencing are adapter concerns.
  await votes.append({
    pollId: poll.pollId,
    optionId,
    userId,
    idempotencyKey,
  })
}
