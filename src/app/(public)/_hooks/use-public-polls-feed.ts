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

  const {data, error, isLoading, size, setSize, mutate} = useSWRInfinite<
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

  // Optimistically update poll data after voting
  const castVote = async (pollId: string, optionId: string) => {
    // Find the poll to get its slug
    const poll = items.find((p) => p.pollId === pollId)
    if (!poll) throw new Error("Poll not found")

    // Optimistic update: immediately update the UI
    mutate(
      (pages) => {
        if (!pages) return pages

        return pages.map((page) => ({
          ...page,
          items: page.items.map((poll) => {
            if (poll.pollId !== pollId) return poll

            // Update the current vote
            const updatedPoll = {
              ...poll,
              current: optionId,
            }

            // Optimistically update vote counts (simple increment)
            const updatedResults = {
              ...poll.results,
              total: poll.results.total + 1,
              items: poll.results.items.map((item) => {
                if (item.optionId === optionId) {
                  return {
                    ...item,
                    count: item.count + 1,
                  }
                }
                return item
              }),
            }

            // Recalculate percentages
            const total = updatedResults.total
            updatedResults.items = updatedResults.items.map((item) => ({
              ...item,
              pct: total > 0 ? Math.round((item.count / total) * 1000) / 10 : 0,
            }))

            return {
              ...updatedPoll,
              results: updatedResults,
            }
          }),
        }))
      },
      {
        revalidate: false, // Don't revalidate immediately - we want optimistic update first, then manual revalidate after API success
      },
    )

    // Make the actual API call
    try {
      const res = await fetch(`/api/polls/${poll.slug}/votes`, {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({optionId, idempotencyKey: crypto.randomUUID()}),
      })

      if (!res.ok) {
        throw new Error("cast_vote_failed")
      }

      // Revalidate to get the real data from server
      // Since the vote endpoint returns 204 (no content), we need to
      // fetch fresh data to get the updated vote counts and percentages
      mutate()
    } catch (error) {
      // Revert optimistic update on error
      console.error(error)
      mutate()
      throw error
    }
  }

  return {
    items, // flat list for rendering
    error,
    isLoading: isLoadingInitial,
    isLoadingMore,
    hasMore,
    loadMore,
    castVote, // voting helper
  }
}
