import type {SupabaseClient} from "@supabase/supabase-js"

import type {PollSummarySource} from "@/app/_domain/ports/out/poll-summary-source"

import type {DatabaseExtended} from "./types-extended"

export function createPollSummarySource(supabase: SupabaseClient<DatabaseExtended>): PollSummarySource {
  return {
    async findBySlug(input) {
      const {quorum, slug} = input

      const pollResponse = await supabase.from("poll").select("id").eq("slug", slug).limit(1).maybeSingle()

      if (pollResponse.error) {
        throw new Error("supabase_query_failed", {cause: pollResponse.error})
      }

      if (!pollResponse.data) {
        return null
      }

      // Type narrowing: After the if (!pollResponse.data) guard,
      // TypeScript knows that pollResponse.data is not null in the remaining code
      const poll = pollResponse.data

      const summaryRpcResponse = await supabase.rpc("get_poll_summaries", {
        poll_ids: [poll.id],
        quorum_threshold: quorum,
      })

      if (summaryRpcResponse.error) {
        throw new Error("supabase_query_failed", {cause: summaryRpcResponse.error})
      }

      if (!summaryRpcResponse.data || summaryRpcResponse.data.length === 0) {
        return null
      }

      // Guard since RPCs can’t use .single(); if the function ever returns >1 row
      const row = summaryRpcResponse.data.find((row) => row.poll_id === poll.id)
      if (!row) {
        return null
      }

      return {
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
      }
    },
  }
}
