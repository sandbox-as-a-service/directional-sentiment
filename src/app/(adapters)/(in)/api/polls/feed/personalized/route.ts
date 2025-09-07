import {type NextRequest, NextResponse} from "next/server"
import {z} from "zod"

import {createPollFeedSource} from "@/app/(adapters)/(out)/supabase/create-poll-feed-source"
import {createVotesSource} from "@/app/(adapters)/(out)/supabase/create-votes-source"
import {
  createSupabaseServerClient,
  createSupabaseServerServiceClient,
} from "@/app/(adapters)/(out)/supabase/server"
import {POLLS} from "@/app/_domain/config/polls"
import type {
  GetPersonalizedPollFeedError,
  GetPersonalizedPollFeedInput,
  GetPersonalizedPollFeedResult,
} from "@/app/_domain/ports/in/get-personalized-poll-feed"
import {getPersonalizedPollFeed} from "@/app/_domain/use-cases/polls/get-personalized-poll-feed"
import {logError, toError} from "@/app/_infra/logging/console-error"

const QuerySchema = z.object({
  // Pass through undefined so domain can apply its own default.
  // Keep min/max so bad values 0 or 999 get a 400 before hitting the domain.
  limit: z.coerce.number().int().min(1).max(POLLS.FEED_MAX_LIMIT).optional(),
  // Require timezone to keep keyset pagination lexicographically safe.
  cursor: z.iso.datetime({offset: true}).optional(),
  quorum: z.coerce.number().optional(),
})

export async function GET(
  req: NextRequest,
): Promise<NextResponse<GetPersonalizedPollFeedError | GetPersonalizedPollFeedResult>> {
  try {
    const queries = Object.fromEntries(req.nextUrl.searchParams.entries())
    const parsed = QuerySchema.safeParse(queries)

    if (!parsed.success) {
      const message = z.treeifyError(parsed.error).properties
      console.warn(message)
      return NextResponse.json({error: "bad_request", message}, {status: 400})
    }

    const {data} = await (await createSupabaseServerClient()).auth.getUser()

    if (!data?.user?.id) {
      console.warn("auth_session_missing")
      return NextResponse.json({error: "unauthorized"}, {status: 401})
    }

    const {limit, cursor, quorum} = parsed.data
    const input: GetPersonalizedPollFeedInput = {limit, cursor, quorum, userId: data.user.id}

    const supabase = await createSupabaseServerServiceClient()
    const source = {
      pollFeed: createPollFeedSource(supabase),
      votes: createVotesSource(supabase),
    }

    const dto = await getPersonalizedPollFeed({pollFeed: source.pollFeed, votes: source.votes, input})
    console.info("🎉")
    return NextResponse.json(dto, {status: 200, headers: {"Cache-Control": "no-store"}})
  } catch (e) {
    const error = toError(e)
    logError(error)

    if (error.message.startsWith("supabase")) {
      return NextResponse.json({error: "service_unavailable"}, {status: 503})
    }

    return NextResponse.json({error: "internal_server_error"}, {status: 500})
  }
}
