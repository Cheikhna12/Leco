create extension if not exists pgtap with schema extensions;
create extension if not exists dblink with schema extensions;

delete from private.rate_limit_buckets
where key_hash =
  'message:bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb';
delete from public.messages
where sender_id in (
  '10000000-0000-0000-0000-0000000000a1',
  '10000000-0000-0000-0000-0000000000b2'
);
delete from public.blocks
where blocker_id in (
  '10000000-0000-0000-0000-0000000000a1',
  '10000000-0000-0000-0000-0000000000b2'
);
delete from public.likes
where sender_id in (
  '10000000-0000-0000-0000-0000000000a1',
  '10000000-0000-0000-0000-0000000000b2'
);
delete from public.matches
where user_low_id = '10000000-0000-0000-0000-0000000000a1'
  and user_high_id = '10000000-0000-0000-0000-0000000000b2';
delete from public.user_presence
where user_id in (
  '10000000-0000-0000-0000-0000000000a1',
  '10000000-0000-0000-0000-0000000000b2'
);
delete from public.user_locations
where user_id in (
  '10000000-0000-0000-0000-0000000000a1',
  '10000000-0000-0000-0000-0000000000b2'
);
delete from public.user_interests
where user_id in (
  '10000000-0000-0000-0000-0000000000a1',
  '10000000-0000-0000-0000-0000000000b2'
);
delete from public.profile_photos
where profile_id in (
  '10000000-0000-0000-0000-0000000000a1',
  '10000000-0000-0000-0000-0000000000b2'
);
delete from public.profiles
where id in (
  '10000000-0000-0000-0000-0000000000a1',
  '10000000-0000-0000-0000-0000000000b2'
);
delete from auth.users
where id in (
  '10000000-0000-0000-0000-0000000000a1',
  '10000000-0000-0000-0000-0000000000b2'
);

drop schema if exists wave1_test cascade;
create schema wave1_test;
revoke all on schema wave1_test from public, anon, authenticated, service_role;

create function wave1_test.claims(
  p_user_id uuid,
  p_app_role text default 'user',
  p_aal text default 'aal1'
)
returns text
language sql
immutable
set search_path = ''
as $$
  select pg_catalog.jsonb_build_object(
    'sub', p_user_id,
    'role', 'authenticated',
    'aal', p_aal,
    'app_metadata', pg_catalog.jsonb_build_object('role', p_app_role)
  )::text;
$$;

create function wave1_test.send_hello_as(
  p_user_id uuid,
  p_recipient_id uuid
)
returns boolean
language plpgsql
set search_path = ''
as $$
begin
  perform pg_catalog.set_config(
    'request.jwt.claims',
    wave1_test.claims(p_user_id),
    false
  );
  perform pg_catalog.set_config('role', 'authenticated', false);
  perform public.send_hello(p_recipient_id);
  return true;
end;
$$;

create function wave1_test.heartbeat_as(p_user_id uuid)
returns boolean
language plpgsql
set search_path = ''
as $$
begin
  perform pg_catalog.set_config(
    'request.jwt.claims',
    wave1_test.claims(p_user_id),
    false
  );
  perform pg_catalog.set_config('role', 'authenticated', false);
  perform public.heartbeat_presence();
  return true;
end;
$$;

create function wave1_test.block_as(
  p_user_id uuid,
  p_blocked_id uuid
)
returns boolean
language plpgsql
set search_path = ''
as $$
begin
  perform pg_catalog.set_config(
    'request.jwt.claims',
    wave1_test.claims(p_user_id),
    false
  );
  perform pg_catalog.set_config('role', 'authenticated', false);
  perform public.block_user(p_blocked_id);
  return true;
end;
$$;

create function wave1_test.send_message_as(
  p_user_id uuid,
  p_match_id uuid,
  p_content text
)
returns boolean
language plpgsql
set search_path = ''
as $$
begin
  perform pg_catalog.set_config(
    'request.jwt.claims',
    wave1_test.claims(p_user_id),
    false
  );
  perform pg_catalog.set_config('role', 'authenticated', false);
  perform public.send_message(p_match_id, p_content);
  return true;
end;
$$;

create function wave1_test.consume_as_service(
  p_key text,
  p_limit integer
)
returns boolean
language plpgsql
set search_path = ''
as $$
declare
  v_allowed boolean;
begin
  perform pg_catalog.set_config('role', 'service_role', false);
  select allowed
  into v_allowed
  from public.consume_rate_limit(p_key, p_limit, 60, 1);
  return v_allowed;
