import type {PollFeedItem} from "@/app/_domain/use-cases/polls/dto/poll"

export type GetPollFeedResult = {items: PollFeedItem[]; nextCursor?: string}
export type GetPollFeedInput = {limit?: number; cursor?: string}
