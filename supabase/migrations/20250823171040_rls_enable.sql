-- =============================================================================
-- Migration: rls_enable.sql
-- Purpose : Deny-by-default posture; policies can be added in later migrations
-- Notes   :
--   - This flips RLS ON for all core tables
--   - Without explicit policies, queries will be blocked (which is intended)
-- =============================================================================
alter table public.poll enable row level security;

alter table public.poll_option enable row level security;

alter table public.vote enable row level security;
