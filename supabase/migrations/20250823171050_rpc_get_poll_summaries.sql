-- =============================================================================
-- Migration: rpc_get_poll_summaries.sql
-- Purpose : RPC to return per-poll snapshots (UI-neutral)
-- Notes   :
--   - Computes "latest per (poll_id, user_id)" via DISTINCT ON (voted_at DESC, id DESC)
--   - Counts current votes per option (zero-safe)
--   - Percentages rounded to 1 decimal
--   - No default quorum here; domain passes the threshold explicitly
-- =============================================================================
create or replace function public.get_poll_summaries (poll_ids uuid[], quorum_threshold int) returns table (
  poll_id uuid,
  slug text,
  question text,
  status public.poll_status,
  category text,
  opened_at timestamptz,
  created_at timestamptz,
  -- List of available options for the poll
  options jsonb,
  -- Aggregate vote info
  vote_total bigint,
  vote_latest_at timestamptz,
  below_quorum boolean,
  -- Vote breakdown by option
  vote_breakdown jsonb
) language sql stable
set
  search_path = public,
  pg_temp as $$
  -- Limit to the requested polls
  with input_polls as (
    select poll.*
    from public.poll as poll
    where poll.id = any (poll_ids)
  ),

  -- Latest vote per (poll_id, user_id), deterministic tie-break with (voted_at desc, id desc)
  latest_vote_per_user as (
    select distinct on (vote.poll_id, vote.user_id)
           vote.poll_id, vote.user_id, vote.option_id, vote.voted_at, vote.id
    from public.vote as vote
    where vote.poll_id = any (poll_ids)
    order by vote.poll_id, vote.user_id, vote.voted_at desc, vote.id desc
  ),

  -- Counts per (poll, option) + most recent voted_at per poll
  option_tally as (
    select latest.poll_id,
           latest.option_id,
           count(*)::bigint as count,
           max(latest.voted_at) as latest_voted_at
    from latest_vote_per_user as latest
    group by latest.poll_id, latest.option_id
  ),

  -- Per-poll totals and last activity time (derived at read time)
  poll_aggregate as (
    select ip.id          as poll_id,
           ip.slug,
           ip.question,
           ip.status,
           ip.category,
           ip.opened_at,
           ip.created_at,
           coalesce(sum(t.count) filter (where t.poll_id = ip.id), 0)::bigint as total_votes,
           max(t.latest_voted_at) filter (where t.poll_id = ip.id)           as latest_vote_at
    from input_polls ip
    left join option_tally t on t.poll_id = ip.id
    group by ip.id, ip.slug, ip.question, ip.status, ip.category, ip.opened_at, ip.created_at
  ),

  -- Raw option rows (include created_at for stable ordering)
  options_for_polls as (
    select poll_option.poll_id,
           poll_option.id   as option_id,
           poll_option.label,
           poll_option.created_at
    from public.poll_option as poll_option
    where poll_option.poll_id = any (poll_ids)
  ),

  -- Options joined with zero-safe counts
  options_with_counts as (
    select
      opt.poll_id,
      opt.option_id,
      opt.label,
      opt.created_at,
      coalesce(t.count, 0)::bigint as count
    from options_for_polls as opt
    left join option_tally as t
      on t.poll_id  = opt.poll_id
     and t.option_id = opt.option_id
  ),

  -- JSON array of `{optionId, label}` for the poll's options
  options_list_json as (
    select
      opt.poll_id,
      jsonb_agg(
        jsonb_build_object(
          'optionId', opt.option_id,
          'label',    opt.label
        )
        order by opt.created_at, opt.option_id
      ) as options
    from options_for_polls as opt
    group by opt.poll_id
  ),

  -- JSON array of vote breakdown `{optionId, label, count, pct}`
  vote_breakdown_json as (
    select
      owc.poll_id,
      jsonb_agg(
        jsonb_build_object(
          'optionId', owc.option_id,
          'label',    owc.label,
          'count',    owc.count,
          'pct',
            case
              when agg.total_votes > 0
                then round((owc.count::numeric / nullif(agg.total_votes, 0)::numeric) * 100, 1)
              else 0
            end
        )
        order by owc.created_at, owc.option_id
      ) as items
    from options_with_counts as owc
    join poll_aggregate as agg on agg.poll_id = owc.poll_id
    group by owc.poll_id
  )

  -- Final rows (one per poll)
  select
    agg.poll_id,
    agg.slug,
    agg.question,
    agg.status,
    agg.category,
    agg.opened_at,
    agg.created_at,
    coalesce(opt_json.options, '[]'::jsonb) as options,
    agg.total_votes                         as vote_total,
    agg.latest_vote_at                      as vote_latest_at,
    (agg.total_votes < quorum_threshold)    as below_quorum,
    coalesce(vb_json.items, '[]'::jsonb)    as vote_breakdown
  from poll_aggregate as agg
  left join options_list_json   as opt_json on opt_json.poll_id = agg.poll_id
  left join vote_breakdown_json as vb_json  on vb_json.poll_id  = agg.poll_id;
$$;
