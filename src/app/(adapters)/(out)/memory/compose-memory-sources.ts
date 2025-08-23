import {createMemoryPollsSource} from "./create-memory-polls-source"
import {createMemoryVotesSource} from "./create-memory-votes-source"
import {memoryOptions, memoryPolls} from "./fixtures/polls"

function source() {
  return {
    polls: createMemoryPollsSource({
      polls: memoryPolls,
      options: memoryOptions,
    }),
    votes: createMemoryVotesSource(),
  }
}

// Singleton instance shared across all route handlers (per node process)
// This ensures votes cast in one route are visible in other routes
let memorySource: ReturnType<typeof source>

export function composeMemorySource() {
  if (!memorySource) {
    memorySource = source()
  }
  return memorySource
}
