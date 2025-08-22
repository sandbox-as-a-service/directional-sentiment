// Out-port: minimal reads about polls/options needed by use cases
import type {PollOptionRef, PollSummary} from "@/app/_domain/use-cases/polls/dto/poll"

export interface PollsSource {
  findBySlug(slug: string): Promise<PollSummary | null>
  listOptions(pollId: string): Promise<Array<PollOptionRef>>
}
