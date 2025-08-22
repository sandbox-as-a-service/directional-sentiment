export type CastVoteInput = {
  slug: string
  optionId: string
  userId: string
  idempotencyKey?: string
}

// Optional: if you ever want to return a result
export type CastVoteResult = string
