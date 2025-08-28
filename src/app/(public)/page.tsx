import type {GetPollFeedResult} from "@/app/_domain/ports/in/get-poll-feed"

type ErrorResult = {error: string}
type PollsResult = GetPollFeedResult | ErrorResult

async function getPolls(filters: {limit?: string; cursor?: string}): Promise<PollsResult> {
  const url = new URL(
    "/api/polls/feed",
    process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000",
  )

  if (filters.limit) {
    url.searchParams.set("limit", filters.limit)
  }

  if (filters.cursor) {
    url.searchParams.set("cursor", filters.cursor)
  }

  const res = await fetch(url.toString(), {
    cache: "no-store", // opt into dynamic rendering
  })

  if (!res.ok) {
    return {error: "something_went_wrong"}
  }

  return res.json()
}

function FeedList({polls}: {polls: GetPollFeedResult}) {
  return (
    <ul>
      {polls.items.map((poll) => (
        <li key={poll.pollId}>{poll.question}</li>
      ))}
    </ul>
  )
}

export default async function Feed({searchParams}: {searchParams: Promise<{limit: string; cursor: string}>}) {
  const filters = await searchParams
  const polls = await getPolls(filters)

  return (
    <div className="min-h-screen w-full">
      <main className="flex w-full min-w-lg justify-center">
        {"error" in polls ? <p>{polls.error}</p> : <FeedList polls={polls} />}
      </main>
    </div>
  )
}
