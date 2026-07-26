-- Wave 1 hardening: audited mutation RPCs, scoped moderation and a durable,
-- atomic PostgreSQL rate-limit backend. Existing migrations remain immutable.

begin;

create table private.rate_limit_buckets (
  key_hash text not null,
  window_started_at timestamptz not null,
  consumed bigint not null,
  expires_at timestamptz not null,
  updated_at timestamptz not null default statement_timestamp(),
  primary key (key_hash, window_started_at),
  constraint rate_limit_buckets_key_format
    check (key_hash ~ '^[a-z0-9_.-]+:[a-f0-9]{64}$'),
  constraint rate_limit_buckets_consumed_positive
    check (consumed > 0),
  constraint rate_limit_buckets_expiry
    check (expires_at > window_started_at)
);

create index rate_limit_buckets_expiry_idx
  on private.rate_limit_buckets (expires_at);

revoke all on table private.rate_limit_buckets
  from public, anon, authenticated, service_role;

create or replace function private.current_user_can_moderate(
  p_permission text
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select
    private.current_user_is_active()
    and coalesce(auth.jwt() ->> 'aal', '') = 'aal2'
    and (
      coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '') = 'admin'
      or (
        coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '') = 'moderator'
        and exists (
          select 1
          from pg_catalog.jsonb_array_elements_text(
            coalesce(
              auth.jwt() -> 'app_metadata' -> 'permissions',
              '[]'::jsonb
            )
          ) as permission(value)
          where permission.value = p_permission
        )
      )
    );
$$;

revoke all on function private.current_user_can_moderate(text)
  from public, anon, authenticated;
grant execute on function private.current_user_can_moderate(text)
  to authenticated;

drop policy if exists reports_select_admin_mfa on public.reports;
drop policy if exists reports_select_moderator_mfa on public.reports;
create policy reports_select_moderator_mfa
on public.reports
for select
to authenticated
using (private.current_user_can_moderate('reports:read'));

drop policy if exists moderation_actions_select_admin_mfa
  on public.moderation_actions;
drop policy if exists moderation_actions_select_moderator_mfa
  on public.moderation_actions;
create policy moderation_actions_select_moderator_mfa
on public.moderation_actions
for select
to authenticated
using (private.current_user_can_moderate('moderation:read'));

