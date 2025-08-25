import type {PollMetadata, PollOptionItem} from "@/app/_domain/use-cases/polls/dto/poll"

/**
 * PollsSource
 *
 * Outbound port for poll metadata and option lookups.
 * Infra-only concerns (queries, errors) live here; domain policy (status checks,
 * validation, percentages/quorum) live in the use case.
 */
export type PollsSource = {
  /**
   * findBySlug
   * - Input: exact slug string (case-sensitive match).
   * - Success: returns { pollId, status } for the single poll.
   * - Not found: returns null (DO NOT throw a domain error).
   * - Errors: throw "supabase_query_failed" (or similar infra error) on service failure.
   * - Notes: status is a DB field; caller (use case) is responsible for interpreting it
   *   (e.g., "open" vs "closed") and throwing domain errors like "not_found"/"poll_closed".
   */
  findBySlug(slug: string): Promise<PollMetadata | null>

  /**
   * listOptions
   * - Input: pollId (UUID).
   * - Success: returns all options for the poll as { optionId, label }.
   * - Empty: returns [] if the poll has no options.
   * - Errors: throw "supabase_query_failed" (or similar infra error) on service failure.
   * - Ordering: no ordering guarantee; callers must not depend on order.
   * - Semantics: presence in this list is the sole source of truth for option membership;
   *   the use case enforces membership and throws "option_mismatch" if needed.
   */
  listOptions(pollId: string): Promise<Array<PollOptionItem>>
}
