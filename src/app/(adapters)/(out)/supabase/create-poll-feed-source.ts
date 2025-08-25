import type {SupabaseClient} from "@supabase/supabase-js"

import type {PollFeedSource, PollFeedSourcePageInput} from "@/app/_domain/ports/out/poll-feed-source"
import type {PollFeedPageItem} from "@/app/_domain/use-cases/polls/dto/poll"

import type {DatabaseExtended, GetPollCardsRow} from "./types-extended"

export function createPollFeedSource(supabase: SupabaseClient<DatabaseExtended>): PollFeedSource {
  return {
    async page(input: PollFeedSourcePageInput): Promise<PollFeedPageItem[]> {
      const {limit, cursor, quorum} = input

      let pageQuery = supabase
        .from("poll")
        .select("id, created_at")
        .order("created_at", {ascending: false})
        .order("id", {ascending: false})
        .limit(limit)

      if (cursor) {
        pageQuery = pageQuery.lt("created_at", cursor)
      }

      const pageQueryResult = await pageQuery

      if (pageQueryResult.error) {
        throw new Error("supabase_query_failed", {cause: pageQueryResult.error})
      }

      if (!pageQueryResult.data || pageQueryResult.data.length === 0) {
        return []
      }

      const pollIds = pageQueryResult.data.map((row) => row.id)

      const aggregatedPageQueryResult = await supabase.rpc("get_poll_cards", {
        p_poll_ids: pollIds,
        p_quorum: quorum,
      })

      if (aggregatedPageQueryResult.error) {
        throw new Error("supabase_rpc_failed", {cause: aggregatedPageQueryResult.error})
      }

      if (!aggregatedPageQueryResult.data || aggregatedPageQueryResult.data.length === 0) {
        return []
      }

      // 3) Preserve page order (avoid nullable row issue by explicit type guard)
      const aggregatedPageResultsById = new Map<string, GetPollCardsRow>()
      for (const row of aggregatedPageQueryResult.data) {
        aggregatedPageResultsById.set(row.poll_id, row)
      }

      // 3) Preserve page order by mapping poll IDs to RPC results
      const ordered: Array<GetPollCardsRow> = []
      for (const row of pageQueryResult.data) {
        const result = aggregatedPageResultsById.get(row.id)
        if (result) {
          ordered.push(result)
        }
      }

      // 4) Map RPC rows → domain PollFeedPageItem
      return ordered.map((row) => ({
        pollId: row.poll_id,
        slug: row.slug,
        question: row.question,
        status: row.status,
        category: row.category,
        openedAt: row.opened_at,
        createdAt: row.created_at,
        options: row.options,
        results: {
          total: row.results_total,
          updatedAt: row.results_updated_at,
          warmingUp: row.results_warming_up,
          items: row.results_items,
        },
      }))
    },
  }
}
