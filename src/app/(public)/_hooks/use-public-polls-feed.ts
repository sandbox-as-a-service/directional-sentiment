import useSWR from "swr"

import type {GetPollErrorResult, GetPollFeedResult} from "@/app/_domain/ports/in/get-poll-feed"

import {fetcher} from "../_utils/fetcher"

export function usePublicPollsFeed() {
  const key = "/api/polls/feed"
  const res = useSWR<GetPollFeedResult, GetPollErrorResult>(key, fetcher)
  return res
}
