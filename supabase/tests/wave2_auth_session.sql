begin;

create extension if not exists pgtap with schema extensions;
select extensions.plan(6);

select extensions.has_function(
  'public',
  'get_my_session_context',
  array[]::text[],
  'the session context RPC exists'
);

select extensions.ok(
  (
    select procedure.prosecdef
    from pg_catalog.pg_proc as procedure
    join pg_catalog.pg_namespace as namespace
      on namespace.oid = procedure.pronamespace
    where namespace.nspname = 'public'
      and procedure.proname = 'get_my_session_context'
      and procedure.pronargs = 0
  ),
  'the session context RPC is security definer'
);

select extensions.is(
  (
    select procedure.proconfig
    from pg_catalog.pg_proc as procedure
    join pg_catalog.pg_namespace as namespace
      on namespace.oid = procedure.pronamespace
    where namespace.nspname = 'public'
      and procedure.proname = 'get_my_session_context'
      and procedure.pronargs = 0
  ),
  array['search_path=""']::text[],
  'the session context RPC has an empty search_path'
);

select extensions.ok(
  pg_catalog.has_function_privilege(
    'authenticated',
    'public.get_my_session_context()',
    'execute'
  ),
  'authenticated may execute the session context RPC'
);

select extensions.ok(
  not pg_catalog.has_function_privilege(
    'anon',
    'public.get_my_session_context()',
    'execute'
  ),
  'anon may not execute the session context RPC'
);

insert into auth.users (
  id,
  aud,
  role,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at
)
values (
  '00000000-0000-0000-0000-0000000002a1',
  'authenticated',
  'authenticated',
  '{}'::jsonb,
  '{}'::jsonb,
  now(),
  now()
);

set local role authenticated;
select pg_catalog.set_config(
  'request.jwt.claims',
  '{"sub":"00000000-0000-0000-0000-0000000002a1","role":"authenticated","aal":"aal1"}',
  true
);

select extensions.results_eq(
  $$
    select
      user_id::text,
      account_status::text,
      is_profile_complete
    from public.get_my_session_context()
  $$,
  $$
    values (
      '00000000-0000-0000-0000-0000000002a1'::text,
      'active'::text,
      false
    )
  $$,
  'the RPC returns only the current profile routing state'
);

reset role;

select * from extensions.finish();
rollback;
