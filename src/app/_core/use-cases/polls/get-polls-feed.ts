import type {GetPollsFeedOptions, PollFeedPage} from "@/app/_core/entities/poll"
import type {PollFeedSource} from "@/app/_core/ports/out/poll-feed-source"

// Use case: caps limit, slices, computes nextCursor. No Supabase here.
export async function getPollsFeed(args: {
  source: PollFeedSource
  options: GetPollsFeedOptions
}): Promise<PollFeedPage> {
  const {source, options} = args
  const limit = Math.min(options.limit ?? 20, 50)
  const rows = await source.page({limitPlusOne: limit + 1, cursor: options.cursor})

  const hasMore = rows.length > limit
  const slice = hasMore ? rows.slice(0, limit) : rows

  return {
    items: slice,
    nextCursor: hasMore ? slice[slice.length - 1].createdAt : undefined,
  }
}
