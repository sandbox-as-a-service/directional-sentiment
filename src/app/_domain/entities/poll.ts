// Domain DTOs (vendor-agnostic)
export type PollFeedItem = {pollId: string; createdAt: string}
export type PollFeedPage = {items: PollFeedItem[]; nextCursor?: string}

export type GetPollFeedOptions = {limit?: number; cursor?: string}
