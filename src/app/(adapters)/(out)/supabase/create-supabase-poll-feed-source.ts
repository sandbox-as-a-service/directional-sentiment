import type {SupabaseClient} from "@supabase/supabase-js"

import type {PollFeedSource} from "@/app/_core/ports/out/poll-feed-source"

// Talks Supabase; returns the tiny shape the use case expects.
export function createSupabasePollFeedSource(sb: SupabaseClient): PollFeedSource {
  return {
    async page({limitPlusOne, cursor}) {
      let q = sb
        .from("polls")
        .select("id,created_at")
        .order("created_at", {ascending: false}) // newest first
        .limit(limitPlusOne) // ask one extra → caller detects hasNext

      if (cursor) {
        q = q.lt("created_at", cursor)
      } // keyset: strictly older than cursor

      const {data, error} = await q

      if (error) {
        throw new Error("supabase_query_failed", {cause: JSON.stringify(error)})
      }

      const rows = data ?? []
      return rows.map((r) => ({pollId: r.id, createdAt: r.created_at})) // rename here
    },
  }
}
