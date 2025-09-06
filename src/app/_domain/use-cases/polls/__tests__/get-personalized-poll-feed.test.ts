import {describe, expect, it, jest} from "@jest/globals"

import {POLLS} from "@/app/_domain/config/polls"
import type {PollFeedSource} from "@/app/_domain/ports/out/poll-feed-source"
import type {VotesSource} from "@/app/_domain/ports/out/votes-source"
import type {PollFeedPageItem} from "@/app/_domain/use-cases/polls/dto/poll"
import {getPersonalizedPollFeed} from "@/app/_domain/use-cases/polls/get-personalized-poll-feed"

// Helper: newest-first items, 1-minute apart, full PollFeedPageItem shape
function makeItems(count: number, startISO = "2025-08-20T12:00:00.000Z"): Array<PollFeedPageItem> {
  const startMs = new Date(startISO).getTime()
  return Array.from({length: count}, (_unused, index) => {
    const openedAt = new Date(startMs - index * 60_000).toISOString() // DESC timestamps
    const pollId = `p${index + 1}`
    return {
      pollId,
      slug: `slug-${pollId}`,
      question: `Question ${index + 1}?`,
      status: "open",
      category: null,
      openedAt,
      createdAt: openedAt,
      options: [
        {optionId: `${pollId}-o1`, label: "Yes"},
        {optionId: `${pollId}-o2`, label: "No"},
      ],
      results: {
        total: 0,
        updatedAt: null,
        warmingUp: true,
        items: [
          {optionId: `${pollId}-o1`, label: "Yes", count: 0, pct: 0},
          {optionId: `${pollId}-o2`, label: "No", count: 0, pct: 0},
        ],
      },
    }
  })
}

function makePollFeedSource(allItems: Array<PollFeedPageItem>): PollFeedSource {
  const page = jest.fn<PollFeedSource["page"]>().mockImplementation(async (input) => {
    const {limit, cursor} = input
    let startIndex = 0
    if (cursor) {
      const cursorIndex = allItems.findIndex((item) => item.openedAt === cursor)
      startIndex = cursorIndex === -1 ? allItems.length : cursorIndex + 1
    }
    return allItems.slice(startIndex, startIndex + limit)
  })
  return {page}
}

function makeVotesSourceCurrent(mapping: Array<{pollId: string; optionId: string}>): VotesSource {
  const currentByUserInPolls = jest
    .fn<VotesSource["currentByUserInPolls"]>()
    .mockImplementation(async (pollIds: string[]) => {
      // Only return rows for pollIds the feed actually asked about
      const set = new Set(pollIds)
      return mapping.filter((m) => set.has(m.pollId))
    })

  // @ts-expect-error: other members of VotesSource are not needed for these tests
  return {currentByUserInPolls}
}

