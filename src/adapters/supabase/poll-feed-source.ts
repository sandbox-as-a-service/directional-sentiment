import type {SupabaseClient} from "@supabase/supabase-js"

import type {PollFeedSource} from "@/use-cases/polls/get-polls-feed"

// Talks Supabase; returns the tiny shape the use case expects.
export function makeSupabasePollFeedSource(sb: SupabaseClient): PollFeedSource {
  type Row = {id: string; created_at: string}

  return {
    async page({limitPlusOne, cursor}) {
      let q = sb
        .from("polls")
        .select("id,created_at")
        .order("created_at", {ascending: false}) // newest first
        .order("id", {ascending: false}) // uuid tiebreaker
        .limit(limitPlusOne) // ask one extra → caller detects hasNext

      if (cursor) q = q.lt("created_at", cursor) // keyset: strictly older than cursor

      const {data, error} = (await q) as {data: Row[] | null; error: any}
      if (error) throw new Error("supabase_query_failed")

      const rows = data ?? []
      return rows.map((r) => ({pollId: r.id, createdAt: r.created_at})) // rename here
    },
  }
}
