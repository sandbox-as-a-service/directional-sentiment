import {createBrowserClient} from "@supabase/ssr"

import {env} from "@/app/_config/env"

import type {DatabaseExtended} from "./types-extended"

export function createSupabaseBrowserClient() {
  return createBrowserClient<DatabaseExtended>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  )
}