end;
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
  ('10000000-0000-0000-0000-0000000000a1', 'authenticated', 'authenticated', '{}'::jsonb, '{}'::jsonb, now(), now()),
  ('10000000-0000-0000-0000-0000000000b2', 'authenticated', 'authenticated', '{}'::jsonb, '{}'::jsonb, now(), now());

update public.profiles
set
  first_name = case
    when id = '10000000-0000-0000-0000-0000000000a1' then 'Concurrent A'
    else 'Concurrent B'
  end,
  birth_date = date '2000-01-01',
  gender = case
    when id = '10000000-0000-0000-0000-0000000000a1'
      then 'man'::public.gender
    else 'woman'::public.gender
  end,
  searching_for = case
    when id = '10000000-0000-0000-0000-0000000000a1'
      then array['woman'::public.gender]
    else array['man'::public.gender]
  end,
  is_discoverable = true;

insert into public.profile_photos (
  profile_id,
  cloudinary_public_id,
  secure_url,
  sort_order
)
select
  profile.id,
  'concurrency/' || profile.id::text || '/' || photo.sort_order::text,
  'https://example.test/concurrency/' || profile.id::text || '/' || photo.sort_order::text || '.jpg',
  photo.sort_order
from public.profiles as profile
cross join (values (1::smallint), (2::smallint)) as photo(sort_order)
where profile.id in (
  '10000000-0000-0000-0000-0000000000a1',
  '10000000-0000-0000-0000-0000000000b2'
);

insert into public.user_interests (user_id, interest_id)
select profile.id, interest.id
from public.profiles as profile
cross join lateral (
  select id
  from public.interests
  order by id
  limit 2
) as interest
where profile.id in (
  '10000000-0000-0000-0000-0000000000a1',
  '10000000-0000-0000-0000-0000000000b2'
);

insert into public.user_locations (
  user_id,
  location,
  captured_at,
  expires_at
)
values
  (
    '10000000-0000-0000-0000-0000000000a1',
    extensions.st_setsrid(extensions.st_makepoint(-4.0083, 5.3599), 4326)::extensions.geography,
    statement_timestamp(),
    statement_timestamp() + interval '15 minutes'
  ),
  (
    '10000000-0000-0000-0000-0000000000b2',
    extensions.st_setsrid(extensions.st_makepoint(-4.0070, 5.3610), 4326)::extensions.geography,
    statement_timestamp(),
    statement_timestamp() + interval '15 minutes'
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
    '10000000-0000-0000-0000-0000000000a1',
    'available',
    'discuter',
    statement_timestamp() - interval '1 minute',
    statement_timestamp() - interval '1 minute',
    statement_timestamp() + interval '1 hour'
  ),
  (
    '10000000-0000-0000-0000-0000000000b2',
    'available',
    'manger',
    statement_timestamp() - interval '1 minute',
    statement_timestamp() - interval '1 minute',
    statement_timestamp() + interval '1 hour'
  );

select extensions.no_plan();

select extensions.dblink_connect(
  'match_a',
  'host=host.docker.internal port=54322 dbname=postgres user=postgres password=postgres'
);
select extensions.dblink_connect(
  'match_b',
  'host=host.docker.internal port=54322 dbname=postgres user=postgres password=postgres'
);

select extensions.ok(
  extensions.dblink_send_query(
    'match_a',
    $remote$
      select wave1_test.send_hello_as(
        '10000000-0000-0000-0000-0000000000a1',
        '10000000-0000-0000-0000-0000000000b2'
      )
    $remote$
  ) = 1,
  'A concurrent hello query is dispatched'
);
select extensions.ok(
  extensions.dblink_send_query(
    'match_b',
    $remote$
      select wave1_test.send_hello_as(
        '10000000-0000-0000-0000-0000000000b2',
        '10000000-0000-0000-0000-0000000000a1'
      )
    $remote$
  ) = 1,
  'B concurrent hello query is dispatched'
);
select extensions.lives_ok(
  $sql$
    select *
    from extensions.dblink_get_result('match_a') as result(succeeded boolean)
  $sql$,
  'A concurrent hello completes without an unhandled constraint error'
);
select extensions.lives_ok(
  $sql$
    select *
    from extensions.dblink_get_result('match_b') as result(succeeded boolean)
  $sql$,
  'B concurrent hello completes without an unhandled constraint error'
);

