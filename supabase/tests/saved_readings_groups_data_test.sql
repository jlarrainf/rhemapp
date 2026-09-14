begin;

select plan(23);

insert into auth.users (id)
values
  ('11111111-1111-4111-8111-111111111111'),
  ('22222222-2222-4222-8222-222222222222');

set local role authenticated;
select set_config('request.jwt.claim.sub', '11111111-1111-4111-8111-111111111111', true);

select is(
  auth.uid()::text,
  '11111111-1111-4111-8111-111111111111',
  'authenticated role resolves user A from the JWT claim'
);

select is(
  (select count(*) from public.reading_groups where user_id = auth.uid() and is_default),
  1::bigint,
  'user A receives exactly one default group'
);

insert into public.saved_items (
  id, user_id, content_type, canonical_key, title, reference, snapshot_json
)
values (
  '33333333-3333-4333-8333-333333333333',
  auth.uid(),
  'liturgical-reading',
  'liturgical-reading:chile:2026-09-13:gospel',
  'Saved Gospel',
  'Matthew 18:21-35',
  '{"contentType":"liturgical-reading","canonicalKey":"liturgical-reading:chile:2026-09-13:gospel","title":"Saved Gospel","reference":"Matthew 18:21-35","excerpt":"Forgive your brother."}'::jsonb
);

select is(
  (select count(*) from public.saved_items where id = '33333333-3333-4333-8333-333333333333'),
  1::bigint,
  'user A can create one saved item'
);

select is(
  (select count(*) from public.saved_item_groups where saved_item_id = '33333333-3333-4333-8333-333333333333'),
  1::bigint,
  'new saved items are assigned to the default group'
);

select throws_ok(
  $$insert into public.saved_items (
    user_id, content_type, canonical_key, title, reference, snapshot_json
  ) values (
    '11111111-1111-4111-8111-111111111111',
    'liturgical-reading',
    'liturgical-reading:chile:2026-09-13:gospel',
    'Different snapshot',
    'Matthew 18:21-35',
    '{"contentType":"liturgical-reading","canonicalKey":"liturgical-reading:chile:2026-09-13:gospel","title":"Different snapshot","reference":"Matthew 18:21-35","excerpt":"New excerpt"}'::jsonb
  )$$,
  '23505',
  null,
  'duplicate saved identity is rejected by the database'
);

select is(
  (select count(*) from public.saved_items where user_id = auth.uid()),
  1::bigint,
  'duplicate save leaves one row and preserves the original snapshot'
);

select is(
  (select snapshot_json ->> 'title' from public.saved_items where id = '33333333-3333-4333-8333-333333333333'),
  'Saved Gospel',
  'duplicate save preserves the original snapshot title'
);

insert into public.reading_groups (id, user_id, name, normalized_name, is_default)
values (
  '55555555-5555-4555-8555-555555555555',
  auth.uid(),
  'Prayer',
  'prayer',
  false
);

select is(
  (select count(*) from public.reading_groups where user_id = auth.uid()),
  2::bigint,
  'user A can create a custom group'
);

insert into public.saved_item_groups (saved_item_id, group_id)
values (
  '33333333-3333-4333-8333-333333333333',
  '55555555-5555-4555-8555-555555555555'
);

select is(
  (select count(*) from public.saved_item_groups where saved_item_id = '33333333-3333-4333-8333-333333333333'),
  2::bigint,
  'one saved item can belong to multiple groups'
);

select set_config('request.jwt.claim.sub', '22222222-2222-4222-8222-222222222222', true);

select is(
  (select count(*) from public.saved_items where id = '33333333-3333-4333-8333-333333333333'),
  0::bigint,
  'user B cannot read user A saved items'
);

select is(
  (select count(*) from public.reading_groups where id = '55555555-5555-4555-8555-555555555555'),
  0::bigint,
  'user B cannot read user A groups'
);

select throws_ok(
  $$insert into public.saved_item_groups (saved_item_id, group_id)
    values ('33333333-3333-4333-8333-333333333333', '55555555-5555-4555-8555-555555555555')$$,
  '42501',
  null,
  'user B cannot create a cross-account membership'
);

insert into public.saved_items (
  id, user_id, content_type, canonical_key, title, reference, snapshot_json
)
values (
  '44444444-4444-4444-8444-444444444444',
  auth.uid(),
  'random-verse',
  'random-verse:PSA.23.1',
  'Random Verse',
  'Psalm 23:1',
  '{"contentType":"random-verse","canonicalKey":"random-verse:PSA.23.1","title":"Random Verse","reference":"Psalm 23:1","excerpt":"The Lord is my shepherd."}'::jsonb
);

select is(
  (select count(*) from public.saved_items where user_id = auth.uid()),
  1::bigint,
  'user B can read only their own saved item'
);

select is(
  (select count(*) from public.saved_item_groups where saved_item_id = '44444444-4444-4444-8444-444444444444'),
  1::bigint,
  'user B saved item receives their own default group'
);

select set_config('request.jwt.claim.sub', '11111111-1111-4111-8111-111111111111', true);

delete from public.saved_item_groups
where saved_item_id = '33333333-3333-4333-8333-333333333333'
  and group_id = '55555555-5555-4555-8555-555555555555';

select is(
  (select count(*) from public.saved_item_groups where saved_item_id = '33333333-3333-4333-8333-333333333333'),
  1::bigint,
  'removing a membership keeps the default relationship'
);

select is(
  (select count(*) from public.saved_items where id = '33333333-3333-4333-8333-333333333333'),
  1::bigint,
  'removing a membership keeps the saved item'
);

insert into public.saved_item_groups (saved_item_id, group_id)
values (
  '33333333-3333-4333-8333-333333333333',
  '55555555-5555-4555-8555-555555555555'
);

delete from public.reading_groups
where id = '55555555-5555-4555-8555-555555555555';

select is(
  (select count(*) from public.saved_item_groups where saved_item_id = '33333333-3333-4333-8333-333333333333'),
  1::bigint,
  'deleting a custom group cascades only its membership'
);

select is(
  (select count(*) from public.saved_items where id = '33333333-3333-4333-8333-333333333333'),
  1::bigint,
  'deleting a custom group keeps the saved item'
);

delete from public.reading_groups
where user_id = auth.uid()
  and is_default;

select is(
  (select count(*) from public.reading_groups where user_id = auth.uid() and is_default),
  1::bigint,
  'the default group cannot be deleted'
);

select is(
  (select count(*) from public.saved_item_groups where saved_item_id = '33333333-3333-4333-8333-333333333333'),
  1::bigint,
  'the default membership remains after a blocked group deletion'
);

select throws_ok(
  $$delete from public.saved_item_groups
    where saved_item_id = '33333333-3333-4333-8333-333333333333'
      and group_id = (select id from public.reading_groups where user_id = auth.uid() and is_default)$$,
  'P0001',
  null,
  'the default membership cannot be deleted directly'
);

select is(
  (select count(*) from public.saved_item_groups where saved_item_id = '33333333-3333-4333-8333-333333333333'),
  1::bigint,
  'the default membership remains after a direct delete attempt'
);

delete from public.saved_items
where id = '33333333-3333-4333-8333-333333333333';

select is(
  (select count(*) from public.saved_item_groups where saved_item_id = '33333333-3333-4333-8333-333333333333'),
  0::bigint,
  'deleting a saved item cascades its protected default membership'
);

select * from finish();

rollback;
