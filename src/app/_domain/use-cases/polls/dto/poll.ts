// Domain DTOs. Vendor-agnostic!
export type PollStatus = "draft" | "open" | "closed"
export type PollSummary = {pollId: string; status: PollStatus}
export type PollOptionItem = {optionId: string; label: string}

export type PollResultsItem = {optionId: string; label: string; count: number; pct: number}
export type PollFeedPageItem = {
  pollId: string
  slug: string
  question: string
  status: PollStatus
  category: string | null
  openedAt: string | null
  createdAt: string
  options: Array<PollOptionItem>
  results: {
    total: number
    updatedAt: string | null
    warmingUp: boolean
    items: Array<PollResultsItem>
  }
}
