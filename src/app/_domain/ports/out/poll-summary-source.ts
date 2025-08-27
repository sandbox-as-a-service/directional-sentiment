import type {PollSummaryPageItem} from "@/app/_domain/use-cases/polls/dto/poll"

export type PollSummarySourcePageInput = {
  quorum: number
  slug: string
}

/**
 * PollSummarySource
 *
 * Outbound port for reading a single poll "card" (metadata + vote summary)
 * by slug. This port performs read-only aggregation (via RPC/view) and maps
 * database rows to the domain DTO shape. Domain policy (e.g., quorum value,
 * visibility rules) is chosen by the use case and passed in as input.
 *
 * Domain/adapter split:
 * - Domain passes `quorum` (threshold) and the `slug`.
 * - Adapter resolves the poll id for the slug, calls the aggregation RPC,
 *   and returns a single summary object or null.
 * - Adapter throws only infra ("supabase_*") errors; never domain errors.
 */
export type PollSummarySource = {
  /**
   * getBySlug
   * - Input:
   *   - slug: exact poll slug
   *   - quorum: non-negative integer used for "warming up" calculation
   *
   * - Semantics:
   *   - Returns the poll summary for the given slug, or `null` if not found.
   *   - No status filtering implied here; visibility (open/closed/draft)
   *     is decided by the domain or higher-level routing.
   *   - Aggregation is read-only; no domain validation occurs here.
   *
   * - Output:
   *   - {
   *       pollId, slug, question, status, category,
   *       openedAt, createdAt,
   *       options: Array<{ optionId, label }>,
   *       results: {
   *         total: number,
   *         updatedAt: string | null,
   *         warmingUp: boolean,          // derived using provided `quorum`
   *         items: Array<{ optionId: string, count: number, percentage: number }>
   *       }
   *     }
   *
   * - Errors:
   *   - Throw "supabase_query_failed" (or similar `supabase_*`) on infra failures.
   *   - Do NOT throw domain errors from here.
   */
  findBySlug(input: PollSummarySourcePageInput): Promise<PollSummaryPageItem | null>
}
