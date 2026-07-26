begin;

create extension if not exists pgtap with schema extensions;
select extensions.plan(20);

select extensions.has_function(
  'public',
  'get_my_presence',
  array[]::text[],
  'the private current-presence read model exists'
);

select extensions.ok(
  (
    select procedure.prosecdef
    from pg_catalog.pg_proc as procedure
    join pg_catalog.pg_namespace as namespace
      on namespace.oid = procedure.pronamespace
    where namespace.nspname = 'public'
      and procedure.proname = 'get_my_presence'
      and procedure.pronargs = 0
  ),
  'get_my_presence is security definer'
);

select extensions.is(
  (
    select procedure.proconfig
    from pg_catalog.pg_proc as procedure
    join pg_catalog.pg_namespace as namespace
      on namespace.oid = procedure.pronamespace
    where namespace.nspname = 'public'
      and procedure.proname = 'get_my_presence'
      and procedure.pronargs = 0
  ),
  array['search_path=""']::text[],
  'get_my_presence has an empty search_path'
);

select extensions.ok(
  pg_catalog.has_function_privilege(
    'authenticated',
    'public.get_my_presence()',
    'execute'
  ),
  'authenticated may read only its normalized presence'
);

select extensions.ok(
  not pg_catalog.has_function_privilege(
    'anon',
    'public.get_my_presence()',
    'execute'
  ),
  'anon may not execute get_my_presence'
);

select extensions.is(
  (
    select pg_catalog.array_agg(parameter_name::text order by ordinal_position)
    from information_schema.parameters
    where specific_schema = 'public'
      and specific_name like 'get_my_presence_%'
      and parameter_mode = 'OUT'
  ),
  array['availability_status', 'mood', 'available_until']::text[],
  'get_my_presence exposes no coordinates or location metadata'
);

select extensions.ok(
  pg_catalog.pg_get_functiondef(
    'public.get_my_presence()'::regprocedure
  ) !~* 'user_locations',
  'get_my_presence never reads exact locations'
);

select extensions.ok(
  (
    select procedure.prosecdef
      and procedure.proconfig = array['search_path=""']::text[]
    from pg_catalog.pg_proc as procedure
    join pg_catalog.pg_namespace as namespace
      on namespace.oid = procedure.pronamespace
    where namespace.nspname = 'public'
      and procedure.proname = 'heartbeat_presence'
      and procedure.pronargs = 0
  ),
  'heartbeat_presence is hardened'
);

select extensions.ok(
  pg_catalog.has_function_privilege(
    'authenticated',
    'public.heartbeat_presence()',
    'execute'
  )
  and not pg_catalog.has_function_privilege(
    'anon',
    'public.heartbeat_presence()',
    'execute'
  ),
  'only authenticated users may call heartbeat_presence'
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
  '00000000-0000-0000-0000-0000000006a1',
  'authenticated',
  'authenticated',
  '{}'::jsonb,
  '{}'::jsonb,
  pg_catalog.now(),
  pg_catalog.now()
);

update public.profiles
set
  first_name = 'Awa',
  birth_date = date '1998-06-14',
  gender = 'woman',
  searching_for = array['man'::public.gender],
  bio = 'Profil de test',
  adult_confirmed_at = pg_catalog.now()
where id = '00000000-0000-0000-0000-0000000006a1';

insert into public.profile_photos (
  profile_id,
  cloudinary_public_id,
  cloudinary_version,
  secure_url,
  sort_order,
  width,
  height
)
values
  (
    '00000000-0000-0000-0000-0000000006a1',
    'wave2/presence/a',
    1,
    'https://res.cloudinary.com/test/image/upload/a.jpg',
    1,
    1200,
    1600
  ),
  (
    '00000000-0000-0000-0000-0000000006a1',
    'wave2/presence/b',
    1,
    'https://res.cloudinary.com/test/image/upload/b.jpg',
    2,
    1200,
    1600
  );

insert into public.user_interests (user_id, interest_id)
select
  '00000000-0000-0000-0000-0000000006a1',
  interest.id
from public.interests as interest
where interest.is_active
order by interest.id
limit 2;

select extensions.is(
  (
    select profile.is_profile_complete
    from public.profiles as profile
    where profile.id = '00000000-0000-0000-0000-0000000006a1'
  ),
  true,
  'the presence fixture has a complete profile'
);

