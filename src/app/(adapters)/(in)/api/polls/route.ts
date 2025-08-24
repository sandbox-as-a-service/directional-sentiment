import {type NextRequest, NextResponse} from "next/server"
import {z} from "zod"

import {createPollFeedSource} from "@/app/(adapters)/(out)/supabase/create-supabase-poll-feed-source"
import {createSupabaseServerServiceClient} from "@/app/(adapters)/(out)/supabase/server"
import type {GetPollFeedInput} from "@/app/_domain/ports/in/get-poll-feed"
import {getPollFeed} from "@/app/_domain/use-cases/polls/get-poll-feed"

const QuerySchema = z.object({
  // Pass through undefined so domain can apply its own default.
  // Keep min/max so bad values 0 or 999 get a 400 before hitting the domain.
  limit: z.coerce.number().int().min(1).max(50).optional(),
  // Require timezone to keep keyset pagination lexicographically safe.
  // ISO datetime helper; default disallows offsets, accepts "Z"
  cursor: z.iso.datetime().optional(),
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

    const {limit, cursor} = parsed.data
    const input: GetPollFeedInput = {limit, cursor}

    const supabase = await createSupabaseServerServiceClient()
    const source = {
      poll: createPollFeedSource(supabase),
    }

    const data = await getPollFeed({poll: source.poll, input})

    console.info("🎉")
    return NextResponse.json(data, {status: 200, headers: {"Cache-Control": "no-store"}})
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e)
    const cause = e instanceof Error ? (e.cause ?? "") : ""
    console.error(message, cause)

    if (message.startsWith("supabase")) {
      return NextResponse.json({error: "service_unavailable"}, {status: 503})
    }

    return NextResponse.json({error: "internal_server_error"}, {status: 500})
  }
}
