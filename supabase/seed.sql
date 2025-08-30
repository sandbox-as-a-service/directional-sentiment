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
-- Seed: 21 OPEN polls with realistic, staggered timestamps
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
  -- existing 2
  (
    'best-bj-flavor',
    'What''s the #1 Ben & Jerry''s flavor?',
    'open',
    'Products',
    '2025-08-24T16:30:00Z',
    null,
    null,
    '2025-08-20T14:00:00Z',
    '2025-08-24T16:30:00Z'
  ),
  (
    'should-tipping-end',
    'Should the US move away from tipping?',
    'open',
    'Politics',
    '2025-08-25T09:05:00Z',
    null,
    null,
    '2025-08-21T11:15:00Z',
    '2025-08-25T09:05:00Z'
  ),
  -- 19 new yes/no polls
  (
    'ban-smartphones-in-class',
    'Should schools ban smartphones in class?',
    'open',
    'Education',
    '2025-08-25T10:15:00Z',
    null,
    null,
    '2025-08-22T09:10:00Z',
    '2025-08-25T10:15:00Z'
  ),
  (
    'abolish-daylight-saving',
    'Should the US end Daylight Saving Time?',
    'open',
    'Policy',
    '2025-08-25T12:00:00Z',
    null,
    null,
    '2025-08-22T08:40:00Z',
    '2025-08-25T12:00:00Z'
  ),
  (
    'require-id-to-vote',
    'Should a government photo ID be required to vote?',
    'open',
    'Politics',
    '2025-08-25T14:30:00Z',
    null,
    null,
    '2025-08-22T10:25:00Z',
    '2025-08-25T14:30:00Z'
  ),
  (
    'ban-tiktok',
    'Should TikTok be banned in the US?',
    'open',
    'Tech',
    '2025-08-25T16:45:00Z',
    null,
    null,
    '2025-08-22T12:55:00Z',
    '2025-08-25T16:45:00Z'
  ),
  (
    'four-day-workweek',
    'Should more companies move to a 4-day workweek?',
    'open',
    'Economy',
    '2025-08-26T09:10:00Z',
    null,
    null,
    '2025-08-23T09:00:00Z',
    '2025-08-26T09:10:00Z'
  ),
  (
    'build-high-speed-rail',
    'Should the US invest heavily in high-speed rail?',
    'open',
    'Transportation',
    '2025-08-26T11:00:00Z',
    null,
    null,
    '2025-08-23T08:30:00Z',
    '2025-08-26T11:00:00Z'
  ),
  (
    'plastic-bag-ban',
    'Should single-use plastic bags be banned nationwide?',
    'open',
    'Environment',
    '2025-08-26T13:05:00Z',
    null,
    null,
    '2025-08-23T10:35:00Z',
    '2025-08-26T13:05:00Z'
  ),
  (
    'ban-single-family-zoning',
    'Should cities end single-family-only zoning?',
    'open',
    'Housing',
    '2025-08-26T15:15:00Z',
    null,
    null,
    '2025-08-23T12:10:00Z',
    '2025-08-26T15:15:00Z'
  ),
  (
    'ai-regulation',
    'Should the US regulate consumer AI more strictly?',
    'open',
    'Tech',
    '2025-08-27T08:30:00Z',
    null,
    null,
    '2025-08-24T07:50:00Z',
    '2025-08-27T08:30:00Z'
  ),
  (
    'crypto-legal-tender',
    'Should Bitcoin be legal tender in any US state?',
    'open',
    'Economy',
    '2025-08-27T10:20:00Z',
    null,
    null,
    '2025-08-24T08:25:00Z',
    '2025-08-27T10:20:00Z'
  ),
  (
    'student-debt-cancellation',
    'Should federal student loans be broadly canceled?',
    'open',
    'Politics',
    '2025-08-27T12:40:00Z',
    null,
    null,
    '2025-08-24T09:05:00Z',
    '2025-08-27T12:40:00Z'
  ),
  (
    'national-sales-tax',
    'Should the US adopt a national sales tax instead of income tax?',
    'open',
    'Economy',
    '2025-08-27T14:50:00Z',
    null,
    null,
    '2025-08-24T11:30:00Z',
    '2025-08-27T14:50:00Z'
  ),
  (
    'gas-stove-restrictions',
    'Should new homes be restricted from installing gas stoves?',
    'open',
    'Policy',
    '2025-08-28T09:00:00Z',
    null,
    null,
    '2025-08-25T08:10:00Z',
    '2025-08-28T09:00:00Z'
  ),
  (
    'mask-mandates',
    'Should mask mandates return during severe outbreaks?',
    'open',
    'Health',
    '2025-08-28T11:15:00Z',
    null,
    null,
    '2025-08-25T09:20:00Z',
    '2025-08-28T11:15:00Z'
  ),
  (
    'open-immigration-policy',
    'Should the US have a more open legal immigration policy?',
    'open',
    'Immigration',
    '2025-08-28T13:30:00Z',
    null,
    null,
    '2025-08-25T11:45:00Z',
    '2025-08-28T13:30:00Z'
  ),
  (
    'ban-legacy-admissions',
    'Should colleges end legacy admissions?',
    'open',
    'Education',
    '2025-08-28T15:45:00Z',
    null,
    null,
    '2025-08-25T12:55:00Z',
    '2025-08-28T15:45:00Z'
  ),
  (
    'nfl-overtime-change',
    'Should the NFL switch overtime to college rules?',
    'open',
    'Sports',
    '2025-08-29T09:05:00Z',
    null,
    null,
    '2025-08-26T08:35:00Z',
    '2025-08-29T09:05:00Z'
  ),
  (
    'universal-basic-income',
    'Should the US try a nationwide universal basic income pilot?',
    'open',
    'Economy',
    '2025-08-29T11:25:00Z',
    null,
    null,
    '2025-08-26T09:40:00Z',
    '2025-08-29T11:25:00Z'
  ),
  (
    'federal-abortion-ban',
    'Should there be a federal abortion ban?',
    'open',
    'Politics',
    '2025-08-29T13:35:00Z',
    null,
    null,
    '2025-08-26T12:05:00Z',
    '2025-08-29T13:35:00Z'
  );

-- =========================================================
-- Options — Ben & Jerry's (multi-choice)
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
-- Options — all Yes/No polls (including "should-tipping-end")
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
  p.slug in (
    'should-tipping-end',
    'ban-smartphones-in-class',
    'abolish-daylight-saving',
    'require-id-to-vote',
    'ban-tiktok',
    'four-day-workweek',
    'build-high-speed-rail',
    'plastic-bag-ban',
    'ban-single-family-zoning',
    'ai-regulation',
    'crypto-legal-tender',
    'student-debt-cancellation',
    'national-sales-tax',
    'gas-stove-restrictions',
    'mask-mandates',
    'open-immigration-policy',
    'ban-legacy-admissions',
    'nfl-overtime-change',
    'universal-basic-income',
    'federal-abortion-ban'
  );

commit;