insert into public.user_presence (
  user_id,
  availability_status,
  mood,
  last_heartbeat_at,
  activated_at,
  available_until
)
values (
  '00000000-0000-0000-0000-0000000006a1',
  'available',
  'discuter',
  pg_catalog.now() - interval '30 seconds',
  pg_catalog.now() - interval '1 minute',
  pg_catalog.now() + interval '30 minutes'
);

set local role authenticated;
select pg_catalog.set_config(
  'request.jwt.claims',
  '{"sub":"00000000-0000-0000-0000-0000000006a1","role":"authenticated","aal":"aal1"}',
  true
);

select extensions.results_eq(
  $$
    select
      availability_status::text,
      mood::text,
      available_until is not null
    from public.get_my_presence()
  $$,
  $$
    values ('available'::text, 'discuter'::text, true)
  $$,
  'an active presence is returned without coordinates'
);

select extensions.lives_ok(
  $$ select public.heartbeat_presence() $$,
  'an active complete profile may heartbeat'
);

reset role;

select extensions.ok(
  (
    select presence.last_heartbeat_at > pg_catalog.now() - interval '10 seconds'
    from public.user_presence as presence
    where presence.user_id = '00000000-0000-0000-0000-0000000006a1'
  ),
  'an accepted heartbeat refreshes only the current presence row'
);

update public.user_presence
set
  availability_status = 'offline',
  mood = null,
  activated_at = null,
  available_until = null
where user_id = '00000000-0000-0000-0000-0000000006a1';

set local role authenticated;
select extensions.throws_ok(
  $$ select public.heartbeat_presence() $$,
  '55000',
  'presence is not active',
  'an inactive presence cannot heartbeat'
);
reset role;

update public.profiles
set
  account_status = 'suspended',
  suspended_until = pg_catalog.now() + interval '1 day'
where id = '00000000-0000-0000-0000-0000000006a1';

update public.user_presence
set
  availability_status = 'available',
  mood = 'sortir',
  last_heartbeat_at = pg_catalog.now(),
  activated_at = pg_catalog.now(),
  available_until = pg_catalog.now() + interval '30 minutes'
where user_id = '00000000-0000-0000-0000-0000000006a1';

set local role authenticated;
select extensions.throws_ok(
  $$ select public.heartbeat_presence() $$,
  '55000',
  'presence is not active',
  'a suspended account cannot heartbeat'
);
reset role;

update public.profiles
set
  account_status = 'active',
  suspended_until = null
where id = '00000000-0000-0000-0000-0000000006a1';

update public.user_presence
set
  availability_status = 'available',
  mood = 'manger',
  last_heartbeat_at = pg_catalog.now() - interval '1 minute',
  activated_at = pg_catalog.now() - interval '2 minutes',
  available_until = pg_catalog.now() - interval '1 second'
where user_id = '00000000-0000-0000-0000-0000000006a1';

set local role authenticated;
select extensions.throws_ok(
  $$ select public.heartbeat_presence() $$,
  '55000',
  'presence is not active',
  'an expired availability cannot heartbeat'
);
reset role;

update public.user_presence
set
  availability_status = 'available',
  mood = 'sport',
  last_heartbeat_at = pg_catalog.now() - interval '6 minutes',
  available_until = pg_catalog.now() + interval '30 minutes'
where user_id = '00000000-0000-0000-0000-0000000006a1';

set local role authenticated;
select extensions.results_eq(
  $$
    select
      availability_status::text,
      mood::text,
      available_until is null
    from public.get_my_presence()
  $$,
  $$
    values ('available'::text, 'sport'::text, true)
  $$,
  'the read model redacts the expiry of a stale presence'
);

select extensions.throws_ok(
  $$ select public.heartbeat_presence() $$,
  '55000',
  'presence is not active',
  'a heartbeat cannot revive a presence stale for more than five minutes'
);
reset role;

select extensions.lives_ok(
  $$ select * from public.expire_stale_presence() $$,
  'the service routine expires stale presence without partial failure'
);

select extensions.is(
  (
    select presence.availability_status::text
    from public.user_presence as presence
    where presence.user_id = '00000000-0000-0000-0000-0000000006a1'
  ),
  'offline',
  'the stale presence is persisted offline'
);

select * from extensions.finish();
rollback;
