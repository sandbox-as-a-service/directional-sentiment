import {type NextRequest, NextResponse} from "next/server"
import {z} from "zod"

import {createPollSummarySource} from "@/app/(adapters)/(out)/supabase/create-poll-summary-source"
import {createSupabaseServerServiceClient} from "@/app/(adapters)/(out)/supabase/server"
import {GetPollSummaryInput} from "@/app/_domain/ports/in/get-poll-summary"
import {getPollSummary} from "@/app/_domain/use-cases/polls/get-poll-summary"

const ParamsSchema = z.object({slug: z.string().min(1)})

const QuerySchema = z.object({
  quorum: z.coerce.number().optional(),
})

export async function GET(req: NextRequest, ctx: RouteContext<"/api/polls/[slug]/summary">) {
  try {
    const params = await ctx.params
    const paramsParsed = ParamsSchema.safeParse(params)
    if (!paramsParsed.success) {
      const message = z.treeifyError(paramsParsed.error).properties
      console.warn(message)
      return NextResponse.json({error: "bad_request", message}, {status: 400})
    }

    const queries = Object.fromEntries(req.nextUrl.searchParams.entries())
    const queriesParsed = QuerySchema.safeParse(queries)

    if (!queriesParsed.success) {
      const message = z.treeifyError(queriesParsed.error).properties
      console.warn(message)
      return NextResponse.json({error: "bad_request", message}, {status: 400})
    }

    const input: GetPollSummaryInput = {quorum: queriesParsed.data.quorum, slug: paramsParsed.data.slug}

    const supabase = await createSupabaseServerServiceClient()
    const source = {
      pollSummary: createPollSummarySource(supabase),
    }

    const data = await getPollSummary({pollSummary: source.pollSummary, input})

    console.info("🎉")
    return NextResponse.json(data, {status: 200, headers: {"Cache-Control": "no-store"}})
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e)
    const cause = e instanceof Error ? (e.cause ?? "") : ""
    console.error(message, cause)

    if (message === "not_found") {
      return NextResponse.json({error: "not_found"}, {status: 404})
    }

    if (message.startsWith("supabase")) {
      return NextResponse.json({error: "service_unavailable"}, {status: 503})
    }

    return NextResponse.json({error: "internal_server_error"}, {status: 500})
  }
}
