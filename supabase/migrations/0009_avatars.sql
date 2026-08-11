-- Profile pictures: a public avatars bucket (one object per user at
-- {uid}.jpg) and the URL on the profile row. Anyone reads; you write only
-- your own path.

alter table profiles add column avatar_url text not null default '';

insert into storage.buckets (id, name, public) values ('avatars', 'avatars', true)
on conflict (id) do update set public = true;

create policy "avatars read" on storage.objects
  for select to public using (bucket_id = 'avatars');
create policy "avatars insert own" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'avatars' and name = auth.uid()::text || '.jpg');
create policy "avatars update own" on storage.objects
  for update to authenticated
  using (bucket_id = 'avatars' and name = auth.uid()::text || '.jpg')
  with check (bucket_id = 'avatars' and name = auth.uid()::text || '.jpg');
create policy "avatars delete own" on storage.objects
  for delete to authenticated
  using (bucket_id = 'avatars' and name = auth.uid()::text || '.jpg');
