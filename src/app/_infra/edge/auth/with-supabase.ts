import {createServerClient} from "@supabase/ssr"
import {type NextRequest, NextResponse} from "next/server"

import {env} from "@/app/_config/env"
import type {Middleware} from "@/app/_infra/edge/compose"

export const withSupabase: Middleware = async (req: NextRequest, res: NextResponse) => {
  // carry forward anything earlier middlewares already set
  let out = res

  try {
    const supabase = createServerClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
      cookies: {
        // Supabase reads cookies from the incoming request
        getAll() {
          return req.cookies.getAll()
        },
        // Supabase asks us to write updates here
        setAll(cookiesToSet) {
          // 1) guide pattern: write to the *request* cookies
          cookiesToSet.forEach(({name, value}) => req.cookies.set(name, value))

          // 2) rebuild a fresh pass-through response bound to this request
          const next = NextResponse.next({request: req})

          // 3) PRESERVE earlier middleware cookies
          out.cookies.getAll().forEach(({name, value}) => next.cookies.set(name, value))

          // 4) mirror Supabase-updated cookies onto the response (guide-style)
          cookiesToSet.forEach(({name, value, options}) => next.cookies.set(name, value, options))

          // 5) hand forward
          out = next
        },
      },
    })

    // Per Supabase guidance: call immediately after client creation refreshing the auth token
    const {error} = await supabase.auth.getUser()

    if (error) {
      // The user should still be able to access public resources
    }

    // no redirect/deny here → pass-through (status 200), composer keeps going
    return out
  } catch (e) {
    // fail-closed: if Supabase throws, break requests
    const message = e instanceof Error ? e.message : String(e)
    console.error(message)

    return NextResponse.json({message: "service_unavailable"}, {status: 503})
  }
}
