import type {PollFeedSource} from "@/app/_domain/ports/out/poll-feed-source"
import type {PollFeedItem} from "@/app/_domain/use-cases/polls/dto/poll"

export function createMemoryPollFeedSource(items: PollFeedItem[]): PollFeedSource {
  // Keep a sorted copy so paging is predictable
  const sorted = [...items].sort((a, b) => b.createdAt.localeCompare(a.createdAt))

  return {
    async page({limit, cursor}) {
      let startIndex = 0
      if (cursor) {
        startIndex = sorted.findIndex((p) => p.createdAt < cursor)
        if (startIndex === -1) return []
      }
      return sorted.slice(startIndex, startIndex + limit)
    },
  }
}
