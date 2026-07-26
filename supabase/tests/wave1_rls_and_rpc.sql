begin;

create extension if not exists pgtap with schema extensions;
select extensions.no_plan();

create or replace function pg_temp.set_claims(
  p_user_id uuid,
  p_app_role text default 'user',
  p_aal text default 'aal1',
  p_permissions jsonb default '[]'::jsonb
)
returns void
language sql
as $$
  select pg_catalog.set_config(
    'request.jwt.claims',
    pg_catalog.jsonb_build_object(
      'sub', p_user_id,
      'role', 'authenticated',
      'aal', p_aal,
      'app_metadata', pg_catalog.jsonb_build_object(
        'role', p_app_role,
        'permissions', p_permissions
      )
    )::text,
    true
  );
$$;

insert into auth.users (
  id,
  aud,
  role,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at
)
values
  ('00000000-0000-0000-0000-0000000000a1', 'authenticated', 'authenticated', '{}'::jsonb, '{}'::jsonb, now(), now()),
  ('00000000-0000-0000-0000-0000000000b2', 'authenticated', 'authenticated', '{}'::jsonb, '{}'::jsonb, now(), now()),
  ('00000000-0000-0000-0000-0000000000c3', 'authenticated', 'authenticated', '{}'::jsonb, '{}'::jsonb, now(), now()),
  ('00000000-0000-0000-0000-0000000000d4', 'authenticated', 'authenticated', '{}'::jsonb, '{}'::jsonb, now(), now()),
  ('00000000-0000-0000-0000-0000000000e5', 'authenticated', 'authenticated', '{}'::jsonb, '{}'::jsonb, now(), now()),
  ('00000000-0000-0000-0000-0000000000f6', 'authenticated', 'authenticated', '{}'::jsonb, '{}'::jsonb, now(), now());

update public.profiles
set
  first_name = case id
    when '00000000-0000-0000-0000-0000000000a1' then 'Awa'
    when '00000000-0000-0000-0000-0000000000b2' then 'Boris'
    when '00000000-0000-0000-0000-0000000000c3' then 'Cynthia'
    when '00000000-0000-0000-0000-0000000000d4' then 'Suspendu'
    when '00000000-0000-0000-0000-0000000000e5' then 'Moderateur'
    else 'Administrateur'
  end,
  birth_date = case id
    when '00000000-0000-0000-0000-0000000000a1' then date '2000-01-01'
    when '00000000-0000-0000-0000-0000000000b2' then date '1999-01-01'
    when '00000000-0000-0000-0000-0000000000c3' then date '1998-01-01'
    else date '1995-01-01'
  end,
  gender = case
    when id = '00000000-0000-0000-0000-0000000000a1'
      then 'man'::public.gender
    else 'woman'::public.gender
  end,
  searching_for = case
    when id = '00000000-0000-0000-0000-0000000000a1'
      then array['woman'::public.gender]
    else array['man'::public.gender]
  end,
  bio = 'Profil de test',
  is_discoverable = true;

insert into public.profile_photos (
  profile_id,
  cloudinary_public_id,
  secure_url,
  sort_order
)
select
  profile.id,
  'test/' || profile.id::text || '/' || photo.sort_order::text,
  'https://example.test/' || profile.id::text || '/' || photo.sort_order::text || '.jpg',
  photo.sort_order
from public.profiles as profile
cross join (values (1::smallint), (2::smallint)) as photo(sort_order);

insert into public.user_interests (user_id, interest_id)
select profile.id, interest.id
from public.profiles as profile
cross join lateral (
  select id
  from public.interests
  order by id
  limit 2
) as interest;

update public.profiles
set
  account_status = 'suspended',
  suspended_until = statement_timestamp() + interval '1 day'
where id = '00000000-0000-0000-0000-0000000000d4';

