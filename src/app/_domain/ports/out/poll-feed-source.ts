import type {PollFeedItem} from "../../use-cases/polls/dto/poll"

// Port (tiny): what data the use case needs, nothing more
export type PollFeedSource = {
  // These inputs are independant of GetPollFeedInput
  page(input: {limit: number; cursor?: string}): Promise<Array<PollFeedItem>>
}
