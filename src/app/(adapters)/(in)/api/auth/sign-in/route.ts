import {type NextRequest, NextResponse} from "next/server"
import {z} from "zod"

import {createSupabaseServerClient} from "@/app/(adapters)/(out)/supabase/server"
import {logError, toError} from "@/app/_infra/logging/console-error"

const QuerySchema = z.object({
  provider: z.literal("github").default("github"),
})

export async function GET(req: NextRequest) {
  try {
    const queries = Object.fromEntries(req.nextUrl.searchParams.entries())
    const parsed = QuerySchema.safeParse(queries)

    if (!parsed.success) {
      const message = z.treeifyError(parsed.error).properties
      console.warn(message)
      return NextResponse.json({error: "bad_request"}, {status: 400})
    }

    const supabase = await createSupabaseServerClient()

    const {data, error} = await supabase.auth.signInWithOAuth({
      provider: parsed.data.provider,
      options: {
        redirectTo: `${req.nextUrl.origin}/api/auth/callback?next=/`,
      },
    })

    if (error) {
      return NextResponse.redirect(`${req.nextUrl.origin}/error`)
    }

    return NextResponse.redirect(data.url)
  } catch (e) {
    const error = toError(e)
    logError(error)

    if (error.message.startsWith("supabase")) {
      return NextResponse.json({error: "service_unavailable"}, {status: 503})
    }

    return NextResponse.json({error: "internal_server_error"}, {status: 500})
  }
}
