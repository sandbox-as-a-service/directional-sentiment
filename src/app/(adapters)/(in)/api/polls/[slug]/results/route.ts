import {type NextRequest, NextResponse} from "next/server"
import z from "zod"

import {createPollsSource} from "@/app/(adapters)/(out)/supabase/create-polls-source"
import {createVotesSource} from "@/app/(adapters)/(out)/supabase/create-votes-source"
import {createSupabaseServerServiceClient} from "@/app/(adapters)/(out)/supabase/server"
import {getPollResults} from "@/app/_domain/use-cases/polls/get-poll-results"
import {logError, toError} from "@/app/_infra/logging/error"

const ParamsSchema = z.object({slug: z.string().min(1)})

export async function GET(_req: NextRequest, ctx: RouteContext<"/api/polls/[slug]/results">) {
  try {
    const params = await ctx.params
    const parsed = ParamsSchema.safeParse(params)

    if (!parsed.success) {
      const message = z.treeifyError(parsed.error).properties
      console.warn(message)
      return NextResponse.json({error: "bad_request", message}, {status: 400})
    }

    const supabase = await createSupabaseServerServiceClient()
    const source = {
      polls: createPollsSource(supabase),
      votes: createVotesSource(supabase),
    }

    const data = await getPollResults({polls: source.polls, votes: source.votes, slug: parsed.data.slug})

    console.info("🎉")
    return NextResponse.json(data, {status: 200, headers: {"Cache-Control": "no-store"}})
  } catch (e) {
    const error = toError(e)
    logError(error)

    if (error.message === "not_found") {
      return NextResponse.json({error: "not_found"}, {status: 404})
    }

    if (error.message.startsWith("supabase")) {
      return NextResponse.json({error: "service_unavailable"}, {status: 503})
    }

    return NextResponse.json({error: "internal_server_error"}, {status: 500})
  }
}
