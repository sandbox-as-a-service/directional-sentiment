import {type NextRequest, NextResponse} from "next/server"
import {inspect} from "node:util"
import {z} from "zod"

import {createClient} from "@/app/(adapters)/(out)/supabase/server"
import {env} from "@/app/_config/env"
import {castVote} from "@/app/_domain/use-cases/polls/cast-vote"
import {composeDeps} from "@/app/_infra/edge/compose-deps"

// Body validation
const BodySchema = z.object({
  optionId: z.string(),
  idempotencyKey: z.string().min(1).max(128).optional(),
})

export async function POST(req: NextRequest, ctx: RouteContext<"/api/polls/[slug]/votes">) {
  const {slug} = await ctx.params

  try {
    const body = await req.json().catch(() => ({}))
    const parsed = BodySchema.safeParse(body)
    if (!parsed.success) {
      const issues = parsed.error.issues.map(({path, message}) => ({
        path: path.join("."),
        message,
      }))
      return NextResponse.json({error: "bad_request", issues}, {status: 400})
    }

    // Auth: Supabase in prod, header for memory mode
    let userId: string | null = null
    if (env.USE_MEMORY === "1") {
      userId = req.headers.get("x-user-id") // convenient for local testing
    } else {
      const sb = await createClient()
      const {data, error} = await sb.auth.getUser()
      if (error) {
        console.warn(inspect({name: "auth_error", msg: error.message}, {depth: Infinity}))
      }
      userId = data?.user?.id ?? null
    }
    if (!userId) {
      return NextResponse.json({error: "unauthorized"}, {status: 401})
    }

    const deps = await composeDeps() // request-scoped deps (memory or supabase)
    await castVote({
      polls: deps.polls,
      votes: deps.votes,
      input: {
        slug,
        optionId: parsed.data.optionId,
        idempotencyKey: parsed.data.idempotencyKey,
        userId,
      },
    })

    return NextResponse.json(null, {status: 204})
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    if (msg === "not_found") return NextResponse.json({error: "not_found"}, {status: 404})
    if (msg === "poll_closed") return NextResponse.json({error: "poll_closed"}, {status: 409})
    if (msg === "option_mismatch") return NextResponse.json({error: "option_mismatch"}, {status: 422})

    console.error(inspect({name: "UnhandledError", msg: e}, {depth: Infinity}))
    return NextResponse.json({error: "internal_error"}, {status: 500})
  }
}