insert into public.user_locations (
  user_id,
  location,
  accuracy_m,
  captured_at,
  expires_at
)
values
  (
    '00000000-0000-0000-0000-0000000000a1',
    extensions.st_setsrid(extensions.st_makepoint(-4.0083, 5.3599), 4326)::extensions.geography,
    20,
    statement_timestamp(),
    statement_timestamp() + interval '15 minutes'
  ),
  (
    '00000000-0000-0000-0000-0000000000b2',
    extensions.st_setsrid(extensions.st_makepoint(-4.0070, 5.3610), 4326)::extensions.geography,
    20,
    statement_timestamp(),
    statement_timestamp() + interval '15 minutes'
  ),
  (
    '00000000-0000-0000-0000-0000000000c3',
    extensions.st_setsrid(extensions.st_makepoint(-4.0060, 5.3620), 4326)::extensions.geography,
    20,
    statement_timestamp() - interval '30 minutes',
    statement_timestamp() - interval '15 minutes'
  );

insert into public.user_presence (
  user_id,
  availability_status,
  mood,
  last_heartbeat_at,
  activated_at,
  available_until
)
values
  (
    '00000000-0000-0000-0000-0000000000a1',
    'available',
    'discuter',
    statement_timestamp(),
    statement_timestamp(),
    statement_timestamp() + interval '1 hour'
  ),
  (
    '00000000-0000-0000-0000-0000000000b2',
    'available',
    'manger',
    statement_timestamp(),
    statement_timestamp(),
    statement_timestamp() + interval '1 hour'
  ),
  (
    '00000000-0000-0000-0000-0000000000c3',
    'available',
    'sortir',
    statement_timestamp() - interval '10 minutes',
    statement_timestamp() - interval '1 hour',
    statement_timestamp() - interval '1 minute'
  );

select extensions.ok(
  exists (
    select 1
    from pg_catalog.pg_extension
    where extname = 'postgis'
  ),
  'PostGIS is installed'
);

select extensions.ok(
  exists (
    select 1
    from pg_catalog.pg_indexes
    where schemaname = 'public'
      and tablename = 'user_locations'
      and indexname = 'user_locations_geography_gist_idx'
      and indexdef ilike '%using gist%'
  ),
  'user_locations has a GiST geography index'
);

select extensions.ok(
  (
    select relrowsecurity and relforcerowsecurity
    from pg_catalog.pg_class
    where oid = 'public.user_locations'::regclass
  ),
  'RLS is enabled and forced on user_locations'
);

select extensions.hasnt_column(
  'public',
  'profiles',
  'phone',
  'profiles never exposes a phone column'
);

select extensions.ok(
  (
    select pg_catalog.pg_get_function_result(procedure.oid)
    from pg_catalog.pg_proc as procedure
    where procedure.oid =
      'public.get_nearby_profiles(integer,integer)'::regprocedure
  ) not ilike any (array['%latitude%', '%longitude%', '%location%', '%distance_m%']),
  'discovery RPC result has no exact coordinate field'
);

set local role anon;
select extensions.throws_ok(
  'select * from public.profiles',
  '42501',
  'permission denied for table profiles',
  'anonymous users cannot read profiles'
);
reset role;

select pg_temp.set_claims('00000000-0000-0000-0000-0000000000a1');
set local role authenticated;
select extensions.throws_ok(
  'select * from public.user_locations',
  '42501',
  'permission denied for table user_locations',
  'clients cannot directly read user_locations'
);
select extensions.throws_ok(
  $sql$
    update public.profiles
    set first_name = 'Intrusion'
    where id = '00000000-0000-0000-0000-0000000000b2'
  $sql$,
  '42501',
  'permission denied for table profiles',
  'a user cannot directly update another profile'
);
select extensions.lives_ok(
  $sql$
    select public.update_my_profile(
      'Awa Test',
      date '2000-01-01',
      'man',
      array['woman'::public.gender],
      'Profil mis a jour',
      true
    )
  $sql$,
  'a user can update their own profile through the audited RPC'
);
select extensions.is(
  (
    select first_name
    from public.profiles
    where id = '00000000-0000-0000-0000-0000000000a1'
  ),
  'Awa Test',
  'the profile RPC only updates the authenticated user'
);
select extensions.throws_ok(
  $sql$
    select public.update_my_profile(
      'Mineur',
      (current_date - interval '17 years')::date,
      'man',
      array['woman'::public.gender],
      null,
      true
    )
  $sql$,
  '22023',
  'profile owner must be at least 18 years old',
  'minor profiles are rejected technically'
);
reset role;

