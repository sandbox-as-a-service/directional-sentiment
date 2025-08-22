import type {PollsSource} from "@/app/_domain/ports/out/polls-source"
import type {PollOption, PollStatus} from "@/app/_domain/use-cases/polls/dto/poll"

type PollSeed = {pollId: string; slug: string; status: PollStatus}
type OptionSeed = {optionId: string; pollId: string}

export function createMemoryPollsSource(seed: {polls: PollSeed[]; options: OptionSeed[]}): PollsSource {
  return {
    // Find a poll by slug and return a tiny summary (or null if not found)
    async findBySlug(slug: string) {
      for (const poll of seed.polls) {
        if (poll.slug === slug) {
          return {pollId: poll.pollId, status: poll.status}
        }
      }
      return null
    },

    // List options for a poll as { optionId }[]
    async listOptions(pollId: string) {
      const result: PollOption[] = []
      for (const option of seed.options) {
        if (option.pollId === pollId) {
          result.push({optionId: option.optionId})
        }
      }
      return result
    },
  }
}
