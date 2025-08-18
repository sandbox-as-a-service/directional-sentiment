import type {PollFeedItem} from "../../use-cases/polls/dto/poll"

// Port (tiny): what data the use case needs, nothing more
export interface PollFeedSource {
  page(input: {limit: number; cursor?: string}): Promise<Array<PollFeedItem>>
}
