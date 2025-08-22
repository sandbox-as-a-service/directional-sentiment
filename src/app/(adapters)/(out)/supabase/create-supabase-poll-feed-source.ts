import type {SupabaseClient} from "@supabase/supabase-js"

import type {PollFeedSource} from "@/app/_domain/ports/out/poll-feed-source"

// Talks Supabase; returns the tiny shape the use case expects.
export function createSupabasePollFeedSource(supabase: SupabaseClient): PollFeedSource {
  return {
    async page({limit, cursor}) {
      let query = supabase
        .from("polls")
        .select("id,created_at")
        .order("created_at", {ascending: false}) // newest first
        .limit(limit) // ask one extra → caller detects hasNext

      if (cursor) {
        query = query.lt("created_at", cursor)
      } // keyset: strictly older than cursor

      const {data, error} = await query

      if (error) {
        throw new Error("supabase_query_failed", {cause: error})
      }

      if (!data) {
        return []
      }

      // Adapter Pattern
      return data.map((r) => ({pollId: r.id as string, createdAt: r.created_at as string}))
    },
  }
}
