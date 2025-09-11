import type {User} from "@supabase/supabase-js"
import useSWR from "swr"

import {fetcher} from "../_utils/fetcher"

export function useGetUser() {
  const key = "/api/auth/user"
  const res = useSWR<User>(key, fetcher, {
    shouldRetryOnError: false,
  })
  return res
}
