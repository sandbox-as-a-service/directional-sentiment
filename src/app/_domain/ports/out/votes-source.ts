// Out-port: append vote, idempotency check, and snapshot tally
export type VotesAppendInput = {
  pollId: string
  optionId: string
  userId: string
  idempotencyKey?: string
}

export type VotesSource = {
  append(input: VotesAppendInput): Promise<void>
  wasUsed(userId: string, idempotencyKey: string): Promise<boolean>
  tallyCurrent(pollId: string): Promise<Array<{optionId: string; count: number}>>
}
