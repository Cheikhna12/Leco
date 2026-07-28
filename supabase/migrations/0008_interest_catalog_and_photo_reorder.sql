begin;

-- Reference data belongs to every environment, including hosted projects.
insert into public.interests (slug, label_fr)
values
  ('afrobeats', 'Afrobeats'),
  ('art', 'Art'),
  ('balades', 'Balades'),
  ('cinema', 'Cinéma'),
  ('cuisine', 'Cuisine'),
  ('danse', 'Danse'),
  ('entrepreneuriat', 'Entrepreneuriat'),
  ('football', 'Football'),
  ('gaming', 'Jeux vidéo'),
  ('lecture', 'Lecture'),
  ('mode', 'Mode'),
  ('musique', 'Musique'),
  ('photographie', 'Photographie'),
  ('sport', 'Sport'),
  ('voyages', 'Voyages')
on conflict (slug) do update
set
  label_fr = excluded.label_fr,
  is_active = true;

create or replace function public.reorder_my_profile_photos(p_photo_ids uuid[])
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_active_count integer;
  v_reorder_marker timestamptz := pg_catalog.clock_timestamp();
begin
  if v_user_id is null then
    raise exception using errcode = '28000', message = 'authentication required';
  end if;

  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended('profile_photos:' || v_user_id::text, 0)
  );

  select pg_catalog.count(*)::integer
  into v_active_count
  from public.profile_photos as photo
  where photo.profile_id = v_user_id
    and photo.deleted_at is null;

  if coalesce(pg_catalog.cardinality(p_photo_ids), 0) <> v_active_count
    or v_active_count not between 1 and 4
    or (
      select pg_catalog.count(distinct photo_id)
      from pg_catalog.unnest(coalesce(p_photo_ids, '{}'::uuid[])) as photo_id
    ) <> v_active_count
    or exists (
      select 1
      from pg_catalog.unnest(coalesce(p_photo_ids, '{}'::uuid[]))
        as requested(photo_id)
      left join public.profile_photos as photo
        on photo.id = requested.photo_id
        and photo.profile_id = v_user_id
        and photo.deleted_at is null
      where photo.id is null
    )
  then
    raise exception using errcode = '22023', message = 'invalid photo order';
  end if;

  -- Temporarily exclude the set from the partial unique index, then restore it
  -- with the requested order. Stable IDs and every photo attribute are kept.
  update public.profile_photos as photo
  set deleted_at = v_reorder_marker
  where photo.profile_id = v_user_id
    and photo.deleted_at is null;

  update public.profile_photos as photo
  set
    sort_order = requested.ordinality::smallint,
    deleted_at = null
  from pg_catalog.unnest(p_photo_ids) with ordinality
    as requested(photo_id, ordinality)
  where photo.id = requested.photo_id
    and photo.profile_id = v_user_id
    and photo.deleted_at = v_reorder_marker;
end;
$$;

commit;
