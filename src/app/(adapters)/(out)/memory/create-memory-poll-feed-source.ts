import type {PollFeedSource} from "@/app/_domain/ports/out/poll-feed-source"
import type {PollFeedItem} from "@/app/_domain/use-cases/polls/dto/poll"

export function createMemoryPollFeedSource(items: PollFeedItem[]): PollFeedSource {
  // One-time clone + sort newest → oldest by ISO timestamp
  const sortedByCreatedAtDesc = [...items].sort((a, b) => b.createdAt.localeCompare(a.createdAt))

  return {
    async page({limit, cursor}) {
      // No cursor → start at the beginning (newest)
      if (!cursor) {
        return sortedByCreatedAtDesc.slice(0, limit)
      }

      // Cursor present → find the first item strictly older than the cursor
      // (prevents duplicates across pages)
      const startIndex = sortedByCreatedAtDesc.findIndex((item) => item.createdAt < cursor)

      // Nothing older than the cursor → no more pages
      if (startIndex === -1) {
        return []
      }

      // Return a slice; caller gets a fresh array
      return sortedByCreatedAtDesc.slice(startIndex, startIndex + limit)
    },
  }
}
