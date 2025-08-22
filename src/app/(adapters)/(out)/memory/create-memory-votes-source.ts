import {randomUUID} from "node:crypto"

import type {VotesSource} from "@/app/_domain/ports/out/votes-source"

type MemoryVoteRow = {
  id: string
  pollId: string
  optionId: string
  userId: string
  votedAt: Date
  idempotencyKey?: string
}

export function createMemoryVotesSource(): VotesSource {
  // Process-local append-only log of votes (dev only)
  const votes: MemoryVoteRow[] = []

  // Tracks which (userId, idempotencyKey) pairs have been used
  const idempotencyIndex = new Set<string>() // key format: `${userId}:${idempotencyKey}`

  return {
    // Append a new vote event (append-only by design)
    async append({pollId, optionId, userId, idempotencyKey}) {
      const newVote: MemoryVoteRow = {
        id: randomUUID(),
        pollId,
        optionId,
        userId,
        votedAt: new Date(),
        idempotencyKey,
      }

      votes.push(newVote)

      if (idempotencyKey) {
        const compositeKey = `${userId}:${idempotencyKey}`
        idempotencyIndex.add(compositeKey)
      }
    },

    // Has this (userId, idempotencyKey) been seen before?
    async wasUsed(userId, idempotencyKey) {
      const compositeKey = `${userId}:${idempotencyKey}`
      const exists = idempotencyIndex.has(compositeKey)

      if (exists) {
        return true
      }

      return false
    },

    // Compute the "current vote" tallies for a poll:
    // For each user, only their latest vote counts.
    async tallyCurrent(pollId) {
      // latest vote per user for this poll
      const latestByUser = new Map<string, {optionId: string; votedAtMs: number; id: string}>()

      for (const vote of votes) {
        // Skip votes from other polls
        if (vote.pollId !== pollId) {
          continue
        }

        const userKey = vote.userId
        const previous = latestByUser.get(userKey)

        const current = {
          optionId: vote.optionId,
          votedAtMs: vote.votedAt.getTime(),
          id: vote.id,
        }

        // If no prior vote recorded for this user, take this one
        if (!previous) {
          latestByUser.set(userKey, current)
          continue
        }

        // Otherwise keep the newer one:
        // - later timestamp wins
        // - if timestamps tie, lexicographically larger id wins (deterministic)
        const currentIsNewer =
          current.votedAtMs > previous.votedAtMs ||
          (current.votedAtMs === previous.votedAtMs && current.id > previous.id)

        if (currentIsNewer) {
          latestByUser.set(userKey, current)
        }
      }

      // Count how many users currently point to each option
      const counts = new Map<string, number>()

      for (const record of latestByUser.values()) {
        const existing = counts.get(record.optionId) ?? 0
        counts.set(record.optionId, existing + 1)
      }

      // Convert Map<string, number> → Array<{ optionId, count }>
      const result: Array<{optionId: string; count: number}> = []
      for (const [optionId, count] of counts.entries()) {
        result.push({optionId, count})
      }

      return result
    },
  }
}
