import type {SupabaseClient} from "@supabase/supabase-js"

import type {PollsSource} from "@/app/_domain/ports/out/polls-source"

import type {DatabaseExtended} from "./types-extended"

export function createPollsSource(supabase: SupabaseClient<DatabaseExtended>): PollsSource {
  return {
    async findBySlug(slug) {
      const {data, error} = await supabase
        .from("poll")
        .select("id, status")
        .eq("slug", slug)
        .limit(1)
        .maybeSingle()

      if (error) {
        throw new Error("supabase_query_failed", {cause: error})
      }

      if (!data) {
        return null
      }

      // Adapter Pattern
      return {
        pollId: data.id,
        status: data.status,
      }
    },

    async listOptions(pollId) {
      const {data, error} = await supabase.from("poll_option").select("id, label").eq("poll_id", pollId)

      if (error) {
        throw new Error("supabase_query_failed", {cause: error})
      }

      if (!data) {
        return []
      }

      // Adapter Pattern
      return data.map((r) => ({optionId: r.id, label: r.label}))
    },
  }
}
