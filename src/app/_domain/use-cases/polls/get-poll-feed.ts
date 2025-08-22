import type {GetPollFeedInput, GetPollFeedResult} from "@/app/_domain//ports/in/get-poll-feed"
import type {PollFeedSource} from "@/app/_domain/ports/out/poll-feed-source"

// Use case: caps limit, slices, computes nextCursor. No Supabase here.
export async function getPollFeed(args: {
  poll: PollFeedSource
  input: GetPollFeedInput
}): Promise<GetPollFeedResult> {
  const {poll, input} = args
  const limit = Math.min(input.limit ?? 20, 50)
  const rows = await poll.page({limit: limit + 1, cursor: input.cursor})

  const hasMore = rows.length > limit
  const slice = hasMore ? rows.slice(0, limit) : rows

  return {
    items: slice,
    nextCursor: hasMore ? slice[slice.length - 1].createdAt : undefined,
  }
}
