// Out-port: append vote, idempotency check, and snapshot tally
export type VotesSource = {
  append(input: {pollId: string; optionId: string; userId: string; idempotencyKey?: string}): Promise<void>
  wasUsed(userId: string, idempotencyKey: string): Promise<boolean>
  tallyCurrent(pollId: string): Promise<Array<{optionId: string; count: number}>>
}
