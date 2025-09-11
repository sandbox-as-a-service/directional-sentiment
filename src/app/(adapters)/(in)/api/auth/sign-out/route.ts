import {type NextRequest, NextResponse} from "next/server"

import {createSupabaseServerClient} from "@/app/(adapters)/(out)/supabase/server"
import {logError, toError} from "@/app/_infra/logging/console-error"

export async function POST(req: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient()

    const {error} = await supabase.auth.signOut()

    if (error) {
      logError(error)
      return NextResponse.redirect(new URL("/error", req.nextUrl.origin))
    }

    return NextResponse.redirect(new URL("/", req.nextUrl.origin))
  } catch (e) {
    const error = toError(e)
    logError(error)

    if (error.message.startsWith("supabase")) {
      return NextResponse.json({error: "service_unavailable"}, {status: 503})
    }

    return NextResponse.json({error: "internal_server_error"}, {status: 500})
  }
}
