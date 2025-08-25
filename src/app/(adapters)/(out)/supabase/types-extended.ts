import type {Database} from "./types"

export type PollOptionDTO = {optionId: string; label: string}
export type VoteBreakdownItemDTO = {optionId: string; label: string; count: number; pct: number}

export type GetPollSummariesRow = {
  poll_id: string
  slug: string
  question: string
  status: Database["public"]["Enums"]["poll_status"]
  category: string | null
  opened_at: string | null
  created_at: string
  options: PollOptionDTO[]
  vote_total: number
  vote_latest_at: string | null
  below_quorum: boolean
  vote_breakdown: VoteBreakdownItemDTO[]
}

// Override just the RPC signature while keeping the rest of the generated types.
export type DatabaseExtended = Omit<Database, "public"> & {
  public: Omit<Database["public"], "Functions"> & {
    Functions: Omit<Database["public"]["Functions"], "get_poll_summaries"> & {
      get_poll_summaries: {
        Args: {poll_ids: string[]; quorum_threshold: number}
        Returns: Array<GetPollSummariesRow>
      }
    }
  }
}
