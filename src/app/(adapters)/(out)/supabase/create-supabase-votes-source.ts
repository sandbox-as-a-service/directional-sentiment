import type {SupabaseClient} from "@supabase/supabase-js"

import type {VotesPort} from "@/app/_domain/ports/out/votes-source"

export function createSupabaseVotesPort(sb: SupabaseClient): VotesPort {
  return {
    async append({pollId, optionId, userId, idempotencyKey}) {
      const {error} = await sb.from("vote").insert({
        pollId,
        optionId,
        userId,
        idempotencyKey: idempotencyKey ?? null,
        // votedAt is default now() in DB
      })
      if (error) throw new Error("supabase_insert_failed:vote", {cause: error})
    },

    async wasUsed(userId, idempotencyKey) {
      const {data, error} = await sb
        .from("vote")
        .select("id", {count: "exact", head: true})
        .eq("userId", userId)
        .eq("idempotencyKey", idempotencyKey)
        .limit(1)

      if (error) throw new Error("supabase_query_failed:idempotency", {cause: error})
      return (data?.length ?? 0) > 0
    },

    async tallyCurrent(pollId) {
      // MVP: fetch all votes for poll, reduce latest-per-user client-side
      const {data, error} = await sb
        .from("vote")
        .select("id, userId, optionId, votedAt")
        .eq("pollId", pollId)
        .order("votedAt", {ascending: false})
        .order("id", {ascending: false})

      if (error) throw new Error("supabase_query_failed:tally", {cause: error})

      const perUser = new Map<string, {optionId: string; votedAt: string; id: string}>()
      for (const v of data ?? []) {
        const k = v.userId as string
        if (!perUser.has(k)) {
          perUser.set(k, {optionId: v.optionId as string, votedAt: v.votedAt as string, id: v.id as string})
        }
      }
      const counts = new Map<string, number>()
      for (const {optionId} of perUser.values()) counts.set(optionId, (counts.get(optionId) ?? 0) + 1)
      return [...counts.entries()].map(([optionId, count]) => ({optionId, count}))
    },
  }
}
