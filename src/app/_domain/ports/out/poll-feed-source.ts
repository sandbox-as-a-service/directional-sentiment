import type {PollFeedPageItem} from "@/app/_domain/use-cases/polls/dto/poll"

export type PollFeedSourcePageInput = {
  limit: number
  quorum: number
  cursor?: string
}
export type PollFeedSource = {
  page(input: PollFeedSourcePageInput): Promise<Array<PollFeedPageItem>>
}
