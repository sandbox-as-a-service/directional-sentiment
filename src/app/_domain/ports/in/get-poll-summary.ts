import type {PollSummaryPageItem} from "@/app/_domain/use-cases/polls/dto/poll"

export type GetPollSummaryResult = {
  item: PollSummaryPageItem
}

export type GetPollSummaryInput = {
  slug: string
  quorum?: number
}
