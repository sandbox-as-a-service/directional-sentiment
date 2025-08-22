export type CastVoteResult = string
export type CastVoteInput = {
  slug: string
  optionId: string
  userId: string
  idempotencyKey?: string
}
