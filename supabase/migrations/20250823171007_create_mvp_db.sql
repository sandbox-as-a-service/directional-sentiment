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

comment on extension pgcrypto is 'Provides gen_random_uuid() used for UUID primary keys';

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

comment on type poll_status is 'Lifecycle state for a poll: draft (hidden), open (votable), closed (results only)';

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

comment on index idx_poll_created_desc is 'Keyset pagination index for newest-first poll feed (created_at DESC, id DESC)';

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

comment on function public.set_updated_at () is 'Before-update trigger function that refreshes updated_at';

drop trigger if exists trg_poll_updated_at on public.poll;

create trigger trg_poll_updated_at before
update on public.poll for each row
execute function public.set_updated_at ();

comment on trigger trg_poll_updated_at on public.poll is 'Maintains updated_at timestamp on UPDATE of poll';

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

comment on index uq_poll_option_label is 'Prevents duplicate option labels within the same poll';

-- Support a composite FK from vote to (poll_id, option_id) pair:
-- This index guarantees (poll_id, id) is unique so other tables can safely reference it.
create unique index if not exists uq_poll_option_pair on public.poll_option (poll_id, id);

comment on index uq_poll_option_pair is 'Ensures (poll_id, option_id) uniqueness for composite FK usage';

-- Convenience index for frequent "all options for poll" lookups
create index if not exists idx_poll_option_poll on public.poll_option (poll_id);

comment on index idx_poll_option_poll is 'Speeds up listing options for a given poll';

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

comment on constraint fk_vote_poll on public.vote is 'FK to poll (cascade delete)';

comment on constraint fk_vote_option_pair on public.vote is 'Composite FK enforcing option belongs to the same poll';

comment on constraint fk_vote_user on public.vote is 'FK to Supabase auth.users (cascade delete)';

-- User-scoped idempotency:
-- Unique *only when idempotency_key is present* (NULLs are ignored by this partial index),
-- so users can have multiple rows with NULL key, but not duplicate non-NULL keys.
create unique index if not exists uq_vote_user_idempotency on public.vote (user_id, idempotency_key)
where
  idempotency_key is not null;

comment on index uq_vote_user_idempotency is 'Partial unique index: prevents duplicate non-NULL idempotency keys per user';

-- Helpful indexes for queries & tallying
-- All votes for a poll
create index if not exists idx_vote_poll on public.vote (poll_id);

comment on index idx_vote_poll is 'Speeds up fetching all votes for a poll';

-- All votes for a given option
create index if not exists idx_vote_option on public.vote (option_id);

comment on index idx_vote_option is 'Speeds up fetching all votes for a specific option';

-- Latest vote per (poll, user) lookups
create index if not exists idx_vote_poll_user on public.vote (poll_id, user_id);

comment on index idx_vote_poll_user is 'Supports per-user vote lookups within a poll';

-- Fast "current vote per user" (latest wins):
-- Order by voted_at DESC, id DESC to break ties deterministically.
create index if not exists idx_vote_latest_per_user on public.vote (poll_id, user_id, voted_at desc, id desc);

comment on index idx_vote_latest_per_user is 'Latest-wins ordering to compute current vote per (poll, user) efficiently';

-- =============================================================================
-- OPTIONALS (commented out for MVP; keep as reference)
-- =============================================================================
-- -- If you ever want case-insensitive unique labels per poll (e.g., "Yes" and "yes" considered same):
-- -- Requires citext or a functional unique index:
-- -- create extension if not exists citext;
-- -- create unique index uq_poll_option_label_ci on public.poll_option (poll_id, lower(label));
-- -- If you later enable RLS, you can keep raw votes private and let the server compute tallies.
-- -- Example skeleton (do not enable until you’re ready):
-- -- alter table public.vote enable row level security;
-- -- create policy "insert-own-vote" on public.vote
-- --   for insert to authenticated
-- --   with check (auth.uid() = user_id);
-- -- create policy "no-select-votes" on public.vote
-- --   for select to authenticated
-- --   using (false); -- block direct reads; app exposes /results instead
