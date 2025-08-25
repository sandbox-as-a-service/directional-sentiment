import type {SupabaseClient} from "@supabase/supabase-js"

import type {PollFeedSource} from "@/app/_domain/ports/out/poll-feed-source"

import type {DatabaseExtended, GetPollSummariesRow} from "./types-extended"

export function createPollFeedSource(supabase: SupabaseClient<DatabaseExtended>): PollFeedSource {
  return {
    async page(input) {
      const {limit, cursor, quorum} = input

      let pagedPollsQuery = supabase
        .from("poll")
        .select("id, opened_at")
        .eq("status", "open") // not a leak — it’s the contract of this port
        .not("opened_at", "is", null) // mechanical: match index & cursor column
        .order("opened_at", {ascending: false})
        .limit(limit)

      if (cursor) {
        pagedPollsQuery = pagedPollsQuery.lt("opened_at", cursor)
      }

      const pagedPollsResponse = await pagedPollsQuery

      if (pagedPollsResponse.error) {
        throw new Error("supabase_query_failed", {cause: pagedPollsResponse.error})
      }

      if (!pagedPollsResponse.data || pagedPollsResponse.data.length === 0) {
        return []
      }

      const pollIdsInPageOrder = pagedPollsResponse.data.map((row) => row.id)

      // 2) Aggregate per-poll summaries via RPC.
      const summariesRpcResponse = await supabase.rpc("get_poll_summaries", {
        poll_ids: pollIdsInPageOrder,
        quorum_threshold: quorum,
      })

      if (summariesRpcResponse.error) {
        throw new Error("supabase_query_failed", {cause: summariesRpcResponse.error})
      }

      if (!summariesRpcResponse.data || summariesRpcResponse.data.length === 0) {
        return []
      }

      // 3) Preserve page order (avoid nullable row issue by explicit type guard)
      const summariesByPollId = new Map<string, GetPollSummariesRow>()
      for (const summaryRow of summariesRpcResponse.data) {
        summariesByPollId.set(summaryRow.poll_id, summaryRow)
      }

      // 4) Preserve page order by mapping poll IDs to RPC results
      const summariesInPageOrder: Array<GetPollSummariesRow> = []
      for (const baseRow of pagedPollsResponse.data) {
        const summary = summariesByPollId.get(baseRow.id)
        if (summary) {
          summariesInPageOrder.push(summary)
        }
      }

      // 5) Map RPC rows → domain PollFeedPageItem
      return summariesInPageOrder.map((row) => ({
        pollId: row.poll_id,
        slug: row.slug,
        question: row.question,
        status: row.status,
        category: row.category,
        openedAt: row.opened_at,
        createdAt: row.created_at,
        options: row.options,
        results: {
          total: row.vote_total,
          updatedAt: row.vote_latest_at,
          warmingUp: row.below_quorum,
          items: row.vote_breakdown,
        },
      }))
    },
  }
}
