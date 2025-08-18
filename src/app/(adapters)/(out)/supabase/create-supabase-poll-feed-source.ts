import type {SupabaseClient} from "@supabase/supabase-js"

import type {PollFeedSource} from "@/app/_domain/ports/out/poll-feed-source"

// Talks Supabase; returns the tiny shape the use case expects.
export function createSupabasePollFeedSource(sb: SupabaseClient): PollFeedSource {
  return {
    async page({limit, cursor}) {
      let q = sb
        .from("polls")
        .select("id,created_at")
        .order("created_at", {ascending: false}) // newest first
        .limit(limit) // ask one extra → caller detects hasNext

      if (cursor) {
        q = q.lt("created_at", cursor)
      } // keyset: strictly older than cursor

      const {data, error} = await q

      if (error) {
        throw new Error("supabase_query_failed", {cause: error})
      }

      const rows = data ?? []
      return rows.map((r) => ({pollId: r.id, createdAt: r.created_at})) // rename here
    },
  }
}
