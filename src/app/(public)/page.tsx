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
  const queries = use(searchParams)
  const url = new URL(
    "/api/polls/feed",
    process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000",
  )

  if (queries.limit) {
    url.searchParams.set("limit", queries.limit)
  }

  if (queries.cursor) {
    url.searchParams.set("cursor", queries.cursor)
  }

  const {data, error, isLoading} = useSWR<GetPollFeedResult>(url.toString(), fetcher)

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
