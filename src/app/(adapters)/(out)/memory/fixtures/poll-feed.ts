import type {PollFeedItem} from "@/app/_domain/use-cases/polls/dto/poll"

export const memoryPollFeed: PollFeedItem[] = [
  // newest → oldest
  {pollId: "11111111-1111-4111-8111-111111111111", createdAt: "2025-08-18T15:30:00Z"},
  {pollId: "22222222-2222-4222-8222-222222222222", createdAt: "2025-08-17T10:00:00Z"},
]
