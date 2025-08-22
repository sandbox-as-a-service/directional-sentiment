import {type NextRequest, NextResponse} from "next/server"
import {z} from "zod"

import {createMemoryPollFeedSource} from "@/app/(adapters)/(out)/memory/create-memory-poll-feed-source"
import {pollFeedFixture} from "@/app/(adapters)/(out)/memory/fixtures/poll-feed"
import {createSupabasePollFeedSource} from "@/app/(adapters)/(out)/supabase/create-supabase-poll-feed-source"
import {createClient} from "@/app/(adapters)/(out)/supabase/server"
import {env} from "@/app/_config/env"
import type {GetPollFeedInput} from "@/app/_domain/ports/in/get-poll-feed"
import type {PollFeedSource} from "@/app/_domain/ports/out/poll-feed-source"
import {getPollFeed} from "@/app/_domain/use-cases/polls/get-poll-feed"

const QuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(50).default(20),
  // require timezone to keep lexicographic order safe
  cursor: z.iso.datetime().optional(),
})

export async function GET(req: NextRequest) {
  try {
    const queries = Object.fromEntries(req.nextUrl.searchParams.entries())
    const parsed = QuerySchema.safeParse(queries)

    if (!parsed.success) {
      console.warn(parsed.error.issues)
      return NextResponse.json({error: "bad_request", message: parsed.error.message}, {status: 400})
    }

    const {limit, cursor} = parsed.data
    const input: GetPollFeedInput = {limit, cursor}

    let source: {poll: PollFeedSource}
    if (env.USE_MEMORY === "1") {
      source = {
        poll: createMemoryPollFeedSource(pollFeedFixture),
      }
    } else {
      const supabase = await createClient()
      source = {
        poll: createSupabasePollFeedSource(supabase),
      }
    }

    const data = await getPollFeed({poll: source.poll, input})

    console.info("🎉")
    return NextResponse.json(data, {status: 200, headers: {"Cache-Control": "no-store"}})
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e)
    const cause = e instanceof Error ? e.cause : undefined
    console.error(message, cause)

    return NextResponse.json({error: "internal_error"}, {status: 500})
  }
}
