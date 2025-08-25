export type CastVoteInput = {
  slug: string
  optionId: string
  userId: string
  idempotencyKey?: string
}
// (unused): if you ever want to return a result
export type CastVoteResult = string
