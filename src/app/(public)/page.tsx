"use client"

import {use} from "react"
import useSWR from "swr"

import type {GetPollFeedResult} from "@/app/_domain/ports/in/get-poll-feed"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

function FeedList({polls}: {polls: GetPollFeedResult}) {
  return (
    <ul>
      {polls.items.map((poll) => (
        <li key={poll.pollId}>{poll.question}</li>
      ))}
    </ul>
  )
}

export default function Feed({searchParams}: {searchParams: Promise<{limit: string; cursor: string}>}) {
  const {limit, cursor} = use(searchParams)

  const qs = new URLSearchParams()
  if (limit) qs.set("limit", limit)
  if (cursor) qs.set("cursor", cursor)

  const key = `/api/polls/feed${qs.toString() ? `?${qs}` : ""}`

  const {data, error, isLoading} = useSWR<GetPollFeedResult>(key, fetcher)

  if (error) return <div>failed to load</div>
  if (isLoading) return <div>loading...</div>
  if (!data) return <div>no data</div>

  return (
    <div className="min-h-screen w-full">
      <main className="flex w-full min-w-lg justify-center">
        <FeedList polls={data} />
      </main>
    </div>
  )
}
