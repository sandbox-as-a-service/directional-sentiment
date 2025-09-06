"use client"

import {Fragment} from "react"
import useSWR from "swr"

import type {GetPollFeedError, GetPollFeedResult} from "../_domain/ports/in/get-poll-feed"
import type {PollFeedPageItem} from "../_domain/use-cases/polls/dto/poll"
import {Button} from "./_components/button/button"
import {Card, CardContent, CardFooter, CardHeader, CardStack} from "./_components/card/card"
import {TwoColumnLayout} from "./_components/layout/two-column-layout"
import {Separator} from "./_components/separator/separator"

const fetcher = async (url: URL) => {
  const res = await fetch(url)
  return !res.ok ? Promise.reject(await res.json()) : await res.json()
}

export default function Home() {
  const {data, error, mutate} = useSWR<GetPollFeedResult, GetPollFeedError>("/api/polls/feed", fetcher)

  const content = data?.items?.map((item, index) => (
    <Fragment key={item.pollId}>
      <Card className="w-full border-none">
        <CardHeader>{item.question}</CardHeader>
        <CardContent>
          {item.options.map((option) => (
            <Button
              key={option.optionId}
              variant="outline"
              size="lg"
              className="rounded-none shadow-none"
              onClick={async () => {
                const optimistic: PollFeedPageItem = {
                  ...item,
                  results: {...item.results, total: item.results.total + 1},
                }

                await mutate(
                  async (prev) => {
                    const res = await fetch(`/api/polls/${item.pollId}/votes`, {
                      method: "POST",
                      headers: {"Content-Type": "application/json"},
                      body: JSON.stringify({optionId: option.optionId, idempotencyKey: "test"}),
                    })

                    if (!res.ok) {
                      const error = await res.json()
                      throw error
                    }

                    // 204: nothing to merge; keep the optimistic value in cache
                    // return the current cache so SWR doesn't change it
                    return prev
                  },
                  {
                    optimisticData: (prev) => {
                      if (!prev) return {items: [], nextCursor: undefined}
                      return {
                        ...prev,
                        items: prev.items.map((prevItem) =>
                          prevItem.pollId === item.pollId ? optimistic : prevItem,
                        ),
                      }
                    },
                    rollbackOnError: true,
                  },
                )
              }}
            >
              {option.label}
            </Button>
          ))}
        </CardContent>
        <CardFooter>Total: {item.results.total}</CardFooter>
      </Card>
      {index < data.items.length - 1 && <Separator />}
    </Fragment>
  ))

  const errorContent = error && (
    <Card className="w-full">
      <CardHeader>Error</CardHeader>
      <CardContent>Failed to load polls: {error.error}</CardContent>
    </Card>
  )

  return (
    <TwoColumnLayout className="container mx-auto">
      <TwoColumnLayout.Main>{errorContent ?? <CardStack>{content}</CardStack>}</TwoColumnLayout.Main>
      <TwoColumnLayout.Aside stickyOffsetClassName="top-6">
        <Card className="w-full">
          <CardHeader>Showing polls</CardHeader>
          <CardContent>{data?.items?.length ?? 0}</CardContent>
        </Card>
      </TwoColumnLayout.Aside>
    </TwoColumnLayout>
  )
}
