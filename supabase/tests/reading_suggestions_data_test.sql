begin;

select plan(8);

insert into auth.users (id, email)
values
	('11111111-1111-4111-8111-111111111111', 'suggestion-a@example.com'),
	('22222222-2222-4222-8222-222222222222', 'suggestion-b@example.com');

set local role authenticated;
select set_config('request.jwt.claim.sub', '11111111-1111-4111-8111-111111111111', true);

insert into public.reading_suggestions (author_user_id, date, reading_type, reference, source_url, body)
values (
	auth.uid(),
	'2026-09-13',
	'gospel',
	'Mateo 18:21-35',
	'https://fuente.example/2026-09-13',
	'La referencia debe comprobarse contra la fuente.'
);

select is(
	(select count(*) from public.reading_suggestions where author_user_id = auth.uid() and status = 'pending'),
	1::bigint,
	'authenticated users create pending suggestions'
);

select throws_ok(
	$$insert into public.reading_suggestions (author_user_id, date, reading_type, reference, source_url, body)
	values ('22222222-2222-4222-8222-222222222222', '2026-09-14', 'gospel', 'Juan 1:1-5', 'https://fuente.example/2026-09-14', 'No debe cruzar cuentas')$$,
	'42501',
	null,
	'users cannot create suggestions for another account'
);

select is(
	(select count(*) from public.reading_suggestions where author_user_id = '22222222-2222-4222-8222-222222222222'),
	0::bigint,
	'cross-account insert leaves no suggestion'
);

select throws_ok(
	$$update public.reading_suggestions set status = 'approved' where author_user_id = auth.uid()$$,
	'42501',
	null,
	'authors cannot change their own editorial status'
);

select throws_ok(
	$$insert into public.reading_suggestions (author_user_id, date, reading_type, reference, source_url, body)
	values (auth.uid(), '2026-09-13', 'gospel', 'Mateo 18:21-35', 'https://fuente.example/2026-09-13', 'Duplicada')$$,
	'23505',
	null,
	'duplicate pending identity is rejected'
);

select set_config('request.jwt.claim.sub', '22222222-2222-4222-8222-222222222222', true);
select is(
	(select count(*) from public.reading_suggestions),
	0::bigint,
	'users cannot read another account suggestion'
);

select throws_ok(
	$$insert into public.suggestion_events (suggestion_id, actor_user_id, to_status, comment)
	values (null, auth.uid(), 'in_review', 'No debe escribirse desde el cliente')$$,
	'42501',
	null,
	'authenticated users cannot write suggestion events'
);

select throws_ok(
	$$insert into public.published_reading_versions (reading_key, payload_json, published_by)
	values ('chile:2026-09-13', '{}'::jsonb, auth.uid())$$,
	'42501',
	null,
	'authenticated users cannot publish versions'
);

select * from finish();

rollback;
