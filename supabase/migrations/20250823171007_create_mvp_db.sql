-- =============================================================================
-- Migration: create_mvp_db.sql
-- Purpose : Create core Opinion Registry MVP schema (poll, poll_option, vote)
-- Notes   : 
--   - Uses UUID PKs via pgcrypto.gen_random_uuid()
--   - Append-only votes; "latest per user" determines current choice
--   - User-scoped idempotency to dedupe client retries
--   - Composite FK ensures vote.option_id belongs to the same poll_id
--   - Feed-friendly DESC indexes for keyset pagination
-- =============================================================================
-- 0) Ensure extension for UUID generation exists (safe if it already does)
create extension if not exists "pgcrypto";

-- Remove pg_graphql (will drop its member objects)
drop extension if exists pg_graphql;

-- Drop uuid-ossp
drop extension if exists "uuid-ossp";

-- 1) Create PollStatus enum (draft | open | closed)
--    DO block makes it idempotent; it won't error if type already exists.
do $$ 
begin
  create type poll_status as enum ('draft', 'open', 'closed');
exception 
  when duplicate_object then null; 
end $$;

-- 2) POLL TABLE
--    One row per poll. Lifecycle timestamps support your Open/Close/Feature commands.
create table if not exists public.poll (
  -- Primary key (server-generated)
  id uuid primary key default gen_random_uuid(),
  -- Human-readable unique handle used in URLs (/api/polls/:slug)
  slug text not null unique,
  -- The poll question text
  question text not null,
  -- Lifecycle status
  status poll_status not null default 'draft',
  -- Optional category (free text for MVP)
  category text,
  -- Lifecycle timestamps (all optional; set by your editor actions)
  opened_at timestamptz, -- set when poll is opened (OpenPoll)
  closed_at timestamptz, -- set when poll is closed (ClosePoll)
  featured_at timestamptz, -- set when poll is featured/pinned (FeaturePoll)
  -- Server-managed timestamps
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.poll is 'Top-level poll records (question, status, lifecycle timestamps)';

comment on column public.poll.id is 'Primary key (UUID, server-generated)';

comment on column public.poll.slug is 'Unique, human-readable identifier used in URLs';

comment on column public.poll.question is 'The poll question text shown to voters';

comment on column public.poll.status is 'Lifecycle: draft | open | closed';

comment on column public.poll.category is 'Optional free-text category label (Politics, Culture, etc.)';

comment on column public.poll.opened_at is 'Timestamp when poll was opened for voting';

comment on column public.poll.closed_at is 'Timestamp when poll was closed';

comment on column public.poll.featured_at is 'Timestamp when poll was featured/pinned in feed';

comment on column public.poll.created_at is 'Row creation time';

comment on column public.poll.updated_at is 'Last update time (maintained by trigger)';

-- Feed/indexing for keyset pagination:
-- Newest-first, with a tie-breaker on id. Lets you do:
--   WHERE (created_at, id) < (:cursor_created_at, :cursor_id)
--   ORDER BY created_at DESC, id DESC
--   LIMIT :n
create index if not exists idx_poll_created_desc on public.poll (created_at desc, id desc);

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

-- 3) POLL OPTION TABLE
--    One row per option label within a poll (e.g., "Yes", "No").
create table if not exists public.poll_option (
  -- Primary key (server-generated)
  id uuid primary key default gen_random_uuid(),
  -- FK to the parent poll; cascade so options disappear if poll is deleted
  -- "Reusable" here means labels (e.g., many polls can have Yes/No),
  -- not that one option row is shared across polls. Each poll owns its options.
  poll_id uuid not null references public.poll (id) on delete cascade,
  -- Display label (we keep it simple: plain text for MVP)
  label text not null,
  -- Optional: helps ordering by creation if desired by UI later
  created_at timestamptz not null default now()
);

comment on table public.poll_option is 'Per-poll answer choices (each poll owns its own option rows)';

comment on column public.poll_option.id is 'Primary key (UUID, server-generated)';

comment on column public.poll_option.poll_id is 'FK → poll.id (ON DELETE CASCADE)';

comment on column public.poll_option.label is 'Display label for the option (e.g., Yes / No)';

comment on column public.poll_option.created_at is 'Creation time for ordering/debugging';

-- Prevent duplicate labels within the same poll (allows "Yes"/"No" reuse across polls)
create unique index if not exists uq_poll_option_label on public.poll_option (poll_id, label);

-- Support a composite FK from vote to (poll_id, option_id) pair:
-- This index guarantees (poll_id, id) is unique so other tables can safely reference it.
create unique index if not exists uq_poll_option_pair on public.poll_option (poll_id, id);

-- Convenience index for frequent "all options for poll" lookups
create index if not exists idx_poll_option_poll on public.poll_option (poll_id);

-- 4) VOTE TABLE (append-only)
--    We never UPDATE a vote; every change inserts a new row.
--    "Current vote per user" is determined by the latest (voted_at, id) tuple.
create table if not exists public.vote (
  -- Primary key (server-generated)
  id uuid primary key default gen_random_uuid(),
  -- The poll being voted in
  poll_id uuid not null,
  -- The option chosen
  option_id uuid not null,
  -- The authenticated user (UUID). 
  -- CHANGED: enforce strict FK to Supabase Auth users.
  user_id uuid not null,
  -- Server event time for ordering ("latest wins")
  voted_at timestamptz not null default now(),
  -- Idempotency key (optional): user-scoped de-dupe for client retries.
  -- Using TEXT for MVP; keep it short (e.g., <=128 chars) at the app layer.
  idempotency_key text,
  -- FKs
  constraint fk_vote_poll foreign key (poll_id) references public.poll (id) on delete cascade,
  -- Composite FK: ensures option_id indeed belongs to the same poll_id
  -- (prevents mismatching poll/option pairs)
  constraint fk_vote_option_pair foreign key (poll_id, option_id) references public.poll_option (poll_id, id) on delete restrict,
  -- Strict link to Supabase auth.users (deletes votes if a user is deleted)
  constraint fk_vote_user foreign key (user_id) references auth.users (id) on delete cascade
);

