import {type NextRequest, NextResponse} from "next/server"
import {z} from "zod"

import {createSupabaseServerClient} from "@/app/(adapters)/(out)/supabase/server"
import {env} from "@/app/_config/env"
import {logError, toError} from "@/app/_infra/logging/console-error"

import {checkGitHubAccount} from "./check-github-account"

const QuerySchema = z.object({
  code: z.string().min(1),
  next: z.string().default("/"),
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
    const {error, data} = await supabase.auth.exchangeCodeForSession(code)

    if (error) {
      logError(error)
      // return the user to an error page with instructions
      return NextResponse.redirect(new URL("/error", req.nextUrl.origin))
    }

    // Check account quality BEFORE completing sign-in
    const isQualityAccount = await checkGitHubAccount(data.user)

    if (!isQualityAccount) {
      // Sign them out immediately
      await supabase.auth.signOut()
      // Redirect to specific GitHub account error page
      return NextResponse.redirect(new URL("/error/sign-in/github", req.nextUrl.origin))
    }

    const forwardedHost = req.headers.get("x-forwarded-host") // original origin before load balancer

    if (env.IS_DEV) {
      // we can be sure that there is no load balancer in between, so no need to watch for X-Forwarded-Host
      return NextResponse.redirect(new URL(next, req.nextUrl.origin))
    } else if (forwardedHost) {
      return NextResponse.redirect(new URL(next, `https://${forwardedHost}`))
    } else {
      return NextResponse.redirect(new URL(next, req.nextUrl.origin))
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