select pg_temp.set_claims('00000000-0000-0000-0000-0000000000d4');
set local role authenticated;
select extensions.throws_ok(
  'select public.update_my_location(5.36, -4.00, 10)',
  '42501',
  'location update is not allowed',
  'a suspended user cannot update a location'
);
select extensions.throws_ok(
  'select public.activate_presence(''discuter'', 60::smallint)',
  '42501',
  'presence activation is not allowed',
  'a suspended user cannot activate presence'
);
reset role;

select pg_temp.set_claims('00000000-0000-0000-0000-0000000000a1');
set local role authenticated;
select extensions.lives_ok(
  'select public.update_my_location(5.3599, -4.0083, 15)',
  'location update RPC succeeds for the current user'
);
select extensions.lives_ok(
  'select public.update_my_location(5.3600, -4.0082, 12)',
  'a second location update replaces the current point'
);
reset role;

select extensions.is(
  (
    select count(*)::integer
    from public.user_locations
    where user_id = '00000000-0000-0000-0000-0000000000a1'
  ),
  1,
  'location updates keep one current row and no history'
);

select pg_temp.set_claims('00000000-0000-0000-0000-0000000000a1');
set local role authenticated;
select extensions.lives_ok(
  'select public.activate_presence(''discuter'', 60::smallint)',
  'a user activates their own presence'
);
select extensions.lives_ok(
  'select public.heartbeat_presence()',
  'the first heartbeat succeeds'
);
select extensions.lives_ok(
  'select public.heartbeat_presence()',
  'a repeated heartbeat is idempotent'
);
reset role;

select extensions.is(
  (
    select count(*)::integer
    from public.user_presence
    where user_id = '00000000-0000-0000-0000-0000000000a1'
  ),
  1,
  'heartbeats keep a single presence row'
);

select pg_temp.set_claims('00000000-0000-0000-0000-0000000000a1');
set local role authenticated;
select extensions.is(
  (
    select count(*)::integer
    from public.get_nearby_profiles(5000, 20)
    where profile_id = '00000000-0000-0000-0000-0000000000b2'
  ),
  1,
  'discovery returns an active nearby compatible profile'
);
select extensions.is(
  (
    select count(*)::integer
    from public.get_nearby_profiles(5000, 20)
    where profile_id in (
      '00000000-0000-0000-0000-0000000000a1',
      '00000000-0000-0000-0000-0000000000c3'
    )
  ),
  0,
  'discovery excludes self and expired profiles'
);
select extensions.is(
  (
    select count(*)::integer
    from public.get_nearby_profiles_filtered(
      5000,
      20,
      26::smallint,
      28::smallint,
      array['afrobeats']
    )
    where profile_id = '00000000-0000-0000-0000-0000000000b2'
  ),
  1,
  'age and interest discovery filters work'
);
select extensions.lives_ok(
  $sql$
    select *
    from public.send_hello('00000000-0000-0000-0000-0000000000b2')
  $sql$,
  'A can send hello to B'
);
select extensions.throws_ok(
  $sql$
    select *
    from public.send_hello('00000000-0000-0000-0000-0000000000b2')
  $sql$,
  '23505',
  'a hello request is already pending',
  'duplicate active hello requests are rejected'
);
select extensions.throws_ok(
  $sql$
    select *
    from public.send_hello('00000000-0000-0000-0000-0000000000a1')
  $sql$,
  '22023',
  'invalid recipient',
  'self hello requests are rejected'
);
reset role;

