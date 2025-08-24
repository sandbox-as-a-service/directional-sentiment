// src/app/_domain/ports/in/get-poll-feed.ts
import type {PollFeedItem} from "@/app/_domain/use-cases/polls/dto/poll"

export type GetPollFeedResult = {
  items: PollFeedItem[] // card-ready objects
  nextCursor?: string
}

export type GetPollFeedInput = {
  limit?: number
  cursor?: string
  quorum?: number // default in use case (e.g., 30)
}
