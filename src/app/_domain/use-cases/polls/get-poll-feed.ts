import type {GetPollFeedOptions, GetPollFeedResult} from "@/app/_domain//ports/in/get-poll-feed"
import type {PollFeedSource} from "@/app/_domain/ports/out/poll-feed-source"

// Use case: caps limit, slices, computes nextCursor. No Supabase here.
export async function getPollFeed(args: {
  source: PollFeedSource
  options: GetPollFeedOptions
}): Promise<GetPollFeedResult> {
  const {source, options} = args
  const limit = Math.min(options.limit ?? 20, 50)
  const rows = await source.page({limit: limit + 1, cursor: options.cursor})

  const hasMore = rows.length > limit
  const slice = hasMore ? rows.slice(0, limit) : rows

  return {
    items: slice,
    nextCursor: hasMore ? slice[slice.length - 1].createdAt : undefined,
  }
}