select pg_temp.set_claims('00000000-0000-0000-0000-0000000000b2');
set local role authenticated;
select extensions.lives_ok(
  $sql$
    select *
    from public.send_hello('00000000-0000-0000-0000-0000000000a1')
  $sql$,
  'a reciprocal hello creates a match'
);
reset role;

select extensions.is(
  (
    select count(*)::integer
    from public.matches
    where user_low_id = '00000000-0000-0000-0000-0000000000a1'
      and user_high_id = '00000000-0000-0000-0000-0000000000b2'
  ),
  1,
  'a mutual hello creates exactly one canonical match'
);

select pg_temp.set_claims('00000000-0000-0000-0000-0000000000a1');
set local role authenticated;
select extensions.throws_ok(
  $sql$
    insert into public.matches (user_low_id, user_high_id)
    values (
      '00000000-0000-0000-0000-0000000000a1',
      '00000000-0000-0000-0000-0000000000c3'
    )
  $sql$,
  '42501',
  'permission denied for table matches',
  'the client cannot insert a fraudulent match'
);
select extensions.lives_ok(
  $sql$
    select public.send_message(
      (
        select id
        from public.matches
        where user_low_id = '00000000-0000-0000-0000-0000000000a1'
          and user_high_id = '00000000-0000-0000-0000-0000000000b2'
      ),
      'Bonsoir Boris'
    )
  $sql$,
  'a match member can send a message'
);
select extensions.throws_ok(
  $sql$
    select public.send_message(
      (
        select id
        from public.matches
        where user_low_id = '00000000-0000-0000-0000-0000000000a1'
          and user_high_id = '00000000-0000-0000-0000-0000000000b2'
      ),
      ''
    )
  $sql$,
  '23514',
  'new row for relation "messages" violates check constraint "messages_text_only_length"',
  'empty messages are rejected'
);
reset role;

select pg_temp.set_claims('00000000-0000-0000-0000-0000000000c3');
set local role authenticated;
select extensions.is(
  (select count(*)::integer from public.messages),
  0,
  'C cannot read messages between A and B'
);
select extensions.throws_ok(
  $sql$
    select public.send_message(
      (
        select id
        from public.matches
        where user_low_id = '00000000-0000-0000-0000-0000000000a1'
          and user_high_id = '00000000-0000-0000-0000-0000000000b2'
      ),
      'Intrusion'
    )
  $sql$,
  '22023',
  'invalid message',
  'C cannot write into the match between A and B'
);
reset role;

select pg_temp.set_claims('00000000-0000-0000-0000-0000000000a1');
set local role authenticated;
select extensions.lives_ok(
  $sql$
    select public.create_report(
      '00000000-0000-0000-0000-0000000000b2',
      'harassment',
      'Comportement a verifier'
    )
  $sql$,
  'A can report B'
);
select extensions.throws_ok(
  $sql$
    select public.create_report(
      '00000000-0000-0000-0000-0000000000a1',
      'spam',
      null
    )
  $sql$,
  '22023',
  'invalid report',
  'self reports are rejected'
);
select extensions.lives_ok(
  'select public.block_user(''00000000-0000-0000-0000-0000000000b2'')',
  'A can block B'
);
select extensions.is(
  (
    select count(*)::integer
    from public.get_nearby_profiles(5000, 20)
    where profile_id = '00000000-0000-0000-0000-0000000000b2'
  ),
  0,
  'a blocked profile is excluded from discovery'
);
reset role;

select pg_temp.set_claims('00000000-0000-0000-0000-0000000000b2');
set local role authenticated;
select extensions.is(
  (select count(*)::integer from public.reports),
  0,
  'B cannot read the report created against B'
);
select extensions.is(
  (select count(*)::integer from public.messages),
  0,
  'blocking makes the conversation immediately inaccessible'
);
select extensions.throws_ok(
  $sql$
    select public.send_message(
      (
        select id
        from public.matches
        where user_low_id = '00000000-0000-0000-0000-0000000000a1'
          and user_high_id = '00000000-0000-0000-0000-0000000000b2'
      ),
      'Message apres blocage'
    )
  $sql$,
  '22023',
  'invalid message',
  'B cannot send after being blocked by A'
);
reset role;

