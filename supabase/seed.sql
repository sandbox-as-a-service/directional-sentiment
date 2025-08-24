-- seeds/opinion_registry_seed.sql
-- Pure SQL seed for your existing schema
-- - Upserts polls
-- - Inserts options (deduped)
-- - Inserts votes using first 4 users in auth.users (by created_at)
-- Re-runnable thanks to ON CONFLICT and idempotency keys.
begin;

-- 0) Polls (upsert by slug)
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
    now() - interval '2 days',
    null,
    null
  ),
  (
    'ketchup-on-steak',
    'Ketchup on steak — acceptable?',
    'closed',
    'Culture',
    now() - interval '7 days',
    now() - interval '1 day',
    null
  ),
  (
    'should-tipping-end',
    'Should the US move away from tipping?',
    'open',
    'Politics',
    now() - interval '3 days',
    null,
    null
  ),
  (
    'nba-goat',
    'Who is the NBA GOAT?',
    'draft',
    'Sports',
    null,
    null,
    null
  ),
  (
    'pineapple-on-pizza',
    'Pineapple on pizza?',
    'open',
    'Culture',
    now() - interval '1 day',
    null,
    now() - interval '20 hours'
  )
on conflict (slug) do update
set
  question = excluded.question,
  status = excluded.status,
  category = excluded.category,
  opened_at = excluded.opened_at,
  closed_at = excluded.closed_at,
  featured_at = excluded.featured_at;

-- 1) Options (insert-from-select; dedupe by (poll_id,label))
-- best-bj-flavor
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

-- ketchup-on-steak
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
      ('No'),
      ('Only on well-done')
  ) as x (label) on true
where
  p.slug = 'ketchup-on-steak'
on conflict (poll_id, label) do nothing;

-- should-tipping-end
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
      ('No'),
      ('Depends on wages')
  ) as x (label) on true
where
  p.slug = 'should-tipping-end'
on conflict (poll_id, label) do nothing;

-- nba-goat (draft)
insert into
  public.poll_option (poll_id, label)
select
  p.id,
  x.label
from
  public.poll p
  join (
    values
      ('Jordan'),
      ('LeBron'),
      ('Kareem')
  ) as x (label) on true
where
  p.slug = 'nba-goat'
on conflict (poll_id, label) do nothing;

-- pineapple-on-pizza
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
  p.slug = 'pineapple-on-pizza'
on conflict (poll_id, label) do nothing;

-- 2) Votes (three blocks). Uses first 4 users in auth.users by created_at.
-- NOTE: requires service-role (or permissive RLS) to insert.
-- Ben & Jerry's (u4 flips from Half Baked → Cookie Dough)
with
  picked_users as (
    select
      id,
      row_number() over (
        order by
          created_at
      ) rn
    from
      auth.users
    where
      email is not null
    limit
      4
  ),
  u as (
    select
      (
        select
          id
        from
          picked_users
        where
          rn = 1
      ) as u1,
      (
        select
          id
        from
          picked_users
        where
          rn = 2
      ) as u2,
      (
        select
          id
        from
          picked_users
        where
          rn = 3
      ) as u3,
      (
        select
          id
        from
          picked_users
        where
          rn = 4
      ) as u4
  ),
  opt as (
    select
      p.slug,
      o.label,
      o.id as option_id,
      p.id as poll_id
    from
      public.poll p
      join public.poll_option o on o.poll_id = p.id
  )
insert into
  public.vote (
    poll_id,
    option_id,
    user_id,
    voted_at,
    idempotency_key
  )
select
  o.poll_id,
  o.option_id,
  u.u1,
  now() - interval '36 hours',
  'u1-bj-1'
from
  opt o
  cross join u
where
  o.slug = 'best-bj-flavor'
  and o.label = 'Cookie Dough'
  and u.u1 is not null
union all
select
  o.poll_id,
  o.option_id,
  u.u2,
  now() - interval '30 hours',
  'u2-bj-1'
from
  opt o
  cross join u
where
  o.slug = 'best-bj-flavor'
  and o.label = 'Half Baked'
  and u.u2 is not null
union all
select
  o.poll_id,
  o.option_id,
  u.u3,
  now() - interval '28 hours',
  'u3-bj-1'
from
  opt o
  cross join u
where
  o.slug = 'best-bj-flavor'
  and o.label = 'Cherry Garcia'
  and u.u3 is not null
union all
select
  o.poll_id,
  o.option_id,
  u.u4,
  now() - interval '20 hours',
  'u4-bj-1'
