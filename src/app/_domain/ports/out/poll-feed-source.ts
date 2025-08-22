import type {PollFeedItem} from "../../use-cases/polls/dto/poll"

// These inputs are independant of GetPollFeedInput. They can be different shapes.
export type PollFeedPageInput = {
  limit: number
  cursor?: string
}

// Port (tiny): what data the use case needs, nothing more
export type PollFeedSource = {
  page(input: PollFeedPageInput): Promise<Array<PollFeedItem>>
}