select extensions.is(
  (
    select count(*)::integer
    from public.matches
    where user_low_id = '10000000-0000-0000-0000-0000000000a1'
      and user_high_id = '10000000-0000-0000-0000-0000000000b2'
  ),
  1,
  'simultaneous mutual hello creates one match'
);
select extensions.is(
  (
    select count(*)::integer
    from public.likes
    where status = 'matched'
      and sender_id in (
        '10000000-0000-0000-0000-0000000000a1',
        '10000000-0000-0000-0000-0000000000b2'
      )
  ),
  2,
  'both concurrent likes are resolved as matched'
);

select extensions.dblink_disconnect('match_a');
select extensions.dblink_disconnect('match_b');

select extensions.dblink_connect(
  'heartbeat_1',
  'host=host.docker.internal port=54322 dbname=postgres user=postgres password=postgres'
);
select extensions.dblink_connect(
  'heartbeat_2',
  'host=host.docker.internal port=54322 dbname=postgres user=postgres password=postgres'
);
select extensions.dblink_connect(
  'heartbeat_3',
  'host=host.docker.internal port=54322 dbname=postgres user=postgres password=postgres'
);

select extensions.ok(
  extensions.dblink_send_query(
    'heartbeat_1',
    $remote$
      select wave1_test.heartbeat_as(
        '10000000-0000-0000-0000-0000000000a1'
      )
    $remote$
  ) = 1,
  'first heartbeat is dispatched'
);
select extensions.ok(
  extensions.dblink_send_query(
    'heartbeat_2',
    $remote$
      select wave1_test.heartbeat_as(
        '10000000-0000-0000-0000-0000000000a1'
      )
    $remote$
  ) = 1,
  'second heartbeat is dispatched'
);
select extensions.ok(
  extensions.dblink_send_query(
    'heartbeat_3',
    $remote$
      select wave1_test.heartbeat_as(
        '10000000-0000-0000-0000-0000000000a1'
      )
    $remote$
  ) = 1,
  'third heartbeat is dispatched'
);
select extensions.lives_ok(
  $sql$
    select *
    from extensions.dblink_get_result('heartbeat_1') as result(succeeded boolean)
  $sql$,
  'first concurrent heartbeat succeeds'
);
select extensions.lives_ok(
  $sql$
    select *
    from extensions.dblink_get_result('heartbeat_2') as result(succeeded boolean)
  $sql$,
  'second concurrent heartbeat succeeds'
);
select extensions.lives_ok(
  $sql$
    select *
    from extensions.dblink_get_result('heartbeat_3') as result(succeeded boolean)
  $sql$,
  'third concurrent heartbeat succeeds'
);
select extensions.is(
  (
    select count(*)::integer
    from public.user_presence
    where user_id = '10000000-0000-0000-0000-0000000000a1'
  ),
  1,
  'concurrent heartbeats preserve one presence row'
);
select extensions.ok(
  (
    select last_heartbeat_at >= statement_timestamp() - interval '10 seconds'
    from public.user_presence
    where user_id = '10000000-0000-0000-0000-0000000000a1'
  ),
  'concurrent heartbeats leave a coherent recent timestamp'
);

select extensions.dblink_disconnect('heartbeat_1');
select extensions.dblink_disconnect('heartbeat_2');
select extensions.dblink_disconnect('heartbeat_3');

select extensions.dblink_connect(
  'block_a',
  'host=host.docker.internal port=54322 dbname=postgres user=postgres password=postgres'
);
select extensions.ok(
  extensions.dblink_send_query(
    'block_a',
    $remote$
      select wave1_test.block_as(
        '10000000-0000-0000-0000-0000000000a1',
        '10000000-0000-0000-0000-0000000000b2'
      )
    $remote$
  ) = 1,
  'A block request is dispatched'
);
select extensions.lives_ok(
  $sql$
    select *
    from extensions.dblink_get_result('block_a') as result(succeeded boolean)
  $sql$,
  'A block commits before the next message'
);
select extensions.dblink_disconnect('block_a');

select extensions.is(
  (
    select status::text
    from public.matches
    where user_low_id = '10000000-0000-0000-0000-0000000000a1'
      and user_high_id = '10000000-0000-0000-0000-0000000000b2'
  ),
  'blocked',
  'the match is atomically marked blocked'
);

