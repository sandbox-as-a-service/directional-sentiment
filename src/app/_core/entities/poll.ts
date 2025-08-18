// Domain DTOs (vendor-agnostic)
export type PollFeedItem = {pollId: string; createdAt: string}
export type PollFeedPage = {items: PollFeedItem[]; nextCursor?: string}

export type GetPollsFeedOptions = {limit?: number; cursor?: string}
