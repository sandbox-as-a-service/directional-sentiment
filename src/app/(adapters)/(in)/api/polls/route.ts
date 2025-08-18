import {type NextRequest, NextResponse} from "next/server"

import {createMemoryPollFeedSource} from "@/app/(adapters)/(out)/memory/create-memory-poll-feed-source"
import {pollFeedFixture} from "@/app/(adapters)/(out)/memory/fixtures/poll-feed"
import {createSupabasePollFeedSource} from "@/app/(adapters)/(out)/supabase/create-supabase-poll-feed-source"
import {createClient} from "@/app/(adapters)/(out)/supabase/server"
import {getPollFeed} from "@/app/_core/use-cases/polls/get-poll-feed"

export async function GET(req: NextRequest) {
  try {
    const useMemory = process.env.USE_MEMORY === "1"

    const source = useMemory
      ? createMemoryPollFeedSource(pollFeedFixture)
      : createSupabasePollFeedSource(await createClient()) // request-scoped (auth/cookies)

    const url = new URL(req.url)
    const limit = Number(url.searchParams.get("limit") ?? 20)
    const cursor = url.searchParams.get("cursor") ?? undefined
    const options = {limit, cursor}

    const data = await getPollFeed({source, options})
    return NextResponse.json(data, {status: 200})
  } catch (e) {
    console.error(e)
    return NextResponse.json({error: "internal_error"}, {status: 500})
  }
}
