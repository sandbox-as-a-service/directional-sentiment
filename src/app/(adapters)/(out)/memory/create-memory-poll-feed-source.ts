import type {PollFeedItem} from "@/app/_core/entities/poll"
import type {PollFeedSource} from "@/app/_core/ports/out/poll-feed-source"

export function createMemoryPollFeedSource(items: PollFeedItem[]): PollFeedSource {
  // Keep a sorted copy so paging is predictable
  const sorted = [...items].sort((a, b) => b.createdAt.localeCompare(a.createdAt))

  return {
    async page({limitPlusOne, cursor}) {
      let startIndex = 0
      if (cursor) {
        startIndex = sorted.findIndex((p) => p.createdAt < cursor)
        if (startIndex === -1) return []
      }
      return sorted.slice(startIndex, startIndex + limitPlusOne)
    },
  }
}
