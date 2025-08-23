import type {SupabaseClient} from "@supabase/supabase-js"

import type {VotesSource} from "@/app/_domain/ports/out/votes-source"

export function createSupabaseVotesSource(supabase: SupabaseClient): VotesSource {
  return {
    async append({pollId, optionId, userId, idempotencyKey}) {
      const {error} = await supabase.from("vote").insert({
        poll_id: pollId,
        option_id: optionId,
        user_id: userId,
        idempotency_key: idempotencyKey ?? null,
        // voted_at defaults to now() in DB
      })

      if (error) {
        throw new Error("supabase_insert_failed", {cause: error})
      }
    },

    async wasUsed(userId, idempotencyKey) {
      const {count, error} = await supabase
        .from("vote")
        .select("id", {count: "exact", head: true})
        .eq("user_id", userId)
        .eq("idempotency_key", idempotencyKey)
        .limit(1)

      if (error) {
        throw new Error("supabase_query_failed", {cause: error})
      }

      const hasAny = (count ?? 0) > 0

      if (hasAny) {
        return true
      }

      return false
    },

    async tallyCurrent(pollId) {
      // MVP: fetch all votes for poll → reduce latest-per-user client-side
      const {data, error} = await supabase
        .from("vote")
        .select("id, user_id, option_id, voted_at")
        .eq("poll_id", pollId)
        .order("voted_at", {ascending: false})
        .order("id", {ascending: false})

      if (error) {
        throw new Error("supabase_query_failed", {cause: error})
      }

      // Build a map of each user's *latest* vote for this poll.
      // Because the query above sorted by votedAt DESC, id DESC,
      // the first time we see a userId is their most recent vote.
      const perUser = new Map<string, {optionId: string; votedAt: string; id: string}>()

      // Iterate newest → oldest; keep only the first row per user (their current vote)
      for (const vote of data ?? []) {
        const user = vote.user_id as string // normalize type; used as the map key

        // If this user hasn't been seen yet, record this row as their latest vote
        // (due to the DESC sort, this is guaranteed to be the newest for this user)
        if (!perUser.has(user)) {
          perUser.set(user, {
            optionId: vote.option_id as string, // which option they currently support
            votedAt: vote.voted_at as string, // when they cast that latest vote
            id: vote.id as string, // tie-breaker from the sort
          })
        }

        // If we *have* seen this user already, skip:
        // later rows are older votes for the same user.
      }

      // Tally how many users currently point at each option
      const counts = new Map<string, number>()

      // Walk the "current vote" set and increment counts per option
      for (const {optionId} of perUser.values()) {
        counts.set(optionId, (counts.get(optionId) ?? 0) + 1)
      }

      // Convert the Map back to a plain array of { optionId, count }
      return Array.from(counts, ([optionId, count]) => ({optionId, count}))
    },
  }
}
