import {describe, expect, it, jest} from "@jest/globals"

import type {PollsSource} from "@/app/_domain/ports/out/polls-source"
import type {VotesSource} from "@/app/_domain/ports/out/votes-source"
import type {PollSummary} from "@/app/_domain/use-cases/polls/dto/poll"
import {getPollResults} from "@/app/_domain/use-cases/polls/get-poll-results"

type OptionMeta = {optionId: string; label: string; createdAt?: string}

export function makePollsSource(summary: PollSummary | null, options: Array<OptionMeta> = []): PollsSource {
  const findBySlug = jest.fn<PollsSource["findBySlug"]>().mockResolvedValue(summary)
  const listOptions = jest.fn<PollsSource["listOptions"]>().mockResolvedValue(options)
  return {findBySlug, listOptions}
}

export function makeVotesSource(tallies: Array<{optionId: string; count: number}>): VotesSource {
  const tallyCurrent = jest.fn<VotesSource["tallyCurrent"]>().mockResolvedValue(tallies)
  const wasUsed = jest.fn<VotesSource["wasUsed"]>().mockResolvedValue(false)
  const append = jest.fn<VotesSource["append"]>().mockResolvedValue(undefined)
  return {tallyCurrent, wasUsed, append}
}

describe("getPollResults", () => {
  describe("happy path", () => {
    it("returns items (with labels), totals, status, quorum flags, and a timestamp", async () => {
      const polls = makePollsSource({pollId: "p1", status: "open"}, [
        {optionId: "o1", label: "Yes"},
        {optionId: "o2", label: "No"},
      ])
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
          expect.objectContaining({optionId: "o1", label: "Yes", count: 2}),
          expect.objectContaining({optionId: "o2", label: "No", count: 1}),
        ]),
      )

      // percentages (1 decimal place rounding)
      const pctByOption = Object.fromEntries(result.items.map((entry) => [entry.optionId, entry.pct]))
      expect(pctByOption["o1"]).toBe(66.7)
      expect(pctByOption["o2"]).toBe(33.3)

      // quorum flags
      expect(result.warmingUp).toBe(true) // 3 < 30
      expect(result.minQuorum).toBe(30)

      // timestamp is ISO-like
      expect(typeof result.updatedAt).toBe("string")
      expect(Number.isNaN(Date.parse(result.updatedAt))).toBe(false)

      // votes tallied for the resolved poll id
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
    it("returns zero totals and an empty items array when there are no options (and no votes)", async () => {
      // listOptions -> [], tallies -> []  => items -> []
      const polls = makePollsSource({pollId: "p1", status: "open"}, [])
      const votes = makeVotesSource([])

      const result = await getPollResults({polls, votes, slug: "s1"})

      expect(result.total).toBe(0)
      expect(result.items).toHaveLength(0)
      expect(result.status).toBe("open")
      expect(result.warmingUp).toBe(true)
      expect(result.minQuorum).toBe(30)
      expect(typeof result.updatedAt).toBe("string")
    })

    it("includes zero-count options with labels when some options have no votes", async () => {
      const polls = makePollsSource({pollId: "p1", status: "open"}, [
        {optionId: "o1", label: "Alpha"},
        {optionId: "o2", label: "Bravo"},
        {optionId: "o3", label: "Charlie"}, // no votes expected
      ])
      const votes = makeVotesSource([
        {optionId: "o1", count: 1},
        {optionId: "o2", count: 1},
      ])

      const result = await getPollResults({polls, votes, slug: "s-zeros"})

      expect(result.total).toBe(2)
      // o3 must be present with count 0 and label preserved
      const byId = Object.fromEntries(result.items.map((i) => [i.optionId, i]))
      expect(byId["o3"]).toEqual(expect.objectContaining({label: "Charlie", count: 0, pct: 0}))
      expect(result.warmingUp).toBe(true)
    })

    it("echoes the poll status even when the poll is closed", async () => {
      const polls = makePollsSource({pollId: "p9", status: "closed"}, [
        {optionId: "o1", label: "Only choice"},
      ])
      const votes = makeVotesSource([{optionId: "o1", count: 4}])

      const result = await getPollResults({polls, votes, slug: "s-closed"})

      expect(result.status).toBe("closed")
      expect(result.total).toBe(4)
      expect(result.items[0]).toEqual(
        expect.objectContaining({optionId: "o1", label: "Only choice", count: 4, pct: 100}),
      )
      expect(result.warmingUp).toBe(true) // 4 < 30
    })

    it("rounds percentages to one decimal and totals approximately 100", async () => {
      const polls = makePollsSource({pollId: "p2", status: "open"}, [
        {optionId: "a", label: "A"},
        {optionId: "b", label: "B"},
        {optionId: "c", label: "C"},
      ])
      // 5, 3, 2 → 50.0, 30.0, 20.0
      const votes = makeVotesSource([
        {optionId: "a", count: 5},
        {optionId: "b", count: 3},
        {optionId: "c", count: 2},
      ])

      const result = await getPollResults({polls, votes, slug: "s2"})

      const sumPct = result.items.reduce((sum, entry) => sum + entry.pct, 0)
      expect(sumPct).toBeGreaterThanOrEqual(99.9)
      expect(sumPct).toBeLessThanOrEqual(100.1)

      const pctByOption = Object.fromEntries(result.items.map((entry) => [entry.optionId, entry.pct]))
      expect(pctByOption["a"]).toBe(50.0)
      expect(pctByOption["b"]).toBe(30.0)
      expect(pctByOption["c"]).toBe(20.0)

      expect(result.warmingUp).toBe(true) // 10 < 30
      expect(result.minQuorum).toBe(30)
    })

    it("sets warmingUp = false when total >= minQuorum", async () => {
      const polls = makePollsSource({pollId: "p3", status: "open"}, [
        {optionId: "x", label: "X"},
        {optionId: "y", label: "Y"},
      ])
      const votes = makeVotesSource([
        {optionId: "x", count: 30}, // meet quorum exactly
      ])

      const result = await getPollResults({polls, votes, slug: "s-quorum"})

      expect(result.total).toBe(30)
      expect(result.warmingUp).toBe(false)
      expect(result.minQuorum).toBe(30)
    })
  })
})
