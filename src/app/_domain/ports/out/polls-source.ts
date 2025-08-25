import type {PollOptionItem, PollSummary} from "@/app/_domain/use-cases/polls/dto/poll"

export type PollsSource = {
  findBySlug(slug: string): Promise<PollSummary | null>
  listOptions(pollId: string): Promise<Array<PollOptionItem>>
}
