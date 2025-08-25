import type {PollFeedPageItem} from "@/app/_domain/use-cases/polls/dto/poll"

export type PollFeedSourcePageInput = {
  limit: number
  quorum: number
  cursor?: string
}
/**
 * PollFeedSource
 *
 * Outbound port for reading the feed of *open* polls in reverse-chronological order
 * by `opened_at`, with cursor-based keyset pagination. The domain use case owns all
 * pagination policy (limit clamp, requesting `limit + 1`, nextCursor derivation);
 * this port simply returns up to `limit` items for the requested page.
 *
 * Domain/adapter split:
 * - Domain decides `quorum` (threshold) and passes it in.
 * - Adapter performs read-only aggregation via RPC and returns summaries.
 */
export type PollFeedSource = {
  /**
   * page
   * - Input:
   *   - limit: number of items to return for this page (the use case may pass limit+1).
   *   - cursor?: ISO timestamp; return items with `opened_at < cursor`.
   *   - quorum: non-negative integer used for `warmingUp` determination in summaries.
   *
   * - Semantics:
   *   - Returns **open polls only** (status = "open").
   *   - Ordered by `opened_at` DESC (newest opened first).
   *   - No responsibility for nextCursor; the use case derives it from results.
   *   - May return fewer than `limit` items if not enough data.
   *
   * - Output:
   *   - Array of `PollFeedPageItem` with:
   *     - pollId, slug, question, status, category
   *     - openedAt, createdAt
   *     - options: Array<{ optionId, label }>
   *     - results: {
   *         total: number,
   *         updatedAt: string | null,
   *         warmingUp: boolean, // derived using the provided `quorum`
   *         items: Array<{ optionId: string, count: number, percentage: number }>
   *       }
   *
   * - Errors:
   *   - Throw `"supabase_query_failed"` (or similar `supabase_*`) on infra failures.
   *   - Do **not** throw domain errors from here.
   *
   * - Ordering guarantee:
   *   - Returned items are in `opened_at DESC` order. Callers must not
   *     depend on any other implicit ordering.
   */
  page(input: PollFeedSourcePageInput): Promise<Array<PollFeedPageItem>>
}
