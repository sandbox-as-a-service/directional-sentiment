import {type NextRequest, NextResponse} from "next/server"
import {z} from "zod"

import {createPollsSource} from "@/app/(adapters)/(out)/supabase/create-polls-source"
import {createVotesSource} from "@/app/(adapters)/(out)/supabase/create-votes-source"
import {
  createSupabaseServerClient,
  createSupabaseServerServiceClient,
} from "@/app/(adapters)/(out)/supabase/server"
import type {CastVoteInput} from "@/app/_domain/ports/in/cast-vote"
import {castVote} from "@/app/_domain/use-cases/polls/cast-vote"
import {logError, toError} from "@/app/_infra/logging/console-error"

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
      const message = z.treeifyError(bodyParsed.error).properties
      console.warn(message)
      return NextResponse.json({error: "bad_request", message}, {status: 400})
    }

    const {data} = await (await createSupabaseServerClient()).auth.getUser()

    if (!data?.user?.id) {
      console.warn("auth_session_missing")
      return NextResponse.json({error: "unauthorized"}, {status: 401})
    }

    const supabase = await createSupabaseServerServiceClient()
    const source = {
      polls: createPollsSource(supabase),
      votes: createVotesSource(supabase),
    }

    const input: CastVoteInput = {
      userId: data.user.id,
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
    const error = toError(e)
    logError(error)

    if (error.message === "not_found") {
      return NextResponse.json({error: "not_found"}, {status: 404})
    }

    if (error.message === "poll_closed") {
      return NextResponse.json({error: "poll_closed"}, {status: 409})
    }

    if (error.message === "option_mismatch") {
      return NextResponse.json({error: "option_mismatch"}, {status: 422})
    }

    if (error.message.startsWith("supabase")) {
      return NextResponse.json({error: "service_unavailable"}, {status: 503})
    }

    return NextResponse.json({error: "internal_server_error"}, {status: 500})
  }
}
