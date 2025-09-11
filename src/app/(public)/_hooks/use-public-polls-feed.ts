import useSWR from "swr"

import type {
  GetPersonalizedPollFeedError,
  GetPersonalizedPollFeedResult,
} from "@/app/_domain/ports/in/get-personalized-poll-feed"
import type {GetPollErrorResult, GetPollFeedResult} from "@/app/_domain/ports/in/get-poll-feed"

import {useGetUser} from "./use-get-user"

export function usePersonalizedPollsFeed(shouldFetch = true) {
  const key = "/api/polls/feed/personalized?limit=10"
  const res = useSWR<GetPersonalizedPollFeedResult, GetPersonalizedPollFeedError>(shouldFetch ? key : null)
  return res
}

export function usePublicPollsFeed(shouldFetch = true) {
  const key = "/api/polls/feed?limit=10"
  const res = useSWR<GetPollFeedResult, GetPollErrorResult>(shouldFetch ? key : null)
  return res
}

export function usePollsFeed() {
  const {data, isLoading} = useGetUser()

  const shouldUsePersonalized = Boolean(data)
  const personalizedFeed = usePersonalizedPollsFeed(!isLoading && shouldUsePersonalized)
  const publicFeed = usePublicPollsFeed(!isLoading && !shouldUsePersonalized)

  if (shouldUsePersonalized) {
    return {
      ...personalizedFeed,
      data: personalizedFeed.data as GetPersonalizedPollFeedResult,
      isLoading: isLoading || personalizedFeed.isLoading,
    } as const
  }

  return {
    ...publicFeed,
    data: publicFeed.data as GetPersonalizedPollFeedResult,
    isLoading: isLoading || publicFeed.isLoading,
  } as const
}
