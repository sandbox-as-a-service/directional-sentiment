-- seeds/opinion_registry_seed.sql
begin;

-- Keep UUID generation available
create extension if not exists pgcrypto;

-- =========================================================
-- Nuke existing sample data (DEV ONLY)
-- - Truncate polls; CASCADE clears poll_option and vote
-- =========================================================
truncate table public.poll cascade;

-- =========================================================
-- Seed: two OPEN polls with realistic, staggered timestamps
-- - created_at is when the poll was authored
-- - opened_at is when it became visible in the feed
-- - updated_at set to opened_at on insert for sanity
-- =========================================================
insert into
  public.poll (
    slug,
    question,
    status,
    category,
    opened_at,
    closed_at,
    featured_at,
    created_at,
    updated_at
  )
values
  (
    'best-bj-flavor',
    'What''s the #1 Ben & Jerry''s flavor?',
    'open',
    'Products',
    '2025-08-24T16:30:00Z', -- opened yesterday afternoon UTC
    null,
    null,
    '2025-08-20T14:00:00Z', -- authored a few days earlier
    '2025-08-24T16:30:00Z'
  ),
  (
    'should-tipping-end',
    'Should the US move away from tipping?',
    'open',
    'Politics',
    '2025-08-25T09:05:00Z', -- opened today morning UTC (newer)
    null,
    null,
    '2025-08-21T11:15:00Z',
    '2025-08-25T09:05:00Z'
  );

-- =========================================================
-- Options — Ben & Jerry's
-- =========================================================
insert into
  public.poll_option (poll_id, label)
select
  p.id,
  x.label
from
  public.poll p
  join (
    values
      ('Half Baked'),
      ('Cookie Dough'),
      ('Cherry Garcia'),
      ('Chocolate Fudge Brownie')
  ) as x (label) on true
where
  p.slug = 'best-bj-flavor';

-- =========================================================
-- Options — Tipping (Yes/No)
-- =========================================================
insert into
  public.poll_option (poll_id, label)
select
  p.id,
  x.label
from
  public.poll p
  join (
    values
      ('Yes'),
      ('No')
  ) as x (label) on true
where
  p.slug = 'should-tipping-end';

commit;
