import {POLLS} from "@/app/_domain/config/polls"
import type {GetPollSummaryInput, GetPollSummaryResult} from "@/app/_domain/ports/in/get-poll-summary"
import type {PollSummarySource} from "@/app/_domain/ports/out/poll-summary-source"

/**
 * getPollSummary
 */
export async function getPollSummary(args: {
  pollSummary: PollSummarySource
  input: GetPollSummaryInput
}): Promise<GetPollSummaryResult> {
  const {pollSummary, input} = args
  const {quorum, slug} = input

  // Configurable defaults
  // Single source of truth. I’ll likely have multiple edges (HTTP, SDK, CLI, cron).
  // Zod defaults are great for DX and nicer request shapes, but they’re presentation-level conveniences.
  // Quorum controls when the UI shows the "Warming up" state (total < quorum).
  const quorumThreshold = quorum ?? POLLS.DEFAULT_QUORUM

  // Fetch one extra record (N+1). If it exists, we know there’s another page.
  const poll = await pollSummary.findBySlug({
    slug,
    quorum: quorumThreshold,
  })

  if (!poll) {
    throw new Error("not_found")
  }

  return {item: poll}
}
