-- Leco: non-personal, deterministic MVP reference data.
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

insert into private.app_settings (key, value)
values ('hello_daily_limit', '25'::jsonb)
on conflict (key) do update
set
  value = excluded.value,
  updated_at = statement_timestamp();
