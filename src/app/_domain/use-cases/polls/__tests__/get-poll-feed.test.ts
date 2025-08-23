import {describe, expect, it, jest} from "@jest/globals"

import type {PollFeedSource} from "@/app/_domain/ports/out/poll-feed-source"
import type {PollFeedItem} from "@/app/_domain/use-cases/polls/dto/poll"
import {getPollFeed} from "@/app/_domain/use-cases/polls/get-poll-feed"

// Helper: newest-first items, 1-minute apart
function makeItems(count: number, startISO = "2025-08-20T12:00:00.000Z"): PollFeedItem[] {
  const startMs = new Date(startISO).getTime()
  return Array.from({length: count}, (_unused, index) => ({
    pollId: `p${index + 1}`,
    createdAt: new Date(startMs - index * 60_000).toISOString(), // DESC timestamps
  }))
}

// Typed fake implementing PollFeedSource (no `any`, no single-letter vars, Jest v30-typed )
export function makePollFeedSource(allItems: PollFeedItem[]): PollFeedSource {
  const page = jest.fn<PollFeedSource["page"]>().mockImplementation(async ({limit, cursor}) => {
    let startIndex = 0
    if (cursor) {
      const cursorIndex = allItems.findIndex((item) => item.createdAt === cursor)
      startIndex = cursorIndex === -1 ? allItems.length : cursorIndex + 1
    }
    return allItems.slice(startIndex, startIndex + limit)
  })

  return {page}
}

describe("getPollFeed", () => {
  describe("without cursor", () => {
    it("returns 20 items and a nextCursor when more exist", async () => {
      const data = makeItems(25)
      const poll = makePollFeedSource(data)

      const result = await getPollFeed({poll, input: {}})

      expect(result.items).toHaveLength(20)
      expect(result.nextCursor).toBe(result.items[19].createdAt)
      // N+1 verified via call arg (impl detail in assertion, not title)
      expect(poll.page).toHaveBeenCalledWith({limit: 21, cursor: undefined})
    })

    it("returns all items and no nextCursor at the end", async () => {
      const data = makeItems(20)
      const poll = makePollFeedSource(data)

      const result = await getPollFeed({poll, input: {}})

      expect(result.items).toHaveLength(20)
      expect(result.nextCursor).toBeUndefined()
      expect(poll.page).toHaveBeenCalledWith({limit: 21, cursor: undefined})
    })
  })

  describe("with cursor", () => {
    it("returns the next page after the cursor", async () => {
      const data = makeItems(8)
      const poll = makePollFeedSource(data)

      const cursor = data[2].createdAt // after third item in DESC stream
      const result = await getPollFeed({poll, input: {limit: 3, cursor}})

      expect(result.items.map((item) => item.pollId)).toEqual(["p4", "p5", "p6"])
      expect(result.nextCursor).toBe(result.items[2].createdAt)
      expect(poll.page).toHaveBeenCalledWith({limit: 4, cursor})
    })
  })

  describe("limit handling", () => {
    it("honors a smaller requested limit", async () => {
      const data = makeItems(10)
      const poll = makePollFeedSource(data)

      const result = await getPollFeed({poll, input: {limit: 5}})

      expect(result.items).toHaveLength(5)
      expect(result.nextCursor).toBe(result.items[4].createdAt)
      expect(poll.page).toHaveBeenCalledWith({limit: 6, cursor: undefined})
    })

    it("clamps an excessive limit to 50", async () => {
      const data = makeItems(120)
      const poll = makePollFeedSource(data)

      const result = await getPollFeed({poll, input: {limit: 100}})

      expect(result.items).toHaveLength(50)
      expect(result.nextCursor).toBe(result.items[49].createdAt)
      expect(poll.page).toHaveBeenCalledWith({limit: 51, cursor: undefined})
    })

    it("floors invalid limits to 1", async () => {
      const data = makeItems(3)
      const poll = makePollFeedSource(data)

      const result = await getPollFeed({poll, input: {limit: 0}})

      expect(result.items).toHaveLength(1)
      expect(result.nextCursor).toBe(result.items[0].createdAt)
      expect(poll.page).toHaveBeenCalledWith({limit: 2, cursor: undefined})
    })
  })

  describe("edge cases", () => {
    it("returns an empty result for an empty feed", async () => {
      const poll = makePollFeedSource([])

      const result = await getPollFeed({poll, input: {}})

      expect(result.items).toHaveLength(0)
      expect(result.nextCursor).toBeUndefined()
      expect(poll.page).toHaveBeenCalledWith({limit: 21, cursor: undefined})
    })
  })
})
