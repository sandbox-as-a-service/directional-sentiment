import {NextResponse} from "next/server"

import {createSupabaseServerClient} from "@/app/(adapters)/(out)/supabase/server"
import {logError, toError} from "@/app/_infra/logging/console-error"

export async function GET() {
  try {
    const supabase = await createSupabaseServerClient()

    const {data, error} = await supabase.auth.getUser()

    if (error) {
      console.warn("get_user_failed", error.message)
      return NextResponse.json({error: "unauthorized"}, {status: 401})
    }

    if (!data?.user) {
      console.warn("auth_user_missing")
      return NextResponse.json({error: "unauthorized"}, {status: 401})
    }

    return NextResponse.json(data.user, {status: 200, headers: {"Cache-Control": "no-store"}})
  } catch (e) {
    const error = toError(e)
    logError(error)

    return NextResponse.json({error: "internal_server_error"}, {status: 500})
  }
}
