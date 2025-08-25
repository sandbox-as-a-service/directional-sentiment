import type {PollFeedPageItem} from "@/app/_domain/use-cases/polls/dto/poll"

export type GetPollFeedResult = {
  items: PollFeedPageItem[]
  nextCursor?: string
}
export type GetPollFeedInput = {
  limit?: number
  cursor?: string
  quorum?: number
}
