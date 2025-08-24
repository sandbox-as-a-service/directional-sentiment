import type {SupabaseClient} from "@supabase/supabase-js"

import type {PollFeedSource} from "@/app/_domain/ports/out/poll-feed-source"

import type {Database} from "./types"

// Talks Supabase; returns the tiny shape the use case expects.
export function createPollFeedSource(supabase: SupabaseClient<Database>): PollFeedSource {
  return {
    async page({limit, cursor}) {
      let query = supabase
        .from("poll")
        .select("id, created_at")
        .order("created_at", {ascending: false}) // newest first
        .order("id", {ascending: false}) // tie-breaker
        .limit(limit) // use-case already sends N+1 if needed

      if (cursor) {
        // MVP: simple keyset on timestamp only
        query = query.lt("created_at", cursor)
      }

      const {data, error} = await query

      if (error) {
        throw new Error("supabase_query_failed", {cause: error})
      }

      if (!data) {
        return []
      }

      // Adapter Pattern
      return data.map((r) => ({pollId: r.id, createdAt: r.created_at}))
    },
  }
}
