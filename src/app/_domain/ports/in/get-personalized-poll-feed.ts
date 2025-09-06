import type {PollPersonalizedPageItem} from "@/app/_domain/use-cases/polls/dto/poll"

export type GetPersonalizedPollFeedResult = {
  items: Array<PollPersonalizedPageItem>
  nextCursor?: string
}

export type GetPersonalizedPollFeedInput = {
  userId: string
  limit?: number
  cursor?: string
  quorum?: number
}
