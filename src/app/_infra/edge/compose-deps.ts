import {createMemoryPollsSource} from "@/app/(adapters)/(out)/memory/create-memory-polls-source"
import {createMemoryVotesPort} from "@/app/(adapters)/(out)/memory/create-memory-votes-source"
import {memoryOptions, memoryPolls} from "@/app/(adapters)/(out)/memory/fixtures/polls"
import {createSupabasePollsSource} from "@/app/(adapters)/(out)/supabase/create-supabase-polls-source"
import {createSupabaseVotesPort} from "@/app/(adapters)/(out)/supabase/create-supabase-votes-source"
import {createClient} from "@/app/(adapters)/(out)/supabase/server"
import {env} from "@/app/_config/env"

export async function composeDeps() {
  if (env.USE_MEMORY === "1") {
    return {
      polls: createMemoryPollsSource({
        polls: memoryPolls,
        options: memoryOptions.map(({optionId, pollId}) => ({optionId, pollId})),
      }),
      votes: createMemoryVotesPort(),
    }
  }

  const sb = await createClient()
  return {
    polls: createSupabasePollsSource(sb),
    votes: createSupabaseVotesPort(sb),
  }
}
