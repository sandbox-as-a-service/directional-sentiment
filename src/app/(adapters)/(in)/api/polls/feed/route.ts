import {type NextRequest, NextResponse} from "next/server"
import {z} from "zod"

import {createPollFeedSource} from "@/app/(adapters)/(out)/supabase/create-poll-feed-source"
import {createSupabaseServerServiceClient} from "@/app/(adapters)/(out)/supabase/server"
import type {GetPollFeedInput} from "@/app/_domain/ports/in/get-poll-feed"
import {getPollFeed} from "@/app/_domain/use-cases/polls/get-poll-feed"
import {logError, toError} from "@/app/_infra/logging/console-error"

const QuerySchema = z.object({
  // Pass through undefined so domain can apply its own default.
  // Keep min/max so bad values 0 or 999 get a 400 before hitting the domain.
  limit: z.coerce.number().int().min(1).max(50).optional(),
  // Require timezone to keep keyset pagination lexicographically safe.
  cursor: z.iso.datetime({offset: true}).optional(),
  quorum: z.coerce.number().min(1).optional(),
})

export async function GET(req: NextRequest) {
  try {
    const queries = Object.fromEntries(req.nextUrl.searchParams.entries())
    const parsed = QuerySchema.safeParse(queries)

    if (!parsed.success) {
      const message = z.treeifyError(parsed.error).properties
      console.warn(message)
      return NextResponse.json({error: "bad_request", message}, {status: 400})
    }

    const {limit, cursor, quorum} = parsed.data
    const input: GetPollFeedInput = {limit, cursor, quorum}

    const supabase = await createSupabaseServerServiceClient()
    const source = {
      pollFeed: createPollFeedSource(supabase),
    }

    const data = await getPollFeed({pollFeed: source.pollFeed, input})

    console.info("🎉")
    return NextResponse.json(data, {status: 200, headers: {"Cache-Control": "no-store"}})
  } catch (e) {
    const error = toError(e)
    logError(error)

    if (error.message.startsWith("supabase")) {
      return NextResponse.json({error: "service_unavailable"}, {status: 503})
    }

    return NextResponse.json({error: "internal_server_error"}, {status: 500})
  }
}