comment on table public.vote is 'Append-only vote log; latest (voted_at, id) per (poll, user) is the current vote';

comment on column public.vote.id is 'Primary key (UUID, server-generated)';

comment on column public.vote.poll_id is 'FK → poll.id';

comment on column public.vote.option_id is 'FK (composite via (poll_id, option_id)) → poll_option';

comment on column public.vote.user_id is 'FK → auth.users.id (Supabase Auth user)';

comment on column public.vote.voted_at is 'Event time of the vote; used for latest-wins ordering';

comment on column public.vote.idempotency_key is 'Optional client-provided idempotency key (scoped per user)';

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

-- Deny all by default (no policies)
alter table public.poll enable row level security;

alter table public.poll_option enable row level security;

alter table public.vote enable row level security;

-- =============================================================================
-- RPC: get_poll_cards(poll_ids uuid[], quorum int)
-- Purpose: Return card-ready data for a set of polls in ONE call.
-- Notes:
--   - Computes "latest per (poll_id, user_id)" using DISTINCT ON (voted_at DESC, id DESC).
--   - Counts current votes per option (including zero-count options).
--   - Rounds percentages to 1 decimal.
--   - Returns JSON arrays for options and results.items to keep the adapter tiny.
--   - Does NOT touch public.poll.updated_at (that remains "metadata changed").
-- =============================================================================
create or replace function public.get_poll_cards (p_poll_ids uuid[], p_quorum int default 30) returns table (
  poll_id uuid,
  slug text,
  question text,
  status public.poll_status,
  category text,
  opened_at timestamptz,
  created_at timestamptz,
  -- Simple options list for the UI (order = option.created_at, id)
  options jsonb,
  -- Results snapshot
  results_total bigint,
  results_updated_at timestamptz,
  results_warming_up boolean,
  results_items jsonb
) language sql stable
set
  search_path = public,
  pg_temp as $$
  -- Limit to the requested polls
  with input_polls as (
    select p.*
    from public.poll p
    where p.id = any (p_poll_ids)
  ),

  -- Latest vote per (poll_id, user_id), using your deterministic tie-breaker
  latest as (
    select distinct on (v.poll_id, v.user_id)
           v.poll_id, v.user_id, v.option_id, v.voted_at, v.id
    from public.vote v
    where v.poll_id = any (p_poll_ids)
    order by v.poll_id, v.user_id, v.voted_at desc, v.id desc
  ),

  -- Counts per (poll, option) + most recent voted_at per poll
  tally as (
    select l.poll_id,
           l.option_id,
           count(*)::bigint as count,
           max(l.voted_at)   as latest_voted_at
    from latest l
    group by l.poll_id, l.option_id
  ),

  -- Per-poll totals and last activity time (read-time derivation)
  per_poll as (
    select ip.id          as poll_id,
           ip.slug,
           ip.question,
           ip.status,
           ip.category,
           ip.opened_at,
           ip.created_at,
           coalesce(sum(t.count) filter (where t.poll_id = ip.id), 0)::bigint as total,
           max(t.latest_voted_at) filter (where t.poll_id = ip.id)           as updated_at
    from input_polls ip
    left join tally t on t.poll_id = ip.id
    group by ip.id, ip.slug, ip.question, ip.status, ip.category, ip.opened_at, ip.created_at
  ),

  -- Option rows (include created_at for stable UI ordering)
  option_rows as (
    select o.poll_id, o.id as option_id, o.label, o.created_at
    from public.poll_option o
    where o.poll_id = any (p_poll_ids)
  ),

  -- Options with zero-safe counts
  option_with_counts as (
    select
      o.poll_id,
      o.option_id,
      o.label,
      o.created_at,
      coalesce(t.count, 0)::bigint as count
    from option_rows o
    left join tally t
      on t.poll_id = o.poll_id
     and t.option_id = o.option_id
  ),

  -- JSON array of `{optionId,label}` (UI "options" block)
  options_json as (
    select
      o.poll_id,
      jsonb_agg(
        jsonb_build_object(
          'optionId', o.option_id,
          'label',    o.label
        )
        order by o.created_at, o.option_id
      ) as options
    from option_rows o
    group by o.poll_id
  ),

  -- JSON array of result items `{optionId,label,count,pct}` (UI "results.items")
  results_items as (
    select
      owc.poll_id,
      jsonb_agg(
        jsonb_build_object(
          'optionId', owc.option_id,
          'label',    owc.label,
          'count',    owc.count,
          'pct',
            case
              when pp.total > 0
                then round((owc.count::numeric / nullif(pp.total, 0)::numeric) * 100, 1)
              else 0
            end
        )
        order by owc.created_at, owc.option_id
      ) as items
    from option_with_counts owc
    join per_poll pp on pp.poll_id = owc.poll_id
    group by owc.poll_id
  )

  -- Final card rows (one per poll)
  select
    pp.poll_id,
    pp.slug,
    pp.question,
    pp.status,
    pp.category,
    pp.opened_at,
    pp.created_at,
    coalesce(oj.options, '[]'::jsonb) as options,
    pp.total                          as results_total,
    pp.updated_at                     as results_updated_at,
    (pp.total < p_quorum)             as results_warming_up,
    coalesce(ri.items, '[]'::jsonb)   as results_items
  from per_poll pp
  left join options_json  oj on oj.poll_id = pp.poll_id
  left join results_items ri on ri.poll_id = pp.poll_id;
$$;
