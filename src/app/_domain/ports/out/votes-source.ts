export type VotesSourceAppendInput = {
  pollId: string
  optionId: string
  userId: string
  idempotencyKey?: string
}

export type VotesSourceWasUsedInput = {
  userId: string
  idempotencyKey: string
}

export type PollTallyItem = {optionId: string; count: number}
export type PollPersonalizedCurrent = {pollId: string; optionId: string}

/**
 * VotesSource
 *
 * Outbound port for persisting and querying votes.
 * Responsibilities:
 * - Append-only storage of vote events (never update existing rows).
 * - User-scoped idempotency checks.
 * - Latest-per-user tallying for "current" vote counts.
 * - User+poll scoped lookup of the caller’s *current* choice (latest-wins).
 *
 * Domain/adapter split:
 * - Domain use cases enforce policy (poll open, option membership, idempotency flow).
 * - Adapter guarantees append-only persistence, query correctness, and infra error mapping.
 */
export type VotesSource = {
  /**
   * append
   * - Purpose: Append a new vote row.
   * - Input: { pollId, optionId, userId, idempotencyKey? }.
   * - Contract:
   *   - Append-only: MUST insert a new row, never update existing ones.
   *   - Preserve idempotency_key if provided (may be null).
   *   - Vote must be scoped exactly to the provided pollId/optionId/userId.
   * - Output: void on success.
   * - Errors: Throw "supabase_insert_failed" (or similar infra error) if persistence fails.
   */
  append(input: VotesSourceAppendInput): Promise<void>

  /**
   * wasUsed
   * - Purpose: Check if a given (userId, idempotencyKey) has already been used.
   * - Input: { userId, idempotencyKey }.
   * - Contract:
   *   - Caller guarantees idempotencyKey is non-null.
   *   - Returns true if any row exists with this (userId, key).
   *   - Returns false otherwise.
   * - Output: boolean.
   * - Errors: Throw "supabase_query_failed" (or similar infra error) if query fails.
   */
  wasUsed(input: VotesSourceWasUsedInput): Promise<boolean>

  /**
   * tallyCurrent
   * - Purpose: Return current counts for a poll, where each user contributes at most one vote.
   * - Input: pollId.
   * - Contract:
   *   - For each user, only their most recent vote counts (latest by (voted_at DESC, id DESC)).
   *   - Return aggregated counts per optionId.
   * - Output: Array<{ optionId: string; count: number }>.
   * - Errors: Throw "supabase_query_failed" (or similar infra error) if query fails.
   */
  tallyCurrent(pollId: string): Promise<Array<PollTallyItem>>

  /**
   * currentByUserInPolls
   * - Purpose: For a given user, return their *current* choice per poll (latest-wins).
   * - Input: { userId, pollIds }.
   * - Contract:
   *   - Latest-wins per poll defined by (voted_at DESC, id DESC).
   *   - Return at most one row per poll the user has voted in.
   *   - Omit polls with no votes by the user.
   * - Output: Array<{ pollId: string; optionId: string }>.
   * - Errors: Throw "supabase_query_failed" (or similar infra error) if query fails.
   */
  currentByUserInPolls(
    pollIds: string[], // dedup/limit at use-case layer as needed
    userId: string,
  ): Promise<Array<PollPersonalizedCurrent>>
}
