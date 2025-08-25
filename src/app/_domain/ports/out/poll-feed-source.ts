import type {PollFeedPageItem, PollStatus} from "@/app/_domain/use-cases/polls/dto/poll"

export type PollFeedSourcePageInput = {
  limit: number
  quorum: number
  cursor?: string
  statuses: PollStatus[]
}
export type PollFeedSource = {
  page(input: PollFeedSourcePageInput): Promise<Array<PollFeedPageItem>>
}
