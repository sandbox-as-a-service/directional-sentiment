import {type NextRequest, NextResponse} from "next/server"
import {inspect} from "node:util"

import {getPollResults} from "@/app/_domain/use-cases/polls/get-poll-results"
import {composeDeps} from "@/app/_infra/edge/compose-deps"

export async function GET(_req: NextRequest, ctx: RouteContext<"/api/polls/[slug]/results">) {
  const {slug} = await ctx.params
  try {
    const deps = await composeDeps()
    const data = await getPollResults({polls: deps.polls, votes: deps.votes, slug})
    return NextResponse.json(data, {status: 200})
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    if (msg === "not_found") return NextResponse.json({error: "not_found"}, {status: 404})

    console.error(inspect({name: "UnhandledError", msg: e}, {depth: Infinity}))
    return NextResponse.json({error: "internal_error"}, {status: 500})
  }
}
