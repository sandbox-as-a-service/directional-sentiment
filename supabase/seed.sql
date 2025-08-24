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

-- =========================================================
-- E) Supabase Auth users (email-verified; password = 'test')
-- NOTE: password hash belongs on auth.users.encrypted_password
-- =========================================================
-- Create/ensure JOHN with verified email and bcrypt('test')
with
  ins_john as (
    insert into
      auth.users (
        id,
        email,
        email_confirmed_at,
        encrypted_password,
        raw_app_meta_data,
        raw_user_meta_data,
        created_at,
        updated_at,
        aud,
        role
      )
    select
      gen_random_uuid(),
      'john.doe@test.com',
      now(),
      crypt ('test', gen_salt ('bf')),
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{}'::jsonb,
      now(),
      now(),
      'authenticated',
      'authenticated'
    where
      not exists (
        select
          1
        from
          auth.users
        where
          email = 'john.doe@test.com'
      )
    returning
      id,
      email
  ),
  john_row as (
    select
      id,
      email
    from
      ins_john
    union all
    select
      id,
      email
    from
      auth.users
    where
      email = 'john.doe@test.com'
  ),
  -- Create/ensure JANE with verified email and bcrypt('test')
  ins_jane as (
    insert into
      auth.users (
        id,
        email,
        email_confirmed_at,
        encrypted_password,
        raw_app_meta_data,
        raw_user_meta_data,
        created_at,
        updated_at,
        aud,
        role
      )
    select
      gen_random_uuid(),
      'jane.doe@test.com',
      now(),
      crypt ('test', gen_salt ('bf')),
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{}'::jsonb,
      now(),
      now(),
      'authenticated',
      'authenticated'
    where
      not exists (
        select
          1
        from
          auth.users
        where
          email = 'jane.doe@test.com'
      )
    returning
      id,
      email
  ),
  jane_row as (
    select
      id,
      email
    from
      ins_jane
    union all
    select
      id,
      email
    from
      auth.users
    where
      email = 'jane.doe@test.com'
  ),
  -- Union both users
  all_users as (
    select
      *
    from
      john_row
    union all
    select
      *
    from
      jane_row
  )
  -- Ensure an 'email' identity exists for each (no password fields here)
insert into
  auth.identities (
    id,
    user_id,
    provider,
    provider_id,
    identity_data,
    created_at,
    updated_at,
    last_sign_in_at
  )
select
  gen_random_uuid(),
  u.id,
  'email',
  u.email,
  jsonb_build_object('sub', u.id::text, 'email', u.email),
  now(),
  now(),
  now()
from
  all_users u
on conflict (provider, provider_id) do update
set
  identity_data = excluded.identity_data,
  updated_at = now();

commit;
