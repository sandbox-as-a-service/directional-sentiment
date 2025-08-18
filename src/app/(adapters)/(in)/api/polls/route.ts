import {type NextRequest, NextResponse} from "next/server"

import {createPollFeedSource} from "@/app/(adapters)/(out)/supabase/create-poll-feed-source"
import {createClient} from "@/app/(adapters)/(out)/supabase/server"
import {getPollsFeed} from "@/app/_core/use-cases/polls/get-polls-feed"

export async function GET(req: NextRequest) {
  try {
    const sb = await createClient() // request-scoped (auth/cookies)
    const source = createPollFeedSource(sb) // adapter does id → pollId

    const url = new URL(req.url)
    const limit = Number(url.searchParams.get("limit") ?? 20)
    const cursor = url.searchParams.get("cursor") ?? undefined
    const options = {limit, cursor}

    const data = await getPollsFeed({source, options})
    return NextResponse.json(data, {status: 200})
  } catch (e) {
    console.error(e)
    return NextResponse.json({error: "internal_error"}, {status: 500})
  }
}