create or replace function public.update_my_profile(
  p_first_name text,
  p_birth_date date,
  p_gender public.gender,
  p_searching_for public.gender[],
  p_bio text default null,
  p_is_discoverable boolean default true
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
begin
  if v_user_id is null then
    raise exception using
      errcode = '28000',
      message = 'authentication required';
  end if;

  if p_first_name is null
    or p_birth_date is null
    or p_gender is null
    or p_searching_for is null
    or cardinality(p_searching_for) not between 1 and 5
  then
    raise exception using
      errcode = '22023',
      message = 'invalid profile';
  end if;

  update public.profiles
  set
    first_name = p_first_name,
    birth_date = p_birth_date,
    gender = p_gender,
    searching_for = p_searching_for,
    bio = p_bio,
    is_discoverable = p_is_discoverable
  where id = v_user_id
    and account_status = 'active'
    and deletion_requested_at is null
    and (
      suspended_until is null
      or suspended_until <= statement_timestamp()
    );

  if not found then
    raise exception using
      errcode = '42501',
      message = 'profile update is not allowed';
  end if;
end;
$$;

create or replace function public.send_message(
  p_match_id uuid,
  p_content text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_message_id uuid;
begin
  if v_user_id is null then
    raise exception using
      errcode = '28000',
      message = 'authentication required';
  end if;

  if p_match_id is null or p_content is null then
    raise exception using
      errcode = '22023',
      message = 'invalid message';
  end if;

  insert into public.messages (match_id, sender_id, content)
  values (p_match_id, v_user_id, p_content)
  returning id into v_message_id;

  return v_message_id;
end;
$$;

create or replace function public.block_user(p_blocked_id uuid)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_block_id uuid;
begin
  if v_user_id is null then
    raise exception using
      errcode = '28000',
      message = 'authentication required';
  end if;

  if p_blocked_id is null or p_blocked_id = v_user_id then
    raise exception using
      errcode = '22023',
      message = 'invalid blocked user';
  end if;

  if not private.current_user_is_active()
    or not exists (
      select 1
      from public.profiles
      where id = p_blocked_id
    )
  then
    raise exception using
      errcode = '42501',
      message = 'block is not allowed';
  end if;

  insert into public.blocks (blocker_id, blocked_id)
  values (v_user_id, p_blocked_id)
  on conflict (blocker_id, blocked_id) do nothing
  returning id into v_block_id;

  if v_block_id is null then
    select id
    into v_block_id
    from public.blocks
    where blocker_id = v_user_id
      and blocked_id = p_blocked_id;
  end if;

  return v_block_id;
end;
$$;

create or replace function public.create_report(
  p_reported_user_id uuid,
  p_reason public.report_reason,
  p_description text default null,
  p_match_id uuid default null,
  p_message_id uuid default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_report_id uuid;
begin
  if v_user_id is null then
    raise exception using
      errcode = '28000',
      message = 'authentication required';
  end if;

  if p_reported_user_id is null
    or p_reported_user_id = v_user_id
    or p_reason is null
  then
    raise exception using
      errcode = '22023',
      message = 'invalid report';
  end if;

  if not private.current_user_is_active()
    or not exists (
      select 1
      from public.profiles
      where id = p_reported_user_id
    )
  then
    raise exception using
      errcode = '42501',
      message = 'report is not allowed';
  end if;

  insert into public.reports (
    reporter_id,
    reported_user_id,
    match_id,
    message_id,
    reason,
    description
  )
  values (
    v_user_id,
    p_reported_user_id,
    p_match_id,
    p_message_id,
    p_reason,
    nullif(btrim(p_description), '')
  )
  returning id into v_report_id;

  return v_report_id;
end;
$$;

create or replace function public.review_report(
  p_report_id uuid,
  p_status public.report_status,
  p_decision text,
  p_action_type public.moderation_action_type,
  p_rationale text,
  p_expires_at timestamptz default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_moderator_id uuid := auth.uid();
  v_target_user_id uuid;
  v_action_id uuid;
begin
  if v_moderator_id is null then
    raise exception using
      errcode = '28000',
      message = 'authentication required';
  end if;

  if not private.current_user_can_moderate('reports:write') then
    raise exception using
      errcode = '42501',
      message = 'moderation is not allowed';
  end if;

  if p_status not in ('resolved', 'dismissed')
    or p_decision is null
    or p_action_type is null
    or p_rationale is null
    or (p_status = 'dismissed' and p_action_type <> 'report_dismissal')
  then
    raise exception using
      errcode = '22023',
      message = 'invalid moderation decision';
  end if;

  update public.reports
  set
    status = p_status,
    moderator_decision = btrim(p_decision),
    reviewed_by = v_moderator_id,
    reviewed_at = statement_timestamp()
  where id = p_report_id
    and status in ('open', 'in_review')
  returning reported_user_id into v_target_user_id;

  if v_target_user_id is null then
    raise exception using
      errcode = '22023',
      message = 'report is not available';
  end if;

  insert into public.moderation_actions (
    report_id,
    moderator_id,
    target_user_id,
    action_type,
    rationale,
    expires_at
  )
  values (
    p_report_id,
    v_moderator_id,
    v_target_user_id,
    p_action_type,
    btrim(p_rationale),
    p_expires_at
  )
  returning id into v_action_id;

  return v_action_id;
end;
$$;

create or replace function public.get_nearby_profiles_filtered(
  p_radius_m integer default 5000,
  p_limit integer default 20,
  p_min_age smallint default 18,
  p_max_age smallint default 30,
  p_interest_slugs text[] default '{}'::text[]
)
returns table (
  profile_id uuid,
  first_name text,
  age smallint,
  bio text,
  gender public.gender,
  mood public.mood,
  distance_band public.distance_band,
  primary_photo_url text,
  interest_slugs text[]
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if p_limit not between 1 and 50
    or p_min_age not between 18 and 100
    or p_max_age not between p_min_age and 100
    or cardinality(p_interest_slugs) > 5
  then
    raise exception using
      errcode = '22023',
      message = 'invalid discovery filters';
  end if;

  return query
  select nearby.*
  from public.get_nearby_profiles(p_radius_m, 50) as nearby
  where nearby.age between p_min_age and p_max_age
    and (
      cardinality(p_interest_slugs) = 0
      or nearby.interest_slugs && p_interest_slugs
    )
  limit p_limit;
end;
$$;

create or replace function public.consume_rate_limit(
  p_key text,
  p_limit integer,
  p_window_seconds integer,
  p_cost integer default 1
)
returns table (
  allowed boolean,
  remaining integer,
  reset_at timestamptz
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_now timestamptz := clock_timestamp();
  v_window_started_at timestamptz;
  v_reset_at timestamptz;
  v_consumed bigint;
begin
  if p_key is null
    or p_key !~ '^[a-z0-9_.-]+:[a-f0-9]{64}$'
    or char_length(p_key) > 200
    or p_limit not between 1 and 100000
    or p_window_seconds not between 1 and 86400
    or p_cost not between 1 and p_limit
  then
    raise exception using
      errcode = '22023',
      message = 'invalid rate limit request';
  end if;

  v_window_started_at := pg_catalog.to_timestamp(
    floor(
      extract(epoch from v_now) / p_window_seconds
    ) * p_window_seconds
  );
  v_reset_at := v_window_started_at
    + pg_catalog.make_interval(secs => p_window_seconds);

  insert into private.rate_limit_buckets (
    key_hash,
    window_started_at,
    consumed,
    expires_at
  )
  values (
    p_key,
    v_window_started_at,
    p_cost,
    v_reset_at + interval '1 minute'
  )
  on conflict (key_hash, window_started_at) do update
  set
    consumed = private.rate_limit_buckets.consumed + excluded.consumed,
    expires_at = excluded.expires_at,
    updated_at = v_now
  returning consumed into v_consumed;

  return query
  select
    v_consumed <= p_limit,
    greatest(p_limit - v_consumed, 0)::integer,
    v_reset_at;
end;
$$;

create or replace function public.purge_expired_rate_limits()
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_deleted integer;
begin
  delete from private.rate_limit_buckets
  where expires_at <= clock_timestamp();

  get diagnostics v_deleted = row_count;
  return v_deleted;
end;
$$;

revoke all on function public.update_my_profile(
  text,
  date,
  public.gender,
  public.gender[],
  text,
  boolean
) from public, anon, authenticated;
revoke all on function public.send_message(uuid, text)
  from public, anon, authenticated;
revoke all on function public.block_user(uuid)
  from public, anon, authenticated;
revoke all on function public.create_report(
  uuid,
  public.report_reason,
  text,
  uuid,
  uuid
) from public, anon, authenticated;
revoke all on function public.review_report(
  uuid,
  public.report_status,
  text,
  public.moderation_action_type,
  text,
  timestamptz
) from public, anon, authenticated;
revoke all on function public.get_nearby_profiles_filtered(
  integer,
  integer,
  smallint,
  smallint,
  text[]
) from public, anon, authenticated;
revoke all on function public.consume_rate_limit(text, integer, integer, integer)
  from public, anon, authenticated, service_role;
revoke all on function public.purge_expired_rate_limits()
  from public, anon, authenticated, service_role;

grant execute on function public.update_my_profile(
  text,
  date,
  public.gender,
  public.gender[],
  text,
  boolean
) to authenticated;
grant execute on function public.send_message(uuid, text)
  to authenticated;
grant execute on function public.block_user(uuid)
  to authenticated;
grant execute on function public.create_report(
  uuid,
  public.report_reason,
  text,
  uuid,
  uuid
) to authenticated;
grant execute on function public.review_report(
  uuid,
  public.report_status,
  text,
  public.moderation_action_type,
  text,
  timestamptz
) to authenticated;
grant execute on function public.get_nearby_profiles_filtered(
  integer,
  integer,
  smallint,
  smallint,
  text[]
) to authenticated;
grant execute on function public.consume_rate_limit(
  text,
  integer,
  integer,
  integer
) to service_role;
grant execute on function public.purge_expired_rate_limits()
  to service_role;

commit;
