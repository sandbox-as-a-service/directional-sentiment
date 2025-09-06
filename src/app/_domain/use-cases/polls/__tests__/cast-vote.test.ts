import {describe, expect, it, jest} from "@jest/globals"

import type {PollsSource} from "@/app/_domain/ports/out/polls-source"
import type {VotesSource} from "@/app/_domain/ports/out/votes-source"
import {castVote} from "@/app/_domain/use-cases/polls/cast-vote"
import type {PollMetadata, PollOptionItem} from "@/app/_domain/use-cases/polls/dto/poll"

function makePollsSource(summary: PollMetadata | null, options: Array<PollOptionItem>): PollsSource {
  const findBySlug = jest.fn<PollsSource["findBySlug"]>().mockResolvedValue(summary)
  const listOptions = jest.fn<PollsSource["listOptions"]>().mockResolvedValue(options)
  return {findBySlug, listOptions}
}

function makeVotesSource(options?: {wasUsed?: boolean}): VotesSource {
  const tallyCurrent = jest.fn<VotesSource["tallyCurrent"]>().mockResolvedValue([]) // not used here
  const wasUsed = jest.fn<VotesSource["wasUsed"]>().mockResolvedValue(options?.wasUsed ?? false)
  const append = jest.fn<VotesSource["append"]>().mockResolvedValue(undefined)
  const currentByUserInPolls = jest.fn<VotesSource["currentByUserInPolls"]>().mockResolvedValue([]) // not used here
  return {tallyCurrent, wasUsed, append, currentByUserInPolls}
}

describe("castVote", () => {
  describe("happy path", () => {
    it("appends a vote for an open poll with a valid option", async () => {
      const polls = makePollsSource({pollId: "p1", status: "open"}, [{optionId: "o1", label: "Option 1"}])
      const votes = makeVotesSource()

      await castVote({
        polls,
        votes,
        input: {slug: "best-bj-flavor", optionId: "o1", userId: "u1"},
      })

      expect(polls.findBySlug).toHaveBeenCalledWith("best-bj-flavor")
      expect(polls.listOptions).toHaveBeenCalledWith("p1")
      expect(votes.wasUsed).not.toHaveBeenCalled()
      expect(votes.append).toHaveBeenCalledTimes(1)
      expect(votes.append).toHaveBeenCalledWith({
        pollId: "p1",
        optionId: "o1",
        userId: "u1",
        idempotencyKey: undefined,
      })
    })
  })

  describe("validation", () => {
    it("throws when the poll does not exist", async () => {
      const polls = makePollsSource(null, [])
      const votes = makeVotesSource()

      await expect(
        castVote({polls, votes, input: {slug: "missing", optionId: "o1", userId: "u1"}}),
      ).rejects.toThrow("not_found")

      expect(polls.listOptions).not.toHaveBeenCalled()
      expect(votes.wasUsed).not.toHaveBeenCalled()
      expect(votes.append).not.toHaveBeenCalled()
    })

    it("throws when the poll is closed", async () => {
      const polls = makePollsSource({pollId: "p1", status: "closed"}, [{optionId: "o1", label: "Option 1"}])
      const votes = makeVotesSource()

      await expect(
        castVote({polls, votes, input: {slug: "s1", optionId: "o1", userId: "u1"}}),
      ).rejects.toThrow("poll_closed")

      expect(polls.listOptions).not.toHaveBeenCalled() // status checked before options
      expect(votes.wasUsed).not.toHaveBeenCalled()
      expect(votes.append).not.toHaveBeenCalled()
    })

    it("throws when the option does not belong to the poll", async () => {
      const polls = makePollsSource({pollId: "p1", status: "open"}, [{optionId: "oA", label: "Option A"}])
      const votes = makeVotesSource()

      await expect(
        castVote({polls, votes, input: {slug: "s1", optionId: "oZ", userId: "u1"}}),
      ).rejects.toThrow("option_mismatch")

      expect(polls.listOptions).toHaveBeenCalledWith("p1")
      expect(votes.wasUsed).not.toHaveBeenCalled()
      expect(votes.append).not.toHaveBeenCalled()
    })
  })

  describe("idempotency", () => {
    it("does not append when the idempotency key was already used", async () => {
      const polls = makePollsSource({pollId: "p9", status: "open"}, [{optionId: "o9", label: "Option 9"}])
      const votes = makeVotesSource({wasUsed: true})

      await castVote({
        polls,
        votes,
        input: {slug: "s9", optionId: "o9", userId: "u9", idempotencyKey: "key-1"},
      })

      expect(votes.wasUsed).toHaveBeenCalledWith({userId: "u9", idempotencyKey: "key-1"})
      expect(votes.append).not.toHaveBeenCalled()
    })

    it("appends when the idempotency key has not been used", async () => {
      const polls = makePollsSource({pollId: "p2", status: "open"}, [{optionId: "o2", label: "Option 2"}])
      const votes = makeVotesSource({wasUsed: false})

      await castVote({
        polls,
        votes,
        input: {slug: "s2", optionId: "o2", userId: "u2", idempotencyKey: "key-2"},
      })

      expect(votes.wasUsed).toHaveBeenCalledWith({userId: "u2", idempotencyKey: "key-2"})
      expect(votes.append).toHaveBeenCalledWith({
        pollId: "p2",
        optionId: "o2",
        userId: "u2",
        idempotencyKey: "key-2",
      })
    })

    it("does not call idempotency check when no key is provided", async () => {
      const polls = makePollsSource({pollId: "p3", status: "open"}, [{optionId: "o3", label: "Option 3"}])
      const votes = makeVotesSource()

      await castVote({
        polls,
        votes,
        input: {slug: "s3", optionId: "o3", userId: "u3"},
      })

      expect(votes.wasUsed).not.toHaveBeenCalled()
      expect(votes.append).toHaveBeenCalledTimes(1)
    })
  })
})
