import {createServerClient} from "@supabase/ssr"
import {createClient} from "@supabase/supabase-js"
import {cookies} from "next/headers"

import {env} from "@/app/_config/env"

import {DatabaseExtended} from "./types-extended"

// Use for supabase.auth calls
export async function createSupabaseServerClient() {
  const cookieStore = await cookies()

  return createServerClient<DatabaseExtended>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({name, value, options}) => cookieStore.set(name, value, options))
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    },
  )
}

// Use for supabase read and write calls excluding auth
export async function createSupabaseServerServiceClient() {
  return createClient<DatabaseExtended>(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: {persistSession: false, autoRefreshToken: false},
  })
}
