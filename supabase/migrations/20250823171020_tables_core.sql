-- =============================================================================
-- Migration: tables_core.sql
-- Purpose : Create core Opinion Registry MVP tables (poll, poll_option, vote)
-- Notes   :
--   - Uses UUID PKs via pgcrypto.gen_random_uuid()
--   - Append-only votes; "latest per user" determines current choice
--   - User-scoped idempotency to dedupe client retries
--   - Composite FK ensures vote.option_id belongs to the same poll_id
-- =============================================================================
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
  status public.poll_status not null default 'draft',
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
  created_at timestamptz not null default now(),
  -- IMPORTANT: guarantees (poll_id, id) is unique so other tables can safely reference it
  constraint uq_poll_option_pair unique (poll_id, id)
);

comment on table public.poll_option is 'Per-poll answer choices (each poll owns its own option rows)';

comment on column public.poll_option.id is 'Primary key (UUID, server-generated)';

comment on column public.poll_option.poll_id is 'FK → poll.id (ON DELETE CASCADE)';

comment on column public.poll_option.label is 'Display label for the option (e.g., Yes / No)';

comment on column public.poll_option.created_at is 'Creation time for ordering/debugging';

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
  -- (prevents mismatching poll/option pairs). Requires uq_poll_option_pair above.
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
