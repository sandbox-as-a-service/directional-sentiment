import {describe, expect, it, jest} from "@jest/globals"

import type {PollSummarySource} from "@/app/_domain/ports/out/poll-summary-source"
import {getPollSummary} from "@/app/_domain/use-cases/polls/get-poll-summary"

import type {PollSummaryPageItem} from "../dto/poll"

function makePollItem(): PollSummaryPageItem {
  return {
    pollId: "p1",
    slug: "poll-1",
    question: "Is pineapple on pizza elite?",
    status: "open",
    category: null,
    openedAt: "2025-08-24T10:00:00.000Z",
    createdAt: "2025-08-24T10:00:00.000Z",
    options: [
      {optionId: "o1", label: "Yes"},
      {optionId: "o2", label: "No"},
    ],
    results: {
      total: 3,
      updatedAt: "2025-08-24T10:05:00.000Z",
      warmingUp: false,
      items: [
        {optionId: "o1", label: "Yes", count: 2, pct: 66.7},
        {optionId: "o2", label: "No", count: 1, pct: 33.3},
      ],
    },
  }
}

function makePollSummarySource(poll: PollSummaryPageItem) {
  const findBySlug = jest.fn<PollSummarySource["findBySlug"]>().mockResolvedValue(poll)
  return {findBySlug}
}

function makeNullPollSummarySource() {
  const findBySlug = jest.fn<PollSummarySource["findBySlug"]>().mockResolvedValue(null)
  return {findBySlug}
}

describe("getPollSummary", () => {
  describe("defaults", () => {
    it("returns {item} and uses default quorum (30) when none provided", async () => {
      const item = makePollItem()
      const pollSummary = makePollSummarySource(item)

      const result = await getPollSummary({
        pollSummary,
        input: {slug: "poll-1"},
      })

      expect(result).toEqual({item})
      expect(pollSummary.findBySlug).toHaveBeenCalledTimes(1)
      expect(pollSummary.findBySlug).toHaveBeenCalledWith({slug: "poll-1", quorum: 30})
    })
  })

  describe("explicit quorum", () => {
    it("forwards a custom quorum value", async () => {
      const item = makePollItem()
      item.slug = "custom-slug"
      const pollSummary = makePollSummarySource(item)

      const result = await getPollSummary({
        pollSummary,
        input: {slug: "custom-slug", quorum: 42},
      })

      expect(result.item.slug).toBe("custom-slug")
      expect(pollSummary.findBySlug).toHaveBeenCalledWith({slug: "custom-slug", quorum: 42})
    })

    it("accepts 0 as an explicit quorum (no defaulting)", async () => {
      const item = makePollItem()
      item.slug = "zero-quorum"
      const pollSummary = makePollSummarySource(item)

      await getPollSummary({
        pollSummary,
        input: {slug: "zero-quorum", quorum: 0},
      })

      expect(pollSummary.findBySlug).toHaveBeenCalledWith({slug: "zero-quorum", quorum: 0})
    })
  })

  describe("errors", () => {
    it('throws "not_found" when the source returns null', async () => {
      const pollSummary = makeNullPollSummarySource()

      await expect(getPollSummary({pollSummary, input: {slug: "missing-slug"}})).rejects.toThrow("not_found")

      expect(pollSummary.findBySlug).toHaveBeenCalledWith({slug: "missing-slug", quorum: 30})
    })
  })
})
