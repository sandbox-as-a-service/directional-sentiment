import type {SupabaseClient} from "@supabase/supabase-js"

import type {PollFeedPageInput, PollFeedSource} from "@/app/_domain/ports/out/poll-feed-source"
import type {PollFeedItem} from "@/app/_domain/use-cases/polls/dto/poll"

import type {DatabaseExtended} from "./types-extended"

// Talks Supabase; returns card-ready items by calling the DB RPC for the current page.
export function createPollFeedSource(supabase: SupabaseClient<DatabaseExtended>): PollFeedSource {
  return {
    async page({limit, cursor, quorum}: PollFeedPageInput): Promise<PollFeedItem[]> {
      // 1) Page poll ids (use-case already applies N+1)
      let pageQuery = supabase
        .from("poll")
        .select("id, created_at")
        .order("created_at", {ascending: false})
        .order("id", {ascending: false})
        .limit(limit)

      if (cursor) {
        pageQuery = pageQuery.lt("created_at", cursor)
      }

      const {data: pageRows, error: pageError} = await pageQuery

      if (pageError) {
        throw new Error("supabase_query_failed", {cause: pageError})
      }

      if (!pageRows || pageRows.length === 0) {
        return []
      }

      const pollIds = pageRows.map((r) => r.id)

      // 2) Project card-ready rows via RPC
      const {data: rpcRows, error: rpcError} = await supabase.rpc("get_poll_cards", {
        p_poll_ids: pollIds,
        p_quorum: quorum,
      })

      if (rpcError) {
        throw new Error("supabase_rpc_failed", {cause: rpcError})
      }

      if (!rpcRows || rpcRows.length === 0) {
        return []
      }

      type RpcRow = DatabaseExtended["public"]["Functions"]["get_poll_cards"]["Returns"][number]

      // 3) Preserve page order (avoid nullable row issue by explicit type guard)
      const rpcResultsById = new Map<string, RpcRow>()
      for (const rpcRow of rpcRows) {
        rpcResultsById.set(rpcRow.poll_id, rpcRow)
      }

      // 3) Preserve page order by mapping poll IDs to RPC results
      const ordered: RpcRow[] = []
      for (const pageRow of pageRows) {
        const rpcResult = rpcResultsById.get(pageRow.id)
        if (rpcResult) {
          ordered.push(rpcResult)
        }
      }

      // 4) Map RPC rows → domain PollFeedItem (cast Json fields to the exact shapes our DTO expects)
      return ordered.map((row) => ({
        pollId: row.poll_id,
        slug: row.slug,
        question: row.question,
        status: row.status,
        category: row.category, // DTO allows string | null; assign is safe
        openedAt: row.opened_at, // DTO allows string | null; assign is safe
        createdAt: row.created_at,
        // RPC emits JSON arrays with these exact keys; cast once and pass through.
        options: row.options,
        results: {
          total: Number(row.results_total ?? 0),
          updatedAt: row.results_updated_at,
          warmingUp: row.results_warming_up,
          // RPC emits JSON arrays with these exact keys; cast once and pass through.
          items: row.results_items,
        },
      }))
    },
  }
}
