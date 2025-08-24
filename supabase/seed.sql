-- seeds/opinion_registry_seed_trimmed_with_users.sql
begin;

-- Ensure pgcrypto
create extension if not exists pgcrypto;

-- =========================================================
-- A) Prune any old sample polls (cascades options & votes)
-- =========================================================
delete from public.poll
where
  slug in (
    'ketchup-on-steak',
    'nba-goat',
    'pineapple-on-pizza'
  );

-- =========================================================
-- B) Upsert the two polls (force OPEN)
-- =========================================================
insert into
  public.poll (
    slug,
    question,
    status,
    category,
    opened_at,
    closed_at,
    featured_at
  )
values
  (
    'best-bj-flavor',
    'What''s the #1 Ben & Jerry''s flavor?',
    'open',
    'Products',
    now(),
    null,
    null
  ),
  (
    'should-tipping-end',
    'Should the US move away from tipping?',
    'open',
    'Politics',
    now(),
    null,
    null
  )
on conflict (slug) do update
set
  question = excluded.question,
  status = 'open',
  category = excluded.category,
  opened_at = coalesce(public.poll.opened_at, excluded.opened_at),
  closed_at = null,
  featured_at = null;

-- =========================================================
-- C) Options — Ben & Jerry's (keep as-is)
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
  p.slug = 'best-bj-flavor'
on conflict (poll_id, label) do nothing;

-- =========================================================
-- D) Options — Tipping (ONLY Yes / No)
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
  p.slug = 'should-tipping-end'
on conflict (poll_id, label) do nothing;

-- Prune any other pre-existing options for this poll
delete from public.poll_option o using public.poll p
where
  o.poll_id = p.id
  and p.slug = 'should-tipping-end'
  and o.label not in ('Yes', 'No');
