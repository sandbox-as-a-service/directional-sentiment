import type {PollsSource} from "@/app/_domain/ports/out/polls-source"
import type {PollOption, PollStatus} from "@/app/_domain/use-cases/polls/dto/poll"

export function createMemoryPollsSource(seed: {
  polls: Array<{pollId: string; slug: string; status: PollStatus}>
  options: Array<{optionId: string; pollId: string}>
}): PollsSource {
  return {
    async findBySlug(slug) {
      const row = seed.polls.find((p) => p.slug === slug)
      return row ? {pollId: row.pollId, status: row.status} : null
    },
    async listOptions(pollId) {
      return seed.options.filter((o) => o.pollId === pollId).map<PollOption>((o) => ({optionId: o.optionId}))
    },
  }
}
