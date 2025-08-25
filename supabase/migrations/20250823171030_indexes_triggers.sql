-- =============================================================================
-- Migration: indexes_triggers.sql
-- Purpose : Performance indexes + server-managed updated_at trigger
-- Notes   :
--   - Feed-friendly DESC indexes for keyset pagination
--   - Partial unique index for idempotency (NULL-safe)
--   - Trigger keeps poll.updated_at fresh on UPDATE
-- =============================================================================
-- Feed/indexing for keyset pagination:
-- Newest-first, with a tie-breaker on id. Lets you do:
--   WHERE (created_at, id) < (:cursor_created_at, :cursor_id)
--   ORDER BY created_at DESC, id DESC
--   LIMIT :n
create index if not exists idx_poll_created_desc on public.poll (created_at desc, id desc);

-- Prevent duplicate labels within the same poll (allows "Yes"/"No" reuse across polls)
create unique index if not exists uq_poll_option_label on public.poll_option (poll_id, label);

-- Convenience index for frequent "all options for poll" lookups
create index if not exists idx_poll_option_poll on public.poll_option (poll_id);

-- User-scoped idempotency:
-- Unique *only when idempotency_key is present* (NULLs are ignored by this partial index),
-- so users can have multiple rows with NULL key, but not duplicate non-NULL keys.
create unique index if not exists uq_vote_user_idempotency on public.vote (user_id, idempotency_key)
where
  idempotency_key is not null;

-- Helpful indexes for queries & tallying
-- All votes for a poll
create index if not exists idx_vote_poll on public.vote (poll_id);

-- All votes for a given option
create index if not exists idx_vote_option on public.vote (option_id);

-- Latest vote per (poll, user) lookups
create index if not exists idx_vote_poll_user on public.vote (poll_id, user_id);

-- Fast "current vote per user" (latest wins):
-- Order by voted_at DESC, id DESC to break ties deterministically.
create index if not exists idx_vote_latest_per_user on public.vote (poll_id, user_id, voted_at desc, id desc);

-- Cover composite FK (poll_id, option_id) → poll_option(poll_id, id)
-- Helps parent deletes/updates and any lookups/join checks involving both columns
create index if not exists idx_vote_poll_option on public.vote (poll_id, option_id);

-- Trigger to auto-update updated_at on every update
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
