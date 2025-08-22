import {randomUUID} from "node:crypto"

import type {VotesPort} from "@/app/_domain/ports/out/votes-source"

export function createMemoryVotesPort(): VotesPort {
  const votes: Array<{
    id: string
    pollId: string
    optionId: string
    userId: string
    votedAt: Date
    idempotencyKey?: string
  }> = []
  const idem = new Set<string>() // `${userId}:${idempotencyKey}`

  return {
    async append({pollId, optionId, userId, idempotencyKey}) {
      votes.push({
        id: randomUUID(),
        pollId,
        optionId,
        userId,
        votedAt: new Date(),
        idempotencyKey,
      })
      if (idempotencyKey) idem.add(`${userId}:${idempotencyKey}`)
    },
    async wasUsed(userId, idempotencyKey) {
      return idem.has(`${userId}:${idempotencyKey}`)
    },
    async tallyCurrent(pollId) {
      // latest per user for this poll
      const perUser = new Map<string, {optionId: string; votedAt: number; id: string}>()
      for (const v of votes) {
        if (v.pollId !== pollId) continue
        const prev = perUser.get(v.userId)
        const cur = {optionId: v.optionId, votedAt: v.votedAt.getTime(), id: v.id}
        if (!prev || prev.votedAt < cur.votedAt || (prev.votedAt === cur.votedAt && prev.id < cur.id)) {
          perUser.set(v.userId, cur)
        }
      }
      const counts = new Map<string, number>()
      for (const {optionId} of perUser.values()) counts.set(optionId, (counts.get(optionId) ?? 0) + 1)
      return [...counts.entries()].map(([optionId, count]) => ({optionId, count}))
    },
  }
}
