-- Wave 2: expose only whether the current user has a fresh location.
-- No coordinate, accuracy value or capture timestamp leaves PostgreSQL.

begin;

drop function if exists public.get_my_presence();

create function public.get_my_presence()
returns table (
  availability_status public.availability_status,
  mood public.mood,
  available_until timestamptz,
  has_valid_location boolean
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    coalesce(
      presence.availability_status,
      'offline'::public.availability_status
    ),
    presence.mood,
    case
      when presence.availability_status = 'available'
        and presence.available_until > statement_timestamp()
        and presence.last_heartbeat_at >
          statement_timestamp() - interval '5 minutes'
      then presence.available_until
      else null
    end,
    exists (
      select 1
      from public.user_locations as location
      where location.user_id = profile.id
        and location.expires_at > statement_timestamp()
    )
  from public.profiles as profile
  left join public.user_presence as presence
    on presence.user_id = profile.id
  where profile.id = auth.uid()
  limit 1;
$$;

revoke all on function public.get_my_presence()
  from public, anon, authenticated;
grant execute on function public.get_my_presence()
  to authenticated;

commit;
