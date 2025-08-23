import {describe, expect, it, jest} from "@jest/globals"

import type {PollsSource} from "@/app/_domain/ports/out/polls-source"
import type {VotesSource} from "@/app/_domain/ports/out/votes-source"
import type {PollSummary} from "@/app/_domain/use-cases/polls/dto/poll"
import {getPollResults} from "@/app/_domain/use-cases/polls/get-poll-results"

export function makePollsSource(summary: PollSummary | null): PollsSource {
  // One generic: the full function type.
  const findBySlug = jest.fn<PollsSource["findBySlug"]>().mockResolvedValue(summary)

  // Not used by this use case; included to satisfy the interface.
  const listOptions = jest.fn<PollsSource["listOptions"]>().mockResolvedValue([])

  return {findBySlug, listOptions}
}

export function makeVotesSource(tallies: Array<{optionId: string; count: number}>): VotesSource {
  const tallyCurrent = jest.fn<VotesSource["tallyCurrent"]>().mockResolvedValue(tallies)

  // Not used here; present to satisfy the interface.
  const wasUsed = jest.fn<VotesSource["wasUsed"]>().mockResolvedValue(false)

  const append = jest.fn<VotesSource["append"]>().mockResolvedValue(undefined)

  return {tallyCurrent, wasUsed, append}
}

describe("getPollResults", () => {
  describe("happy path", () => {
    it("returns items, totals, status, and a timestamp", async () => {
      const polls = makePollsSource({pollId: "p1", status: "open"})
      const votes = makeVotesSource([
        {optionId: "o1", count: 2},
        {optionId: "o2", count: 1},
      ])

      const result = await getPollResults({polls, votes, slug: "s1"})

      // data
      expect(result.total).toBe(3)
      expect(result.status).toBe("open")
      expect(result.items).toEqual(
        expect.arrayContaining([
          expect.objectContaining({optionId: "o1", count: 2}),
          expect.objectContaining({optionId: "o2", count: 1}),
        ]),
      )

      // percentages (1 decimal place rounding)
      const pctByOption = Object.fromEntries(result.items.map((entry) => [entry.optionId, entry.pct]))
      expect(pctByOption["o1"]).toBe(66.7)
      expect(pctByOption["o2"]).toBe(33.3)

      // timestamp is an ISO-like string (do not freeze clock; just validate shape)
      expect(typeof result.updatedAt).toBe("string")
      expect(Number.isNaN(Date.parse(result.updatedAt))).toBe(false)

      // votes are tallied for the resolved poll id
      expect(votes.tallyCurrent).toHaveBeenCalledWith("p1")
    })
  })

  describe("validation", () => {
    it("throws when the poll does not exist", async () => {
      const polls = makePollsSource(null)
      const votes = makeVotesSource([])

      await expect(getPollResults({polls, votes, slug: "missing"})).rejects.toThrow("not_found")
    })
  })

  describe("edge cases", () => {
    it("returns zero totals and an empty items array when there are no votes", async () => {
      const polls = makePollsSource({pollId: "p1", status: "open"})
      const votes = makeVotesSource([])

      const result = await getPollResults({polls, votes, slug: "s1"})

      expect(result.total).toBe(0)
      expect(result.items).toHaveLength(0)
      expect(result.status).toBe("open")
      expect(typeof result.updatedAt).toBe("string")
    })

    it("echoes the poll status even when the poll is closed", async () => {
      const polls = makePollsSource({pollId: "p9", status: "closed"})
      const votes = makeVotesSource([{optionId: "o1", count: 4}])

      const result = await getPollResults({polls, votes, slug: "s-closed"})

      expect(result.status).toBe("closed")
      expect(result.total).toBe(4)
      expect(result.items[0]).toEqual(expect.objectContaining({optionId: "o1", count: 4, pct: 100}))
    })

    it("rounds percentages to one decimal and totals approximately 100", async () => {
      const polls = makePollsSource({pollId: "p2", status: "open"})
      // 5, 3, 2 → 50.0, 30.0, 20.0 (exact)
      const votes = makeVotesSource([
        {optionId: "a", count: 5},
        {optionId: "b", count: 3},
        {optionId: "c", count: 2},
      ])

      const result = await getPollResults({polls, votes, slug: "s2"})

      const sumPct = result.items.reduce((sum, entry) => sum + entry.pct, 0)
      expect(sumPct).toBeGreaterThanOrEqual(99.9) // allow tiny float drift
      expect(sumPct).toBeLessThanOrEqual(100.1)

      // verify expected 1dp values explicitly for this mix
      const pctByOption = Object.fromEntries(result.items.map((entry) => [entry.optionId, entry.pct]))
      expect(pctByOption["a"]).toBe(50.0)
      expect(pctByOption["b"]).toBe(30.0)
      expect(pctByOption["c"]).toBe(20.0)
    })
  })
})
