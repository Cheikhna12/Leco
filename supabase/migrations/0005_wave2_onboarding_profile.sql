-- Wave 2 onboarding and profile hardening.
-- All private profile mutations remain owner-scoped, transactional and exposed
-- only through narrowly granted security-definer RPCs.

create type public.photo_moderation_status as enum (
  'pending',
  'approved',
  'rejected'
);

alter table public.profiles
  add column adult_confirmed_at timestamptz,
  add column onboarding_step smallint not null default 1,
  add constraint profiles_onboarding_step_range
    check (onboarding_step between 1 and 4);

alter table public.profile_photos
  add column moderation_status public.photo_moderation_status
    not null default 'pending';

create index profile_photos_moderation_queue_idx
  on public.profile_photos (moderation_status, created_at)
  where deleted_at is null;

create or replace function private.refresh_profile_completion(p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_photo_count integer;
  v_interest_count integer;
begin
  select pg_catalog.count(*)::integer
  into v_photo_count
  from public.profile_photos
  where profile_id = p_user_id
    and deleted_at is null
    and moderation_status <> 'rejected';

  select pg_catalog.count(*)::integer
  into v_interest_count
  from public.user_interests
  where user_id = p_user_id;

  update public.profiles
  set is_profile_complete = (
    first_name is not null
    and birth_date is not null
    and gender is not null
    and pg_catalog.cardinality(searching_for) between 1 and 5
    and (bio is null or pg_catalog.char_length(bio) <= 150)
    and v_photo_count between 2 and 4
    and v_interest_count between 2 and 3
  )
  where id = p_user_id;
end;
$$;

create or replace function private.enforce_profile_completion()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_photo_count integer;
  v_interest_count integer;
begin
  select pg_catalog.count(*)::integer
  into v_photo_count
  from public.profile_photos
  where profile_id = new.id
    and deleted_at is null
    and moderation_status <> 'rejected';

  select pg_catalog.count(*)::integer
  into v_interest_count
  from public.user_interests
  where user_id = new.id;

  new.is_profile_complete := (
    new.first_name is not null
    and pg_catalog.btrim(new.first_name) <> ''
    and new.birth_date is not null
    and new.gender is not null
    and pg_catalog.cardinality(new.searching_for) between 1 and 5
    and (new.bio is null or pg_catalog.char_length(new.bio) <= 150)
    and v_photo_count between 2 and 4
    and v_interest_count between 2 and 3
  );

  return new;
end;
$$;

drop trigger if exists profile_photos_refresh_completion
  on public.profile_photos;
create trigger profile_photos_refresh_completion
after insert or update of profile_id, deleted_at, moderation_status or delete
on public.profile_photos
for each row execute function private.refresh_profile_from_child();

create or replace function public.get_my_onboarding_state()
returns table (
  first_name text,
  birth_date date,
  gender public.gender,
  searching_for public.gender[],
  bio text,
  adult_confirmed boolean,
  onboarding_step smallint,
  is_profile_complete boolean,
  photos jsonb,
  interest_ids bigint[]
)
language plpgsql
security definer
set search_path = ''
stable
as $$
declare
  v_user_id uuid := auth.uid();
begin
  if v_user_id is null then
    raise exception using errcode = '28000', message = 'authentication required';
  end if;

  return query
  select
    profile.first_name,
    profile.birth_date,
    profile.gender,
    profile.searching_for,
    profile.bio,
    profile.adult_confirmed_at is not null,
    profile.onboarding_step,
    profile.is_profile_complete,
    coalesce(
      (
        select pg_catalog.jsonb_agg(
          pg_catalog.jsonb_build_object(
            'id', photo.id,
            'secureUrl', photo.secure_url,
            'displayOrder', photo.sort_order,
            'moderationStatus', photo.moderation_status
          )
          order by photo.sort_order
        )
        from public.profile_photos as photo
        where photo.profile_id = v_user_id
          and photo.deleted_at is null
      ),
      '[]'::jsonb
    ),
    coalesce(
      (
        select pg_catalog.array_agg(selection.interest_id order by selection.interest_id)
        from public.user_interests as selection
        where selection.user_id = v_user_id
      ),
      '{}'::bigint[]
    )
  from public.profiles as profile
  where profile.id = v_user_id;
end;
$$;

create or replace function public.list_onboarding_interests()
returns table (
  id bigint,
  slug text,
  label_fr text
)
language sql
security definer
set search_path = ''
stable
as $$
  select interest.id, interest.slug, interest.label_fr
  from public.interests as interest
  where interest.is_active
    and auth.uid() is not null
  order by interest.label_fr;
$$;

create or replace function public.save_my_profile_draft(
  p_first_name text,
  p_birth_date date,
  p_gender public.gender,
  p_searching_for public.gender[],
  p_bio text,
  p_adult_confirmed boolean,
  p_onboarding_step integer default 2
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_existing_birth_date date;
begin
  if v_user_id is null then
    raise exception using errcode = '28000', message = 'authentication required';
  end if;

  if p_first_name is null
    or pg_catalog.char_length(pg_catalog.btrim(p_first_name)) not between 2 and 40
    or p_birth_date is null
    or p_birth_date > current_date - interval '18 years'
    or p_birth_date < current_date - interval '100 years'
    or p_gender is null
    or p_searching_for is null
    or pg_catalog.cardinality(p_searching_for) not between 1 and 5
    or p_bio is null
    or pg_catalog.char_length(pg_catalog.btrim(p_bio)) > 150
    or p_adult_confirmed is not true
    or p_onboarding_step not between 1 and 4
  then
    raise exception using errcode = '22023', message = 'invalid profile draft';
  end if;

  select profile.birth_date
  into v_existing_birth_date
  from public.profiles as profile
  where profile.id = v_user_id
  for update;

  if v_existing_birth_date is not null
    and v_existing_birth_date <> p_birth_date
  then
    raise exception using
      errcode = '42501',
      message = 'birth date requires a dedicated review';
  end if;

  update public.profiles
  set
    first_name = pg_catalog.btrim(p_first_name),
    birth_date = p_birth_date,
    gender = p_gender,
    searching_for = p_searching_for,
    bio = pg_catalog.btrim(p_bio),
    adult_confirmed_at = coalesce(adult_confirmed_at, pg_catalog.statement_timestamp()),
    onboarding_step = greatest(onboarding_step::integer, p_onboarding_step)
  where id = v_user_id
    and account_status = 'active'
    and deletion_requested_at is null
    and (
      suspended_until is null
      or suspended_until <= pg_catalog.statement_timestamp()
    );

  if not found then
    raise exception using errcode = '42501', message = 'profile update is not allowed';
  end if;
end;
$$;

create or replace function public.replace_my_interests(
  p_interest_ids bigint[]
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_distinct_count integer;
begin
  if v_user_id is null then
    raise exception using errcode = '28000', message = 'authentication required';
  end if;

  select pg_catalog.count(distinct interest_id)::integer
  into v_distinct_count
  from pg_catalog.unnest(coalesce(p_interest_ids, '{}'::bigint[])) as interest_id;

  if v_distinct_count not between 2 and 3
    or v_distinct_count <> pg_catalog.cardinality(p_interest_ids)
    or exists (
      select 1
      from pg_catalog.unnest(p_interest_ids) as selected(interest_id)
      left join public.interests as interest
        on interest.id = selected.interest_id
        and interest.is_active
      where interest.id is null
    )
  then
    raise exception using errcode = '22023', message = 'invalid interests';
  end if;

  perform 1
  from public.profiles as profile
  where profile.id = v_user_id
    and profile.account_status = 'active'
  for update;

  if not found then
    raise exception using errcode = '42501', message = 'profile update is not allowed';
  end if;

  delete from public.user_interests
  where user_id = v_user_id;

  insert into public.user_interests (user_id, interest_id)
  select v_user_id, selected.interest_id
  from pg_catalog.unnest(p_interest_ids) as selected(interest_id);

  update public.profiles
  set onboarding_step = greatest(onboarding_step, 4)
  where id = v_user_id;
end;
$$;

create or replace function public.add_my_profile_photo(
  p_cloudinary_public_id text,
  p_secure_url text,
  p_cloudinary_version integer,
  p_width integer,
  p_height integer
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_photo_id uuid;
  v_next_order smallint;
begin
  if v_user_id is null then
    raise exception using errcode = '28000', message = 'authentication required';
  end if;

  if p_cloudinary_public_id is null
    or pg_catalog.char_length(p_cloudinary_public_id) not between 1 and 255
    or p_secure_url !~ '^https://res\.cloudinary\.com/'
    or p_width is null or p_width < 1
    or p_height is null or p_height < 1
  then
    raise exception using errcode = '22023', message = 'invalid photo';
  end if;

  perform 1
  from public.profiles as profile
  where profile.id = v_user_id
    and profile.account_status = 'active'
  for update;

  if not found then
    raise exception using errcode = '42501', message = 'photo update is not allowed';
  end if;

  select coalesce(pg_catalog.max(photo.sort_order), 0) + 1
  into v_next_order
  from public.profile_photos as photo
  where photo.profile_id = v_user_id
    and photo.deleted_at is null;

  if v_next_order > 4 then
    raise exception using errcode = '23514', message = 'photo limit reached';
  end if;

  insert into public.profile_photos (
    profile_id,
    cloudinary_public_id,
    cloudinary_version,
    secure_url,
    sort_order,
    width,
    height
  )
  values (
    v_user_id,
    p_cloudinary_public_id,
    p_cloudinary_version,
    p_secure_url,
    v_next_order,
    p_width,
    p_height
  )
  returning id into v_photo_id;

  update public.profiles
  set onboarding_step = greatest(onboarding_step, 3)
  where id = v_user_id;

  return v_photo_id;
end;
$$;

create or replace function public.delete_my_profile_photo(p_photo_id uuid)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_public_id text;
  v_is_complete boolean;
  v_remaining integer;
begin
  if v_user_id is null then
    raise exception using errcode = '28000', message = 'authentication required';
  end if;

  select profile.is_profile_complete
  into v_is_complete
  from public.profiles as profile
  where profile.id = v_user_id
  for update;

  select photo.cloudinary_public_id
  into v_public_id
  from public.profile_photos as photo
  where photo.id = p_photo_id
    and photo.profile_id = v_user_id
    and photo.deleted_at is null
  for update;

  if v_public_id is null then
    raise exception using errcode = 'P0002', message = 'photo not found';
  end if;

  select pg_catalog.count(*)::integer - 1
  into v_remaining
  from public.profile_photos as photo
  where photo.profile_id = v_user_id
    and photo.deleted_at is null;

  if v_is_complete and v_remaining < 2 then
    raise exception using errcode = '23514', message = 'two photos are required';
  end if;

  update public.profile_photos
  set deleted_at = pg_catalog.statement_timestamp()
  where id = p_photo_id;

  with moved as (
    delete from public.profile_photos as photo
    where photo.profile_id = v_user_id
      and photo.deleted_at is null
    returning
      photo.id,
      photo.profile_id,
      photo.cloudinary_public_id,
      photo.cloudinary_version,
      photo.secure_url,
      photo.sort_order,
      photo.width,
      photo.height,
      photo.created_at,
      photo.moderation_status
  )
  insert into public.profile_photos (
    id,
    profile_id,
    cloudinary_public_id,
    cloudinary_version,
    secure_url,
    sort_order,
    width,
    height,
    created_at,
    moderation_status
  )
  select
    moved.id,
    moved.profile_id,
    moved.cloudinary_public_id,
    moved.cloudinary_version,
    moved.secure_url,
    pg_catalog.row_number() over (
      order by moved.sort_order, moved.created_at
    )::smallint,
    moved.width,
    moved.height,
    moved.created_at,
    moved.moderation_status
  from moved;

  return v_public_id;
end;
$$;

create or replace function public.reorder_my_profile_photos(p_photo_ids uuid[])
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_active_count integer;
begin
  if v_user_id is null then
    raise exception using errcode = '28000', message = 'authentication required';
  end if;

  select pg_catalog.count(*)::integer
  into v_active_count
  from public.profile_photos as photo
  where photo.profile_id = v_user_id
    and photo.deleted_at is null;

  if pg_catalog.cardinality(p_photo_ids) <> v_active_count
    or v_active_count not between 1 and 4
    or (
      select pg_catalog.count(distinct photo_id)
      from pg_catalog.unnest(p_photo_ids) as photo_id
    ) <> v_active_count
    or exists (
      select 1
      from pg_catalog.unnest(p_photo_ids) as requested(photo_id)
      left join public.profile_photos as photo
        on photo.id = requested.photo_id
        and photo.profile_id = v_user_id
        and photo.deleted_at is null
      where photo.id is null
    )
  then
    raise exception using errcode = '22023', message = 'invalid photo order';
  end if;

  -- Delete/reinsert in the same transaction to avoid transient collisions in
  -- the partial unique index while retaining stable photo identifiers.
  with moved as (
    delete from public.profile_photos as photo
    where photo.profile_id = v_user_id
      and photo.deleted_at is null
    returning
      photo.id,
      photo.profile_id,
      photo.cloudinary_public_id,
      photo.cloudinary_version,
      photo.secure_url,
      photo.width,
      photo.height,
      photo.created_at,
      photo.moderation_status
  )
  insert into public.profile_photos (
    id,
    profile_id,
    cloudinary_public_id,
    cloudinary_version,
    secure_url,
    sort_order,
    width,
    height,
    created_at,
    moderation_status
  )
  select
    moved.id,
    moved.profile_id,
    moved.cloudinary_public_id,
    moved.cloudinary_version,
    moved.secure_url,
    requested.ordinality::smallint,
    moved.width,
    moved.height,
    moved.created_at,
    moved.moderation_status
  from moved
  join pg_catalog.unnest(p_photo_ids) with ordinality
    as requested(photo_id, ordinality)
    on requested.photo_id = moved.id;
end;
$$;

create or replace function public.complete_my_onboarding()
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_is_complete boolean;
begin
  if v_user_id is null then
    raise exception using errcode = '28000', message = 'authentication required';
  end if;

  perform private.refresh_profile_completion(v_user_id);

  select (
    profile.is_profile_complete
    and profile.adult_confirmed_at is not null
  )
  into v_is_complete
  from public.profiles as profile
  where profile.id = v_user_id
    and profile.account_status = 'active'
  for update;

  if v_is_complete is not true then
    raise exception using errcode = '23514', message = 'profile is incomplete';
  end if;

  update public.profiles
  set onboarding_step = 4
  where id = v_user_id;

  return true;
end;
$$;

-- Keep the Wave 1 compatibility RPC safe: a validated birth date is immutable.
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
    raise exception using errcode = '28000', message = 'authentication required';
  end if;

  if p_first_name is null
    or p_birth_date is null
    or p_gender is null
    or p_searching_for is null
    or pg_catalog.cardinality(p_searching_for) not between 1 and 5
  then
    raise exception using errcode = '22023', message = 'invalid profile';
  end if;

  if p_birth_date > current_date - interval '18 years' then
    raise exception using
      errcode = '22023',
      message = 'profile owner must be at least 18 years old';
  end if;

  update public.profiles
  set
    first_name = p_first_name,
    gender = p_gender,
    searching_for = p_searching_for,
    bio = p_bio,
    is_discoverable = p_is_discoverable
  where id = v_user_id
    and birth_date = p_birth_date
    and account_status = 'active'
    and deletion_requested_at is null
    and (
      suspended_until is null
      or suspended_until <= pg_catalog.statement_timestamp()
    );

  if not found then
    raise exception using
      errcode = '42501',
      message = 'profile update is not allowed';
  end if;
end;
$$;

revoke all on function public.get_my_onboarding_state()
  from public, anon, authenticated;
revoke all on function public.list_onboarding_interests()
  from public, anon, authenticated;
revoke all on function public.save_my_profile_draft(
  text, date, public.gender, public.gender[], text, boolean, integer
) from public, anon, authenticated;
revoke all on function public.replace_my_interests(bigint[])
  from public, anon, authenticated;
revoke all on function public.add_my_profile_photo(
  text, text, integer, integer, integer
) from public, anon, authenticated;
revoke all on function public.delete_my_profile_photo(uuid)
  from public, anon, authenticated;
revoke all on function public.reorder_my_profile_photos(uuid[])
  from public, anon, authenticated;
revoke all on function public.complete_my_onboarding()
  from public, anon, authenticated;

grant execute on function public.get_my_onboarding_state()
  to authenticated;
grant execute on function public.list_onboarding_interests()
  to authenticated;
grant execute on function public.save_my_profile_draft(
  text, date, public.gender, public.gender[], text, boolean, integer
) to authenticated;
grant execute on function public.replace_my_interests(bigint[])
  to authenticated;
grant execute on function public.add_my_profile_photo(
  text, text, integer, integer, integer
) to authenticated;
grant execute on function public.delete_my_profile_photo(uuid)
  to authenticated;
grant execute on function public.reorder_my_profile_photos(uuid[])
  to authenticated;
grant execute on function public.complete_my_onboarding()
  to authenticated;
