import useSWR from "swr"

import type {GitHubUser} from "@/app/(adapters)/(out)/supabase/types-extended"

export function useGetUser() {
  const key = "/api/auth/user"
  const res = useSWR<GitHubUser>(key, {
    shouldRetryOnError: false,
  })
  return res
}
