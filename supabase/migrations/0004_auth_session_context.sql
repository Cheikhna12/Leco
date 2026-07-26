-- Wave 2: expose the minimum profile state required for server-side routing.
-- Exact profile fields and moderation metadata remain private.

create or replace function public.get_my_session_context()
returns table (
  user_id uuid,
  account_status public.account_status,
  is_profile_complete boolean
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    profile.id,
    profile.account_status,
    profile.is_profile_complete
  from public.profiles as profile
  where profile.id = auth.uid()
  limit 1;
$$;

revoke all on function public.get_my_session_context() from public;
revoke all on function public.get_my_session_context() from anon;
grant execute on function public.get_my_session_context() to authenticated;
