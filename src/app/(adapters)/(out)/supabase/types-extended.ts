import type {Database} from "./types"

/** Row shape that JSON RPC actually returns (camelCase arrays). */
export type GetPollCardsRow = {
  poll_id: string
  slug: string
  question: string
  status: Database["public"]["Enums"]["poll_status"]
  category: string | null
  opened_at: string | null
  created_at: string
  options: {optionId: string; label: string}[]
  results_total: number
  results_updated_at: string | null
  results_warming_up: boolean
  results_items: {optionId: string; label: string; count: number; pct: number}[]
}

/** Override just the RPC signature while keeping the rest of the generated types. */
export type DatabaseExtended = Omit<Database, "public"> & {
  public: Omit<Database["public"], "Functions"> & {
    Functions: Omit<Database["public"]["Functions"], "get_poll_cards"> & {
      get_poll_cards: {
        Args: {p_poll_ids: string[]; p_quorum: number}
        Returns: GetPollCardsRow[]
      }
    }
  }
}
