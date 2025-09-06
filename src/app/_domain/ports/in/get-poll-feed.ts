import type {PollFeedPageItem} from "@/app/_domain/use-cases/polls/dto/poll"

export type GetPollFeedResult = {
  items: Array<PollFeedPageItem>
  nextCursor?: string
}

export type GetPollFeedError = {
  error: string
  message: unknown
}

export type GetPollFeedInput = {
  limit?: number
  cursor?: string
  quorum?: number
}
