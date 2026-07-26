begin;

create extension if not exists pgtap with schema extensions;
select extensions.no_plan();

create or replace function pg_temp.set_onboarding_claims(p_user_id uuid)
returns void
language sql
as $$
  select pg_catalog.set_config(
    'request.jwt.claims',
    pg_catalog.jsonb_build_object(
      'sub', p_user_id,
      'role', 'authenticated',
      'aal', 'aal1'
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
  (
    '00000000-0000-0000-0000-0000000020a1',
    'authenticated',
    'authenticated',
    '{}'::jsonb,
    '{}'::jsonb,
    now(),
    now()
  ),
  (
    '00000000-0000-0000-0000-0000000020b2',
    'authenticated',
    'authenticated',
    '{}'::jsonb,
    '{}'::jsonb,
    now(),
    now()
  );

select extensions.has_column(
  'public',
  'profiles',
  'adult_confirmed_at',
  'profiles store the explicit majority confirmation'
);

select extensions.has_column(
  'public',
  'profile_photos',
  'moderation_status',
  'profile photos expose a moderation state'
);

select extensions.ok(
  (
    select pg_catalog.bool_and(procedure.prosecdef)
    from pg_catalog.pg_proc as procedure
    join pg_catalog.pg_namespace as namespace
      on namespace.oid = procedure.pronamespace
    where namespace.nspname = 'public'
      and procedure.proname = any(array[
        'get_my_onboarding_state',
        'list_onboarding_interests',
        'save_my_profile_draft',
        'replace_my_interests',
        'add_my_profile_photo',
        'delete_my_profile_photo',
        'reorder_my_profile_photos',
        'complete_my_onboarding'
      ])
  ),
  'all onboarding RPCs are security definer'
);

select extensions.ok(
  (
    select pg_catalog.bool_and(
      procedure.proconfig = array['search_path=""']::text[]
    )
    from pg_catalog.pg_proc as procedure
    join pg_catalog.pg_namespace as namespace
      on namespace.oid = procedure.pronamespace
    where namespace.nspname = 'public'
      and procedure.proname = any(array[
        'get_my_onboarding_state',
        'list_onboarding_interests',
        'save_my_profile_draft',
        'replace_my_interests',
        'add_my_profile_photo',
        'delete_my_profile_photo',
        'reorder_my_profile_photos',
        'complete_my_onboarding'
      ])
  ),
  'all onboarding RPCs use an empty search_path'
);

select extensions.ok(
  pg_catalog.has_function_privilege(
    'authenticated',
    'public.complete_my_onboarding()',
    'execute'
  ),
  'authenticated users may complete their onboarding'
);

select extensions.ok(
  not pg_catalog.has_function_privilege(
    'anon',
    'public.complete_my_onboarding()',
    'execute'
  ),
  'anonymous users may not complete onboarding'
);

set local role authenticated;
select pg_temp.set_onboarding_claims(
  '00000000-0000-0000-0000-0000000020a1'
);

select extensions.throws_ok(
  $$
    select public.save_my_profile_draft(
      'Awa',
      (current_date - interval '17 years')::date,
      'woman',
      array['man'::public.gender],
      'Une bio',
      true,
      2
    )
  $$,
  '22023',
  'invalid profile draft',
  'a minor cannot save an onboarding profile'
);

select extensions.lives_ok(
  $$
    select public.save_my_profile_draft(
      'Awa',
      date '2000-05-14',
      'woman',
      array['man'::public.gender],
      'Toujours partante pour une expo.',
      true,
      2
    )
  $$,
  'the owner can progressively save valid profile information'
);

select extensions.results_eq(
  $$
    select
      first_name,
      birth_date::text,
      adult_confirmed,
      onboarding_step::integer
    from public.get_my_onboarding_state()
  $$,
  $$
    values ('Awa'::text, '2000-05-14'::text, true, 2)
  $$,
  'the onboarding state resumes the current owner draft'
);

select extensions.throws_ok(
  $$
    select public.save_my_profile_draft(
      'Awa',
      date '1999-05-14',
      'woman',
      array['man'::public.gender],
      'Une bio',
      true,
      2
    )
  $$,
  '42501',
  'birth date requires a dedicated review',
  'a validated birth date is immutable through the regular flow'
);

select extensions.throws_ok(
  $$
    select public.replace_my_interests(array[1]::bigint[])
  $$,
  '22023',
  'invalid interests',
  'fewer than two interests are rejected'
);

select extensions.throws_ok(
  $$
    select public.replace_my_interests(array[1, 2, 3, 4]::bigint[])
  $$,
  '22023',
  'invalid interests',
  'more than three interests are rejected'
);

select extensions.lives_ok(
  $$
    select public.replace_my_interests(array[1, 2]::bigint[])
  $$,
  'two active interests are accepted'
);

select extensions.lives_ok(
  $$
    select public.add_my_profile_photo(
      'leco/profiles/a/photo-1',
      'https://res.cloudinary.com/leco/image/upload/photo-1.jpg',
      1,
      1200,
      1600
    );
    select public.add_my_profile_photo(
      'leco/profiles/a/photo-2',
      'https://res.cloudinary.com/leco/image/upload/photo-2.jpg',
      1,
      1200,
      1600
    )
  $$,
  'two signed Cloudinary assets can be registered'
);

select extensions.is(
  public.complete_my_onboarding(),
  true,
  'a coherent profile with two photos and two interests completes'
);

select extensions.is(
  (
    select is_profile_complete
    from public.get_my_onboarding_state()
  ),
  true,
  'completion is reflected in the owner state'
);

select extensions.throws_ok(
  $$
    select public.delete_my_profile_photo(
      (
        select (photo ->> 'id')::uuid
        from public.get_my_onboarding_state(),
        lateral pg_catalog.jsonb_array_elements(photos) as photo
        order by (photo ->> 'displayOrder')::integer
        limit 1
      )
    )
  $$,
  '23514',
  'two photos are required',
  'a complete profile cannot be reduced below two photos'
);

select extensions.lives_ok(
  $$
    select public.add_my_profile_photo(
      'leco/profiles/a/photo-3',
      'https://res.cloudinary.com/leco/image/upload/photo-3.jpg',
      1,
      1200,
      1600
    )
  $$,
  'a third photo can be added'
);

select extensions.lives_ok(
  $$
    select public.reorder_my_profile_photos(
      (
        select pg_catalog.array_agg(
          (photo ->> 'id')::uuid
          order by (photo ->> 'displayOrder')::integer desc
        )
        from public.get_my_onboarding_state(),
        lateral pg_catalog.jsonb_array_elements(photos) as photo
      )
    )
  $$,
  'the owner can atomically reorder all active photos'
);

select extensions.is(
  (
    select pg_catalog.count(*)::integer
    from public.get_my_onboarding_state(),
    lateral pg_catalog.jsonb_array_elements(photos) as photo
  ),
  3,
  'reordering preserves every photo'
);

select extensions.throws_ok(
  $$
    select public.add_my_profile_photo(
      'leco/profiles/a/photo-4',
      'http://attacker.test/photo.jpg',
      1,
      1200,
      1600
    )
  $$,
  '22023',
  'invalid photo',
  'a non-Cloudinary URL is rejected'
);

select pg_temp.set_onboarding_claims(
  '00000000-0000-0000-0000-0000000020b2'
);

select extensions.results_eq(
  $$
    select
      first_name,
      pg_catalog.jsonb_array_length(photos),
      pg_catalog.cardinality(interest_ids)
    from public.get_my_onboarding_state()
  $$,
  $$
    values (null::text, 0, 0)
  $$,
  'another user receives only their own empty onboarding state'
);

select extensions.throws_ok(
  $$
    update public.profiles
    set first_name = 'Intrusion'
    where id = '00000000-0000-0000-0000-0000000020a1'
  $$,
  '42501',
  null,
  'direct modification of a foreign profile is denied'
);

select extensions.throws_ok(
  $$
    select public.delete_my_profile_photo(
      (
        select id
        from public.profile_photos
        where profile_id = '00000000-0000-0000-0000-0000000020a1'
        limit 1
      )
    )
  $$,
  'P0002',
  'photo not found',
  'the photo deletion RPC cannot target another owner'
);

reset role;

select * from extensions.finish();
rollback;
