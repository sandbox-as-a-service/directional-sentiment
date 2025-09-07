import {type NextRequest, NextResponse} from "next/server"
import {z} from "zod"

import {createSupabaseServerClient} from "@/app/(adapters)/(out)/supabase/server"
import {logError, toError} from "@/app/_infra/logging/console-error"

const QuerySchema = z.object({
  next: z.string().default("/"),
  code: z.string(),
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

    const code = parsed.data.code
    let next = parsed.data.next
    if (!next.startsWith("/")) {
      // if "next" is not a relative URL, use the default
      next = "/"
    }

    const supabase = await createSupabaseServerClient()
    const {error} = await supabase.auth.exchangeCodeForSession(code)

    if (error) {
      // return the user to an error page with instructions
      return NextResponse.redirect(`${req.nextUrl.origin}/error`)
    }

    const forwardedHost = req.headers.get("x-forwarded-host") // original origin before load balancer
    const isLocalEnv = process.env.NODE_ENV === "development"

    if (isLocalEnv) {
      // we can be sure that there is no load balancer in between, so no need to watch for X-Forwarded-Host
      return NextResponse.redirect(`${req.nextUrl.origin}${next}`)
    } else if (forwardedHost) {
      return NextResponse.redirect(`https://${forwardedHost}${next}`)
    } else {
      return NextResponse.redirect(`${req.nextUrl.origin}${next}`)
    }
  } catch (e) {
    const error = toError(e)
    logError(error)

    if (error.message.startsWith("supabase")) {
      return NextResponse.json({error: "service_unavailable"}, {status: 503})
    }

    return NextResponse.json({error: "internal_server_error"}, {status: 500})
  }
}
