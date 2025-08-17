// Domain DTOs (vendor-agnostic)
export type PollFeedItem = {pollId: string; createdAt: string}
export type PollFeedPage = {items: PollFeedItem[]; nextCursor?: string}

export type GetPollsFeedOptions = {limit?: number; cursor?: string}

// Port (tiny): what data the use case needs, nothing more
export interface PollFeedSource {
  page(input: {limitPlusOne: number; cursor?: string}): Promise<Array<{pollId: string; createdAt: string}>>
}

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
    items: slice.map(({pollId, createdAt}) => ({pollId, createdAt})),
    nextCursor: hasMore ? slice[slice.length - 1].createdAt : undefined,
  }
}