select extensions.dblink_connect(
  'message_b',
  'host=host.docker.internal port=54322 dbname=postgres user=postgres password=postgres'
);
select extensions.ok(
  extensions.dblink_send_query(
    'message_b',
    $remote$
      select wave1_test.send_message_as(
      '10000000-0000-0000-0000-0000000000b2',
      (
        select id
        from public.matches
        where user_low_id = '10000000-0000-0000-0000-0000000000a1'
          and user_high_id = '10000000-0000-0000-0000-0000000000b2'
      ),
      'Message concurrent apres blocage'
      )
    $remote$
  ) = 1,
  'B message request is dispatched immediately after the block'
);
select extensions.throws_ok(
  $sql$
    select *
    from extensions.dblink_get_result('message_b') as result(succeeded boolean)
  $sql$,
  '42501',
  'message is not allowed',
  'B cannot write immediately after A commits the block'
);
select extensions.dblink_disconnect('message_b');

select extensions.is(
  (
    select count(*)::integer
    from public.messages
    where sender_id = '10000000-0000-0000-0000-0000000000b2'
  ),
  0,
  'the rejected message leaves no partial write'
);

create temporary table wave1_rate_limit_results (
  allowed boolean not null
);

select extensions.dblink_connect(
  'rate_1',
  'host=host.docker.internal port=54322 dbname=postgres user=postgres password=postgres'
);
select extensions.dblink_connect(
  'rate_2',
  'host=host.docker.internal port=54322 dbname=postgres user=postgres password=postgres'
);

select extensions.ok(
  extensions.dblink_send_query(
    'rate_1',
    $remote$
      select wave1_test.consume_as_service(
        'message:bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
        1
      )
    $remote$
  ) = 1,
  'first atomic rate-limit request is dispatched'
);
select extensions.ok(
  extensions.dblink_send_query(
    'rate_2',
    $remote$
      select wave1_test.consume_as_service(
        'message:bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
        1
      )
    $remote$
  ) = 1,
  'second atomic rate-limit request is dispatched'
);
insert into wave1_rate_limit_results
select succeeded
from extensions.dblink_get_result('rate_1') as result(succeeded boolean);
insert into wave1_rate_limit_results
select succeeded
from extensions.dblink_get_result('rate_2') as result(succeeded boolean);

select extensions.is(
  (
    select count(*)::integer
    from wave1_rate_limit_results
    where allowed
  ),
  1,
  'exactly one of two simultaneous requests is allowed at limit one'
);
select extensions.is(
  (
    select consumed::integer
    from private.rate_limit_buckets
    where key_hash =
      'message:bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb'
    order by window_started_at desc
    limit 1
  ),
  2,
  'the shared PostgreSQL bucket records both concurrent attempts atomically'
);

select extensions.dblink_disconnect('rate_1');
select extensions.dblink_disconnect('rate_2');

select * from extensions.finish();

delete from private.rate_limit_buckets
where key_hash =
  'message:bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb';
delete from public.messages
where sender_id in (
  '10000000-0000-0000-0000-0000000000a1',
  '10000000-0000-0000-0000-0000000000b2'
);
delete from public.blocks
where blocker_id in (
  '10000000-0000-0000-0000-0000000000a1',
  '10000000-0000-0000-0000-0000000000b2'
);
delete from public.likes
where sender_id in (
  '10000000-0000-0000-0000-0000000000a1',
  '10000000-0000-0000-0000-0000000000b2'
);
delete from public.matches
where user_low_id = '10000000-0000-0000-0000-0000000000a1'
  and user_high_id = '10000000-0000-0000-0000-0000000000b2';
delete from public.user_presence
where user_id in (
  '10000000-0000-0000-0000-0000000000a1',
  '10000000-0000-0000-0000-0000000000b2'
);
delete from public.user_locations
where user_id in (
  '10000000-0000-0000-0000-0000000000a1',
  '10000000-0000-0000-0000-0000000000b2'
);
delete from public.user_interests
where user_id in (
  '10000000-0000-0000-0000-0000000000a1',
  '10000000-0000-0000-0000-0000000000b2'
);
delete from public.profile_photos
where profile_id in (
  '10000000-0000-0000-0000-0000000000a1',
  '10000000-0000-0000-0000-0000000000b2'
);
delete from public.profiles
where id in (
  '10000000-0000-0000-0000-0000000000a1',
  '10000000-0000-0000-0000-0000000000b2'
);
delete from auth.users
where id in (
  '10000000-0000-0000-0000-0000000000a1',
  '10000000-0000-0000-0000-0000000000b2'
);
drop schema wave1_test cascade;
