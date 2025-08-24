// ports/out/poll-feed-source.ts
import type {PollFeedItem} from "@/app/_domain/use-cases/polls/dto/poll"

// These inputs are independent of GetPollFeedInput. They can be different shapes.
export type PollFeedPageInput = {
  limit: number
  cursor?: string
  quorum: number // NEW: forwarded to RPC
}

// Port: now returns **card-ready** rows, not just ids/timestamps.
export type PollFeedSource = {
  page(input: PollFeedPageInput): Promise<PollFeedItem[]>
}