describe("getPersonalizedPollFeed", () => {
  const userId = "user-123"

  describe("without cursor", () => {
    it("returns 20 items, nextCursor when more exist, and enriches current votes", async () => {
      const data = makeItems(25)
      const pollFeed = makePollFeedSource(data)

      // Pretend the user voted on p2 and p7
      const votes = makeVotesSourceCurrent([
        {pollId: "p2", optionId: "p2-o1"},
        {pollId: "p7", optionId: "p7-o2"},
      ])

      const result = await getPersonalizedPollFeed({pollFeed, votes, input: {userId}})

      expect(result.items).toHaveLength(20)
      expect(result.nextCursor).toBe(result.items[19].openedAt)

      // Paging call uses N+1 and default quorum
      expect(pollFeed.page).toHaveBeenCalledWith({
        limit: POLLS.FEED_DEFAULT_LIMIT + 1,
        cursor: undefined,
        quorum: POLLS.DEFAULT_QUORUM,
      })

      // Votes requested for exactly the returned pollIds, in order
      expect(votes.currentByUserInPolls).toHaveBeenCalledTimes(1)
      expect(votes.currentByUserInPolls).toHaveBeenCalledWith(
        result.items.map((i) => i.pollId),
        userId,
      )

      // Personalization: only p2 and p7 get non-null current
      const byId = new Map(result.items.map((i) => [i.pollId, i.current]))
      expect(byId.get("p2")).toBe("p2-o1")
      expect(byId.get("p7")).toBe("p7-o2")
      // Spot check a non-voted item
      expect(byId.get("p1")).toBeNull()
    })

    it("returns all items and no nextCursor at the end", async () => {
      const data = makeItems(POLLS.FEED_DEFAULT_LIMIT)
      const pollFeed = makePollFeedSource(data)
      const votes = makeVotesSourceCurrent([])

      const result = await getPersonalizedPollFeed({pollFeed, votes, input: {userId}})

      expect(result.items).toHaveLength(POLLS.FEED_DEFAULT_LIMIT)
      expect(result.nextCursor).toBeUndefined()
      expect(pollFeed.page).toHaveBeenCalledWith({
        limit: POLLS.FEED_DEFAULT_LIMIT + 1,
        cursor: undefined,
        quorum: POLLS.DEFAULT_QUORUM,
      })
      expect(votes.currentByUserInPolls).toHaveBeenCalledWith(
        result.items.map((i) => i.pollId),
        userId,
      )
    })
  })

  describe("with cursor", () => {
    it("returns the next page after the cursor and enriches current", async () => {
      const data = makeItems(8)
      const pollFeed = makePollFeedSource(data)

      const votes = makeVotesSourceCurrent([{pollId: "p5", optionId: "p5-o1"}])

      const cursor = data[2].openedAt // after third item in DESC stream
      const result = await getPersonalizedPollFeed({
        pollFeed,
        votes,
        input: {limit: 3, cursor, userId},
      })

      expect(result.items.map((item) => item.pollId)).toEqual(["p4", "p5", "p6"])
      expect(result.nextCursor).toBe(result.items[2].openedAt)
      expect(pollFeed.page).toHaveBeenCalledWith({
        limit: 4, // N+1
        cursor,
        quorum: POLLS.DEFAULT_QUORUM,
      })

      // Personalization applied
      const p5 = result.items.find((i) => i.pollId === "p5")!
      const p4 = result.items.find((i) => i.pollId === "p4")!
      expect(p5.current).toBe("p5-o1")
      expect(p4.current).toBeNull()
    })
  })

  describe("limit handling", () => {
    it("honors a smaller requested limit", async () => {
      const data = makeItems(10)
      const pollFeed = makePollFeedSource(data)
      const votes = makeVotesSourceCurrent([])

      const result = await getPersonalizedPollFeed({
        pollFeed,
        votes,
        input: {limit: 5, userId},
      })

      expect(result.items).toHaveLength(5)
      expect(result.nextCursor).toBe(result.items[4].openedAt)
      expect(pollFeed.page).toHaveBeenCalledWith({
        limit: 6,
        cursor: undefined,
        quorum: POLLS.DEFAULT_QUORUM,
      })
    })

    it("clamps an excessive limit to the max and still N+1s", async () => {
      const data = makeItems(120)
      const pollFeed = makePollFeedSource(data)
      const votes = makeVotesSourceCurrent([])

      const result = await getPersonalizedPollFeed({
        pollFeed,
        votes,
        input: {limit: 100, userId},
      })

      expect(result.items).toHaveLength(POLLS.FEED_MAX_LIMIT)
      expect(result.nextCursor).toBe(result.items[POLLS.FEED_MAX_LIMIT - 1].openedAt)
      expect(pollFeed.page).toHaveBeenCalledWith({
        limit: POLLS.FEED_MAX_LIMIT + 1,
        cursor: undefined,
        quorum: POLLS.DEFAULT_QUORUM,
      })
    })

    it("floors invalid limits to 1", async () => {
      const data = makeItems(3)
      const pollFeed = makePollFeedSource(data)
      const votes = makeVotesSourceCurrent([])

      const result = await getPersonalizedPollFeed({
        pollFeed,
        votes,
        input: {limit: 0, userId},
      })

      expect(result.items).toHaveLength(1)
      expect(result.nextCursor).toBe(result.items[0].openedAt)
      expect(pollFeed.page).toHaveBeenCalledWith({
        limit: 2,
        cursor: undefined,
        quorum: POLLS.DEFAULT_QUORUM,
      })
    })
  })

  describe("edge cases", () => {
    it("returns an empty result for an empty feed and still queries votes with []", async () => {
      const pollFeed = makePollFeedSource([])
      const votes = makeVotesSourceCurrent([])

      const result = await getPersonalizedPollFeed({pollFeed, votes, input: {userId}})

      expect(result.items).toHaveLength(0)
      expect(result.nextCursor).toBeUndefined()
      expect(pollFeed.page).toHaveBeenCalledWith({
        limit: POLLS.FEED_DEFAULT_LIMIT + 1,
        cursor: undefined,
        quorum: POLLS.DEFAULT_QUORUM,
      })
      expect(votes.currentByUserInPolls).toHaveBeenCalledWith([], userId)
    })
  })
})
