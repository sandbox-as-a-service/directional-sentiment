import type {PollResultsItem, PollStatus} from "@/app/_domain/use-cases/polls/dto/poll"

export type GetPollResultsResult = {
  items: PollResultsItem[]
  total: number
  status: PollStatus
  updatedAt: string
}
// (optional) if you ever add inputs
export type GetPollResultsInput = Record<string, never>
