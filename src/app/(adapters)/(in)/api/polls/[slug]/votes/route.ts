import {type NextRequest, NextResponse} from "next/server"
import {z} from "zod"

import {composeMemorySource} from "@/app/(adapters)/(out)/memory/compose-memory-sources"
import {createSupabasePollsSource} from "@/app/(adapters)/(out)/supabase/create-supabase-polls-source"
import {createSupabaseVotesSource} from "@/app/(adapters)/(out)/supabase/create-supabase-votes-source"
import {createClient} from "@/app/(adapters)/(out)/supabase/server"
import {env} from "@/app/_config/env"
import type {CastVoteInput} from "@/app/_domain/ports/in/cast-vote"
import type {PollsSource} from "@/app/_domain/ports/out/polls-source"
import type {VotesSource} from "@/app/_domain/ports/out/votes-source"
import {castVote} from "@/app/_domain/use-cases/polls/cast-vote"

const ParamsSchema = z.object({slug: z.string().min(1)})

const BodySchema = z.object({
  optionId: z.string(),
  idempotencyKey: z.string().min(1).max(128).optional(),
})

export async function POST(req: NextRequest, ctx: RouteContext<"/api/polls/[slug]/votes">) {
  try {
    const params = await ctx.params
    const paramsParsed = ParamsSchema.safeParse(params)
    if (!paramsParsed.success) {
      const message = z.treeifyError(paramsParsed.error).properties
      console.warn(message)
      return NextResponse.json({error: "bad_request", message}, {status: 400})
    }

    const body = await req.json()
    const bodyParsed = BodySchema.safeParse(body)
    if (!bodyParsed.success) {
      console.warn(bodyParsed.error.issues)
      return NextResponse.json(
        {error: "bad_request", message: z.treeifyError(bodyParsed.error).properties},
        {status: 400},
      )
    }

    let userId: string | null = null
    let source: {polls: PollsSource; votes: VotesSource}

    if (env.USE_MEMORY === "1") {
      userId = req.headers.get("x-user-id")
      source = composeMemorySource()
    } else {
      const supabase = await createClient()
      const {data, error} = await supabase.auth.getUser()
      if (error) {
        console.warn(error.message, error.cause)
      }
      userId = data?.user?.id ?? null
      source = {
        polls: createSupabasePollsSource(supabase),
        votes: createSupabaseVotesSource(supabase),
      }
    }

    if (!userId) {
      return NextResponse.json({error: "unauthorized"}, {status: 401})
    }

    const input: CastVoteInput = {
      userId,
      slug: paramsParsed.data.slug,
      optionId: bodyParsed.data.optionId,
      idempotencyKey: bodyParsed.data.idempotencyKey,
    }

    await castVote({
      input,
      polls: source.polls,
      votes: source.votes,
    })

    console.info("🎉")
    return new NextResponse(null, {status: 204})
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e)
    const cause = e instanceof Error ? e.cause : undefined
    console.error(message, cause ?? "")

    if (message === "not_found") {
      return NextResponse.json({error: "not_found"}, {status: 404})
    }

    if (message === "poll_closed") {
      return NextResponse.json({error: "poll_closed"}, {status: 409})
    }

    if (message === "option_mismatch") {
      return NextResponse.json({error: "option_mismatch"}, {status: 422})
    }

    if (message.startsWith("supabase")) {
      return NextResponse.json({error: "service_unavailable"}, {status: 503})
    }

    return NextResponse.json({error: "internal_server_error"}, {status: 500})
  }
}