select pg_temp.set_claims(
  '00000000-0000-0000-0000-0000000000e5',
  'moderator',
  'aal1',
  '["reports:read","reports:write","moderation:read"]'::jsonb
);
set local role authenticated;
select extensions.is(
  (select count(*)::integer from public.reports),
  0,
  'a moderator without aal2 cannot read reports'
);
reset role;

select pg_temp.set_claims(
  '00000000-0000-0000-0000-0000000000e5',
  'moderator',
  'aal2',
  '["reports:read"]'::jsonb
);
set local role authenticated;
select extensions.is(
  (select count(*)::integer from public.reports),
  1,
  'an aal2 moderator can read reports in the granted scope'
);
select extensions.throws_ok(
  $sql$
    select public.review_report(
      (select id from public.reports limit 1),
      'dismissed',
      'Decision',
      'report_dismissal',
      'Rationale',
      null
    )
  $sql$,
  '42501',
  'moderation is not allowed',
  'a moderator cannot exceed the granted scope'
);
select extensions.is(
  (select count(*)::integer from public.audit_logs),
  0,
  'a moderator cannot read the global audit log'
);
reset role;

select pg_temp.set_claims(
  '00000000-0000-0000-0000-0000000000e5',
  'moderator',
  'aal2',
  '["reports:read","reports:write","moderation:read"]'::jsonb
);
set local role authenticated;
select extensions.lives_ok(
  $sql$
    select public.review_report(
      (select id from public.reports limit 1),
      'dismissed',
      'Signalement classe',
      'report_dismissal',
      'Aucun element probant',
      null
    )
  $sql$,
  'an aal2 moderator can process a report in scope'
);
select extensions.is(
  (select count(*)::integer from public.moderation_actions),
  1,
  'moderation creates one action'
);
reset role;

select pg_temp.set_claims(
  '00000000-0000-0000-0000-0000000000f6',
  'admin',
  'aal1'
);
set local role authenticated;
select extensions.is(
  (select count(*)::integer from public.audit_logs),
  0,
  'an administrator without aal2 cannot read audit logs'
);
reset role;

select pg_temp.set_claims(
  '00000000-0000-0000-0000-0000000000f6',
  'admin',
  'aal2'
);
set local role authenticated;
select extensions.is(
  (select count(*)::integer from public.audit_logs),
  1,
  'an aal2 administrator can read the moderation audit entry'
);
reset role;

select pg_temp.set_claims('00000000-0000-0000-0000-0000000000a1');
set local role authenticated;
select extensions.throws_ok(
  $sql$
    select *
    from public.consume_rate_limit(
      'message:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
      2,
      60,
      1
    )
  $sql$,
  '42501',
  'permission denied for function consume_rate_limit',
  'authenticated clients cannot call the service rate limiter'
);
select extensions.throws_ok(
  'select * from private.rate_limit_buckets',
  '42501',
  'permission denied for table rate_limit_buckets',
  'authenticated clients cannot read rate-limit buckets'
);
reset role;

set local role service_role;
select extensions.is(
  (
    select remaining
    from public.consume_rate_limit(
      'message:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
      2,
      60,
      1
    )
  ),
  1,
  'the durable rate limiter consumes the first token'
);
select extensions.is(
  (
    select remaining
    from public.consume_rate_limit(
      'message:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
      2,
      60,
      1
    )
  ),
  0,
  'the durable rate limiter consumes the second token'
);
select extensions.is(
  (
    select allowed
    from public.consume_rate_limit(
      'message:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
      2,
      60,
      1
    )
  ),
  false,
  'the durable rate limiter rejects consumption above the limit'
);
reset role;

select * from extensions.finish();
rollback;
