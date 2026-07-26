-- Leco - least-privilege policies for the Wave 1 schema.
-- Depends on supabase/migrations/0001_initial_schema.sql. See docs/security.md.

begin;

create schema if not exists private;

revoke all on schema private from public;
revoke all on schema private from anon;
grant usage on schema private to authenticated;

create or replace function private.current_user_is_active()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.profiles as profile
    where profile.id = auth.uid()
      and profile.account_status = 'active'
      and profile.deletion_requested_at is null
      and (
        profile.suspended_until is null
        or profile.suspended_until <= pg_catalog.statement_timestamp()
      )
  );
$$;

create or replace function private.current_user_is_admin_mfa()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select
    auth.uid() is not null
    and coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '') = 'admin'
    and coalesce(auth.jwt() ->> 'aal', '') = 'aal2';
$$;

create or replace function private.users_are_blocked(
  first_user_id uuid,
  second_user_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select
    first_user_id is null
    or second_user_id is null
    or exists (
      select 1
      from public.blocks as block
      where
        (
          block.blocker_id = first_user_id
          and block.blocked_id = second_user_id
        )
        or (
          block.blocker_id = second_user_id
          and block.blocked_id = first_user_id
        )
    );
$$;

create or replace function private.can_view_profile(target_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select
    auth.uid() = target_user_id
    or (
      private.current_user_is_active()
      and not private.users_are_blocked(auth.uid(), target_user_id)
      and exists (
        select 1
        from public.profiles as target
        where target.id = target_user_id
          and target.account_status = 'active'
          and target.is_discoverable
          and target.is_profile_complete
          and target.deletion_requested_at is null
          and (
            target.suspended_until is null
            or target.suspended_until <= pg_catalog.statement_timestamp()
          )
      )
    );
$$;

create or replace function private.can_view_match(target_match_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select
    private.current_user_is_active()
    and exists (
      select 1
      from public.matches as match
      where match.id = target_match_id
        and match.status <> 'blocked'
        and auth.uid() in (match.user_low_id, match.user_high_id)
        and not private.users_are_blocked(
          match.user_low_id,
          match.user_high_id
        )
    );
$$;

create or replace function private.can_access_active_match(
  target_match_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.matches as match
    where match.id = target_match_id
      and match.status = 'active'
      and private.can_view_match(match.id)
  );
$$;

revoke all on function private.current_user_is_active() from public, anon;
revoke all on function private.current_user_is_admin_mfa() from public, anon;
revoke all on function private.users_are_blocked(uuid, uuid) from public, anon;
revoke all on function private.can_view_profile(uuid) from public, anon;
revoke all on function private.can_view_match(uuid) from public, anon;
revoke all on function private.can_access_active_match(uuid) from public, anon;

grant execute on function private.current_user_is_active() to authenticated;
grant execute on function private.current_user_is_admin_mfa() to authenticated;
grant execute on function private.users_are_blocked(uuid, uuid) to authenticated;
grant execute on function private.can_view_profile(uuid) to authenticated;
grant execute on function private.can_view_match(uuid) to authenticated;
grant execute on function private.can_access_active_match(uuid) to authenticated;

alter table public.profiles enable row level security;
alter table public.profile_photos enable row level security;
alter table public.interests enable row level security;
alter table public.user_interests enable row level security;
alter table public.user_locations enable row level security;
alter table public.user_presence enable row level security;
alter table public.likes enable row level security;
alter table public.matches enable row level security;
alter table public.messages enable row level security;
alter table public.blocks enable row level security;
alter table public.reports enable row level security;
alter table public.moderation_actions enable row level security;
alter table public.audit_logs enable row level security;

alter table public.profiles force row level security;
alter table public.profile_photos force row level security;
alter table public.interests force row level security;
alter table public.user_interests force row level security;
alter table public.user_locations force row level security;
alter table public.user_presence force row level security;
alter table public.likes force row level security;
alter table public.matches force row level security;
alter table public.messages force row level security;
alter table public.blocks force row level security;
alter table public.reports force row level security;
alter table public.moderation_actions force row level security;
alter table public.audit_logs force row level security;

-- Start from no client privileges. Every grant below is deliberate. Sensitive
-- writes use validated/rate-limited Route Handlers or narrowly scoped RPCs.
revoke all on table public.profiles from public, anon, authenticated;
revoke all on table public.profile_photos from public, anon, authenticated;
revoke all on table public.interests from public, anon, authenticated;
revoke all on table public.user_interests from public, anon, authenticated;
revoke all on table public.user_locations from public, anon, authenticated;
revoke all on table public.user_presence from public, anon, authenticated;
revoke all on table public.likes from public, anon, authenticated;
revoke all on table public.matches from public, anon, authenticated;
revoke all on table public.messages from public, anon, authenticated;
revoke all on table public.blocks from public, anon, authenticated;
revoke all on table public.reports from public, anon, authenticated;
revoke all on table public.moderation_actions from public, anon, authenticated;
revoke all on table public.audit_logs from public, anon, authenticated;

-- birth_date and account/moderation state are intentionally absent. A user
-- reads their private profile through an authorized Route Handler.
grant select (
  id,
  first_name,
  gender,
  searching_for,
  bio,
  is_discoverable,
  is_profile_complete,
  created_at,
  updated_at
) on table public.profiles to authenticated;

grant select (
  id,
  profile_id,
  cloudinary_public_id,
  cloudinary_version,
  secure_url,
  sort_order,
  width,
  height,
  created_at
) on table public.profile_photos to authenticated;

grant select (
  id,
  slug,
  label_fr
) on table public.interests to authenticated;

grant select (
  user_id,
  interest_id,
  created_at
) on table public.user_interests to authenticated;

-- Only approximate presence data is exposed. Exact heartbeat/activation/expiry
-- timestamps remain server-side.
grant select (
  user_id,
  availability_status,
  mood
) on table public.user_presence to authenticated;

grant select (
  id,
  sender_id,
  recipient_id,
  status,
  created_at,
  matched_at,
  resolved_at
) on table public.likes to authenticated;

grant select (
  id,
  user_low_id,
  user_high_id,
  status,
  matched_at,
  ended_at,
  last_message_at,
  created_at,
  updated_at
) on table public.matches to authenticated;

-- content_hash is an anti-abuse implementation detail and is not exposed.
grant select (
  id,
  match_id,
  sender_id,
  content,
  created_at,
  read_at,
  deleted_at
) on table public.messages to authenticated;

grant select (
  id,
  blocker_id,
  blocked_id,
  created_at
) on table public.blocks to authenticated;

-- Table-level SELECT is required for the admin policies below. RLS returns no
-- rows to ordinary authenticated users.
grant select on table public.reports to authenticated;
grant select on table public.moderation_actions to authenticated;
grant select on table public.audit_logs to authenticated;

drop policy if exists profiles_select_visible on public.profiles;
create policy profiles_select_visible
on public.profiles
for select
to authenticated
using (private.can_view_profile(id));

drop policy if exists profile_photos_select_visible on public.profile_photos;
create policy profile_photos_select_visible
on public.profile_photos
for select
to authenticated
using (
  deleted_at is null
  and private.can_view_profile(profile_id)
);

drop policy if exists interests_select_active on public.interests;
create policy interests_select_active
on public.interests
for select
to authenticated
using (
  is_active
  and auth.uid() is not null
);

drop policy if exists user_interests_select_visible on public.user_interests;
create policy user_interests_select_visible
on public.user_interests
for select
to authenticated
using (
  user_id = auth.uid()
  or private.can_view_profile(user_id)
);

-- This table intentionally has no policies and no grants. Even the row owner
-- cannot read coordinates through PostgREST.
drop policy if exists user_locations_select on public.user_locations;
drop policy if exists user_locations_insert on public.user_locations;
drop policy if exists user_locations_update on public.user_locations;
drop policy if exists user_locations_delete on public.user_locations;

drop policy if exists user_presence_select_visible on public.user_presence;
create policy user_presence_select_visible
on public.user_presence
for select
to authenticated
using (
  user_id = auth.uid()
  or (
    availability_status = 'available'
    and available_until > pg_catalog.statement_timestamp()
    and last_heartbeat_at >
      pg_catalog.statement_timestamp() - interval '5 minutes'
    and private.can_view_profile(user_id)
  )
);

drop policy if exists likes_select_sent on public.likes;
create policy likes_select_sent
on public.likes
for select
to authenticated
using (
  sender_id = auth.uid()
  and private.current_user_is_active()
  and not private.users_are_blocked(sender_id, recipient_id)
);

drop policy if exists matches_select_member on public.matches;
create policy matches_select_member
on public.matches
for select
to authenticated
using (private.can_view_match(id));

drop policy if exists messages_select_match_member on public.messages;
create policy messages_select_match_member
on public.messages
for select
to authenticated
using (private.can_access_active_match(match_id));

drop policy if exists blocks_select_created on public.blocks;
create policy blocks_select_created
on public.blocks
for select
to authenticated
using (blocker_id = auth.uid());

drop policy if exists reports_select_admin_mfa on public.reports;
create policy reports_select_admin_mfa
on public.reports
for select
to authenticated
using (private.current_user_is_admin_mfa());

drop policy if exists moderation_actions_select_admin_mfa
on public.moderation_actions;
create policy moderation_actions_select_admin_mfa
on public.moderation_actions
for select
to authenticated
using (private.current_user_is_admin_mfa());

drop policy if exists audit_logs_select_admin_mfa on public.audit_logs;
create policy audit_logs_select_admin_mfa
on public.audit_logs
for select
to authenticated
using (private.current_user_is_admin_mfa());

commit;
