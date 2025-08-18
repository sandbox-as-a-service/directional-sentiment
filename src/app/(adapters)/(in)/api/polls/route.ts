import {type NextRequest, NextResponse} from "next/server"
import {z} from "zod"

import {createMemoryPollFeedSource} from "@/app/(adapters)/(out)/memory/create-memory-poll-feed-source"
import {pollFeedFixture} from "@/app/(adapters)/(out)/memory/fixtures/poll-feed"
import {createSupabasePollFeedSource} from "@/app/(adapters)/(out)/supabase/create-supabase-poll-feed-source"
import {createClient} from "@/app/(adapters)/(out)/supabase/server"
import {getPollFeed} from "@/app/_core/use-cases/polls/get-poll-feed"

const QuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(50).default(20),
  // require timezone (offset: true) to keep lexicographic order safe
  cursor: z.iso.datetime().optional(),
})

function parseQuery(url: URL) {
  const raw = Object.fromEntries(url.searchParams.entries())
  const res = QuerySchema.safeParse(raw)

  if (!res.success) {
    const issues = res.error.issues.map(({path, message}) => ({
      message,
      path: path.join("."),
    }))
    return {ok: false as const, issues}
  }
  return {ok: true as const, value: res.data}
}

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url)
    const parsed = parseQuery(url)

    if (!parsed.ok) {
      return NextResponse.json({error: "bad_request", issues: parsed.issues}, {status: 400})
    }

    const {limit, cursor} = parsed.value
    const options = {limit, cursor}

    const useMemory = process.env.USE_MEMORY === "1"
    const source = useMemory
      ? createMemoryPollFeedSource(pollFeedFixture)
      : createSupabasePollFeedSource(await createClient()) // request-scoped

    const data = await getPollFeed({source, options})
    return NextResponse.json(data, {status: 200})
  } catch (e) {
    console.error(e)
    return NextResponse.json({error: "internal_error"}, {status: 500})
  }
}
