// Domain DTOs (vendor-agnostic)
export type PollFeedItem = {pollId: string; createdAt: string}
export type PollResultsItem = {optionId: string; count: number; pct: number}

export type PollStatus = "draft" | "open" | "closed"
export type PollSummary = {pollId: string; status: PollStatus}
export type PollOption = {optionId: string}
