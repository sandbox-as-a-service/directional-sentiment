export type GetPollResultsItem = {optionId: string; count: number; pct: number}
export type GetPollResultsResult = {
  items: Array<GetPollResultsItem>
  total: number
  status: "draft" | "open" | "closed"
  updatedAt: string
}
