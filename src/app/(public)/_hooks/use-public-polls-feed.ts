import useSWRInfinite from "swr/infinite"

import type {
  GetPersonalizedPollFeedError,
  GetPersonalizedPollFeedResult,
} from "@/app/_domain/ports/in/get-personalized-poll-feed"

import {useGetUser} from "./use-get-user"

export function usePollsFeed(limit = 10) {
  const {data: user, isLoading: userLoading} = useGetUser()
  const usePersonalized = Boolean(user)

  // Build the key for each page.
  // - Return null to stop fetching (SWR rule).
  // - We wait for user state to resolve so we know the correct base URL.
  function getKey(pageIndex: number, previousPage: GetPersonalizedPollFeedResult | null) {
    if (userLoading) {
      return null // wait until we know if user exists
    }

    if (previousPage && !previousPage.nextCursor) {
      return null // reached the end
    }

    const base = usePersonalized ? "/api/polls/feed/personalized" : "/api/polls/feed"

    const params = new URLSearchParams({limit: String(limit)})

    // First page has no cursor; subsequent pages pass the previous page's nextCursor
    if (pageIndex > 0 && previousPage?.nextCursor) {
      params.set("cursor", previousPage.nextCursor)
    }

    return `${base}?${params.toString()}`
  }

  const {data, error, isLoading, size, setSize} = useSWRInfinite<
    GetPersonalizedPollFeedResult,
    GetPersonalizedPollFeedError
  >(getKey, {
    revalidateFirstPage: false, // New polls are not frequent, so don't bother revalidating the first page. default is true
  })

  // Initial loading = when the first (real) fetch is happening
  // (If key is null because user is loading, we rely on userLoading)
  const isLoadingInitial = userLoading || isLoading

  // While SWR is fetching page N, data[N] is temporarily `undefined`
  // -> this is the canonical "is loading more" signal
  const isLoadingMore = size > 0 && !!data && typeof data[size - 1] === "undefined"

  // Flatten pages for the UI
  const items = data ? data.flatMap((p) => p?.items ?? []) : []

  // More pages?
  const hasMore = Boolean(data?.[data.length - 1]?.nextCursor)

  // Small helpers the page can call.
  const loadMore = () => {
    if (hasMore && !isLoadingMore) {
      setSize(size + 1)
    }
  }

  return {
    items, // flat list for rendering
    error,
    isLoading: isLoadingInitial,
    isLoadingMore,
    hasMore,
    loadMore,
  }
}
