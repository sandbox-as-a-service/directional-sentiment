-- =============================================================================
-- Migration: base_extensions_enums.sql
-- Purpose : Foundation pieces required by the schema
-- Notes   :
--   - Enables pgcrypto for UUID generation
--   - Removes unused extensions left from scaffolding (safe if absent)
--   - Defines the poll_status enum used by tables later
-- =============================================================================
-- 0) Ensure extension for UUID generation exists (safe if it already does)
create extension if not exists "pgcrypto";

-- Remove pg_graphql (will drop its member objects) — we don't use it in MVP
drop extension if exists pg_graphql;

-- Remove uuid-ossp (we prefer pgcrypto.gen_random_uuid())
drop extension if exists "uuid-ossp";

-- 1) Create PollStatus enum (draft | open | closed)
--    DO block makes it idempotent; it won't error if type already exists.
do $$
begin
  create type poll_status as enum ('draft', 'open', 'closed');
exception
  when duplicate_object then null;
end $$;
