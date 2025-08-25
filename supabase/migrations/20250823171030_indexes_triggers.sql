-- =============================================================================
-- Migration: indexes_triggers.sql (revised)
-- Purpose : Keep only the indexes that serve our real queries + RPC,
--           and add the best ones for the public feed (status='open').
-- Notes   :
--   - Feed-friendly DESC index (partial) for open polls
--   - Partial unique index for idempotency (NULL-safe)
--   - Latest-per-user index to power DISTINCT ON in RPC
--   - Ordered-by-time index for "all vote events for a poll"
--   - Keep FK-helper index for (poll_id, option_id) checks on deletes/restrict
--   - Trigger keeps poll.updated_at fresh on UPDATE
-- =============================================================================
-- --------- Poll feed (public): status='open' + keyset pagination ---------------
-- WHERE status='open' AND created_at < :cursor
-- ORDER BY created_at DESC, id DESC
create index if not exists idx_poll_open_created_desc on public.poll (created_at desc, id desc)
where
  status = 'open';

-- --------- Poll options lookups ------------------------------------------------
-- SELECT id,label FROM poll_option WHERE poll_id = :id
create unique index if not exists uq_poll_option_label on public.poll_option (poll_id, label);

create index if not exists idx_poll_option_poll on public.poll_option (poll_id);

-- --------- Votes: idempotency + latest-per-user + ordered events ---------------
-- Idempotency: exact match on (user_id, idempotency_key), ignoring NULL keys
create unique index if not exists uq_vote_user_idempotency on public.vote (user_id, idempotency_key)
where
  idempotency_key is not null;

-- RPC get_poll_summaries: DISTINCT ON (poll_id, user_id) ORDER BY voted_at DESC, id DESC
-- and filtered by poll_id IN (...)
create index if not exists idx_vote_latest_per_user on public.vote (poll_id, user_id, voted_at desc, id desc);

-- Listing all vote events for a poll ordered by time (admin/debug, detail page extras):
-- SELECT ... FROM vote WHERE poll_id = :id ORDER BY voted_at DESC, id DESC
create index if not exists idx_vote_poll_ordered on public.vote (poll_id, voted_at desc, id desc);

-- FK helper for (poll_id, option_id) → poll_option(poll_id, id)
-- Speeds up RESTRICT checks / cascades when deleting an option
create index if not exists idx_vote_poll_option on public.vote (poll_id, option_id);

-- --------- Trigger to auto-update poll.updated_at ------------------------------
-- Lock down search_path for the trigger function to avoid name resolution surprises
create or replace function public.set_updated_at () returns trigger language plpgsql
set
  search_path = pg_catalog -- resolve only built-ins
  as $$
begin
  new.updated_at := pg_catalog.now();  -- explicit qualification
  return new;
end
$$;

drop trigger if exists trg_poll_updated_at on public.poll;

create trigger trg_poll_updated_at before
update on public.poll for each row
execute function public.set_updated_at ();
