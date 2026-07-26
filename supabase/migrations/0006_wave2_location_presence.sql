-- Wave 2: safe current-presence read model and defensive heartbeat checks.
-- Exact locations remain write-only through update_my_location.

begin;

create or replace function public.get_my_presence()
returns table (
  availability_status public.availability_status,
  mood public.mood,
  available_until timestamptz
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    presence.availability_status,
    presence.mood,
    case
      when presence.availability_status = 'available'
        and presence.available_until > statement_timestamp()
        and presence.last_heartbeat_at >
          statement_timestamp() - interval '5 minutes'
      then presence.available_until
      else null
    end
  from public.user_presence as presence
  where presence.user_id = auth.uid()
  limit 1;
$$;

create or replace function public.heartbeat_presence()
returns timestamptz
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_available_until timestamptz;
begin
  if v_user_id is null then
    raise exception using
      errcode = '28000',
      message = 'authentication required';
  end if;

  update public.user_presence as presence
  set last_heartbeat_at = statement_timestamp()
  from public.profiles as profile
  where presence.user_id = v_user_id
    and profile.id = v_user_id
    and profile.account_status = 'active'
    and profile.is_profile_complete
    and profile.deletion_requested_at is null
    and (
      profile.suspended_until is null
      or profile.suspended_until <= statement_timestamp()
    )
    and presence.availability_status = 'available'
    and presence.available_until > statement_timestamp()
  returning presence.available_until into v_available_until;

  if v_available_until is null then
    raise exception using
      errcode = '55000',
      message = 'presence is not active';
  end if;

  return v_available_until;
end;
$$;

revoke all on function public.get_my_presence()
  from public, anon, authenticated;
revoke all on function public.heartbeat_presence()
  from public, anon, authenticated;

grant execute on function public.get_my_presence()
  to authenticated;
grant execute on function public.heartbeat_presence()
  to authenticated;

commit;
