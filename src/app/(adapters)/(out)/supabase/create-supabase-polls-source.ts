import type {SupabaseClient} from "@supabase/supabase-js"

import type {PollsSource} from "@/app/_domain/ports/out/polls-source"
import type {PollOption, PollStatus} from "@/app/_domain/use-cases/polls/dto/poll"

// MVP-friendly: we compute “latest per user” in the adapter by pulling votes for a poll and reducing in memory.
// Later, flip to a Postgres view/materialized view and change only this file.
export function createSupabasePollsSource(sb: SupabaseClient): PollsSource {
  return {
    async findBySlug(slug) {
      const {data, error} = await sb.from("poll").select("id, status").eq("slug", slug).limit(1).maybeSingle()

      if (error) throw new Error("supabase_query_failed:poll", {cause: error})
      if (!data) return null

      return {
        pollId: data.id as string,
        status: data.status as PollStatus,
      }
    },

    async listOptions(pollId) {
      const {data, error} = await sb.from("poll_option").select("id").eq("pollId", pollId)

      if (error) throw new Error("supabase_query_failed:options", {cause: error})

      return (data ?? []).map<PollOption>((r) => ({optionId: r.id as string}))
    },
  }
}