from
  opt o
  cross join u
where
  o.slug = 'best-bj-flavor'
  and o.label = 'Half Baked'
  and u.u4 is not null
union all
select
  o.poll_id,
  o.option_id,
  u.u4,
  now() - interval '10 hours',
  'u4-bj-2'
from
  opt o
  cross join u
where
  o.slug = 'best-bj-flavor'
  and o.label = 'Cookie Dough'
  and u.u4 is not null
on conflict do nothing;

-- Pineapple on pizza (u1 Yes, u2 No, u3 Yes)
with
  picked_users as (
    select
      id,
      row_number() over (
        order by
          created_at
      ) rn
    from
      auth.users
    where
      email is not null
    limit
      4
  ),
  u as (
    select
      (
        select
          id
        from
          picked_users
        where
          rn = 1
      ) as u1,
      (
        select
          id
        from
          picked_users
        where
          rn = 2
      ) as u2,
      (
        select
          id
        from
          picked_users
        where
          rn = 3
      ) as u3,
      (
        select
          id
        from
          picked_users
        where
          rn = 4
      ) as u4
  ),
  opt as (
    select
      p.slug,
      o.label,
      o.id as option_id,
      p.id as poll_id
    from
      public.poll p
      join public.poll_option o on o.poll_id = p.id
  )
insert into
  public.vote (
    poll_id,
    option_id,
    user_id,
    voted_at,
    idempotency_key
  )
select
  o.poll_id,
  o.option_id,
  u.u1,
  now() - interval '18 hours',
  'u1-pine-1'
from
  opt o
  cross join u
where
  o.slug = 'pineapple-on-pizza'
  and o.label = 'Yes'
  and u.u1 is not null
union all
select
  o.poll_id,
  o.option_id,
  u.u2,
  now() - interval '17 hours',
  'u2-pine-1'
from
  opt o
  cross join u
where
  o.slug = 'pineapple-on-pizza'
  and o.label = 'No'
  and u.u2 is not null
union all
select
  o.poll_id,
  o.option_id,
  u.u3,
  now() - interval '12 hours',
  'u3-pine-1'
from
  opt o
  cross join u
where
  o.slug = 'pineapple-on-pizza'
  and o.label = 'Yes'
  and u.u3 is not null
on conflict do nothing;

-- Tipping (u1 Depends, u2 Yes then flips to Depends, u3 Yes)
with
  picked_users as (
    select
      id,
      row_number() over (
        order by
          created_at
      ) rn
    from
      auth.users
    where
      email is not null
    limit
      4
  ),
  u as (
    select
      (
        select
          id
        from
          picked_users
        where
          rn = 1
      ) as u1,
      (
        select
          id
        from
          picked_users
        where
          rn = 2
      ) as u2,
      (
        select
          id
        from
          picked_users
        where
          rn = 3
      ) as u3,
      (
        select
          id
        from
          picked_users
        where
          rn = 4
      ) as u4
  ),
  opt as (
    select
      p.slug,
      o.label,
      o.id as option_id,
      p.id as poll_id
    from
      public.poll p
      join public.poll_option o on o.poll_id = p.id
  )
insert into
  public.vote (
    poll_id,
    option_id,
    user_id,
    voted_at,
    idempotency_key
  )
select
  o.poll_id,
  o.option_id,
  u.u1,
  now() - interval '8 hours',
  'u1-tip-1'
from
  opt o
  cross join u
where
  o.slug = 'should-tipping-end'
  and o.label = 'Depends on wages'
  and u.u1 is not null
union all
select
  o.poll_id,
  o.option_id,
  u.u2,
  now() - interval '7 hours',
  'u2-tip-1'
from
  opt o
  cross join u
where
  o.slug = 'should-tipping-end'
  and o.label = 'Yes'
  and u.u2 is not null
union all
select
  o.poll_id,
  o.option_id,
  u.u3,
  now() - interval '6 hours',
  'u3-tip-1'
from
  opt o
  cross join u
where
  o.slug = 'should-tipping-end'
  and o.label = 'Yes'
  and u.u3 is not null
union all
select
  o.poll_id,
  o.option_id,
  u.u2,
  now() - interval '1 hour',
  'u2-tip-2'
from
  opt o
  cross join u
where
  o.slug = 'should-tipping-end'
  and o.label = 'Depends on wages'
  and u.u2 is not null
on conflict do nothing;

commit;
