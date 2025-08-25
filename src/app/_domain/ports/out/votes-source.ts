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

export type VotesSource = {
  append(input: VotesSourceAppendInput): Promise<void>
  wasUsed(input: VotesSourceWasUsedInput): Promise<boolean>
  tallyCurrent(pollId: string): Promise<Array<{optionId: string; count: number}>>
}
