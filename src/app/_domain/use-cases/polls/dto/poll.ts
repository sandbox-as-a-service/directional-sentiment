// Domain DTOs (vendor-agnostic)
export type PollFeedItem = {pollId: string; createdAt: string}

export type PollStatus = "draft" | "open" | "closed"
export type PollSummary = {pollId: string; status: PollStatus}
export type PollOptionRef = {optionId: string}
