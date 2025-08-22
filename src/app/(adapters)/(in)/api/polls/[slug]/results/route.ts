import {type NextRequest, NextResponse} from "next/server"
import z from "zod"

import {createMemoryPollsSource} from "@/app/(adapters)/(out)/memory/create-memory-polls-source"
import {createMemoryVotesSource} from "@/app/(adapters)/(out)/memory/create-memory-votes-source"
import {memoryOptions, memoryPolls} from "@/app/(adapters)/(out)/memory/fixtures/polls"
import {createSupabasePollsSource} from "@/app/(adapters)/(out)/supabase/create-supabase-polls-source"
import {createSupabaseVotesSource} from "@/app/(adapters)/(out)/supabase/create-supabase-votes-source"
import {createClient} from "@/app/(adapters)/(out)/supabase/server"
import {env} from "@/app/_config/env"
import type {PollsSource} from "@/app/_domain/ports/out/polls-source"
import type {VotesSource} from "@/app/_domain/ports/out/votes-source"
import {getPollResults} from "@/app/_domain/use-cases/polls/get-poll-results"

const ParamsSchema = z.object({slug: z.string().min(1)})

export async function GET(_req: NextRequest, ctx: RouteContext<"/api/polls/[slug]/results">) {
  try {
    const params = await ctx.params
    const parsed = ParamsSchema.safeParse(params)

    if (!parsed.success) {
      console.warn(parsed.error.issues)
      return NextResponse.json({error: "bad_request", message: parsed.error.message}, {status: 400})
    }

    let source: {polls: PollsSource; votes: VotesSource}
    if (env.USE_MEMORY === "1") {
      source = {
        polls: createMemoryPollsSource({
          polls: memoryPolls,
          input: memoryOptions,
        }),
        votes: createMemoryVotesSource(),
      }
    } else {
      const supabase = await createClient()
      source = {
        polls: createSupabasePollsSource(supabase),
        votes: createSupabaseVotesSource(supabase),
      }
    }

    const data = await getPollResults({polls: source.polls, votes: source.votes, slug: parsed.data.slug})

    console.info("🎉")
    return NextResponse.json(data, {status: 200, headers: {"Cache-Control": "no-store"}})
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e)
    const cause = e instanceof Error ? e.cause : undefined
    console.error(message, cause)

    if (message === "not_found") {
      return NextResponse.json({error: "not_found"}, {status: 404})
    }

    return NextResponse.json({error: "internal_error"}, {status: 500})
  }
}
