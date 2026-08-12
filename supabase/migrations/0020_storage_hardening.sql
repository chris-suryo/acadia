-- Round 16: stop handing out receipt photos to anyone who can guess a URL.
--
-- The trip data is deliberately open to the group: anonymous sign-in, no
-- passwords, and `using (true)` on the shared tables. That trade is fine for a
-- dozen friends and three days. Storage was a different question — the buckets
-- read `to public`, so a receipt needed no sign-in at all, and a receipt is the
-- one artifact here that carries somebody's name next to a card's last four.
--
-- So: receipts become private and are read through signed URLs. Avatars stay
-- public on purpose — they are 256px face crops behind a random uuid, and the
-- service worker caches them on the `/object/public/` path, so signing them
-- would trade a real offline guarantee for very little.

update storage.buckets set public = false where id = 'receipts';

-- Reads now go through `createSignedUrl`, which is served by the storage API
-- under the caller's own grant. No blanket select policy.
drop policy if exists "receipts read" on storage.objects;
create policy "receipts read" on storage.objects
  for select to authenticated using (bucket_id = 'receipts');

-- Writes were scoped to the bucket and nothing else, so any signed-in client
-- could drop a file at any path in it — including over someone else's. The
-- app writes `{expense_id}/{receipt_id}.jpg`, so require that shape: a folder
-- that is a real expense, and a name that is not a path traversal.
drop policy if exists "receipts write" on storage.objects;
create policy "receipts write" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'receipts'
    and array_length(storage.foldername(name), 1) = 1
    and exists (
      select 1 from public.expenses e
      where e.id::text = (storage.foldername(name))[1]
    )
  );

-- Deleting stays open to the group, like the receipt rows themselves: there is
-- no approval step here, and a wrong photo should not outlive whoever added it.
drop policy if exists "receipts remove" on storage.objects;
create policy "receipts remove" on storage.objects
  for delete to authenticated using (bucket_id = 'receipts');

-- Existing rows stored an absolute `/object/public/receipts/...` URL, which no
-- longer resolves. The client signs from the storage path instead, so keep only
-- the path and let it rebuild the link. (Nothing to convert today — the table
-- is empty — but a re-run after the trip should not resurrect dead links.)
update public.expense_receipts
set url = regexp_replace(url, '^.*/object/public/receipts/', '')
where url like '%/object/public/receipts/%';
