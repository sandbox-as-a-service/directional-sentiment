import useSWR from "swr"

import type {GetPollErrorResult, GetPollFeedResult} from "@/app/_domain/ports/in/get-poll-feed"

export function usePublicPollsFeed() {
  const key = "/api/polls/feed?limit=5"
  const res = useSWR<GetPollFeedResult, GetPollErrorResult>(key)
  return res
}
