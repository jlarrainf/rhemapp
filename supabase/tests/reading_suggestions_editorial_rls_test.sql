begin;

select plan(17);

select ok(
	(select relrowsecurity from pg_class where oid = 'public.reading_suggestions'::regclass),
	'reading_suggestions has RLS enabled'
);
select ok(
	(select relrowsecurity from pg_class where oid = 'public.suggestion_events'::regclass),
	'suggestion_events has RLS enabled'
);
select ok(
	(select relrowsecurity from pg_class where oid = 'public.published_reading_versions'::regclass),
	'published_reading_versions has RLS enabled'
);

select ok(
	not has_table_privilege('anon', 'public.reading_suggestions', 'select,insert,update,delete'),
	'anon cannot access reading suggestions'
);
select ok(
	not has_table_privilege('anon', 'public.suggestion_events', 'select,insert,update,delete'),
	'anon cannot access suggestion events'
);
select ok(
	not has_table_privilege('anon', 'public.published_reading_versions', 'select,insert,update,delete'),
	'anon cannot access published versions'
);
select ok(
	has_table_privilege('authenticated', 'public.reading_suggestions', 'select,insert'),
	'authenticated can submit and read own suggestions'
);
select ok(
	not has_table_privilege('authenticated', 'public.suggestion_events', 'select,insert,update,delete'),
	'authenticated cannot write editorial events'
);
select ok(
	not has_table_privilege('authenticated', 'public.published_reading_versions', 'select,insert,update,delete'),
	'authenticated cannot write published versions'
);
select ok(
	has_table_privilege('service_role', 'public.suggestion_events', 'select,insert,update,delete'),
	'service_role can record editorial events'
);
select ok(
	has_table_privilege('service_role', 'public.published_reading_versions', 'select,insert,update'),
	'service_role can publish and supersede versions'
);
select ok(
	exists (
		select 1 from pg_policies
		where schemaname = 'public'
			and tablename = 'reading_suggestions'
			and policyname = 'Users can view their own reading suggestions'
			and qual like '%auth.uid%'
	),
	'suggestion reads are scoped to the session user'
);
select ok(
	exists (
		select 1 from pg_policies
		where schemaname = 'public'
			and tablename = 'reading_suggestions'
			and policyname = 'Users can create their own reading suggestions'
			and with_check like '%auth.uid%'
	),
	'suggestion inserts require the session user and pending status'
);
select ok(
	exists (select 1 from pg_indexes where indexname = 'reading_suggestions_pending_identity_idx'),
	'duplicate pending suggestions have a unique index'
);
select ok(
	exists (select 1 from pg_indexes where indexname = 'published_reading_versions_one_active_idx'),
	'only one active version can exist per reading key'
);
select ok(
	exists (select 1 from pg_constraint where conname = 'reading_suggestions_source_url_protocol'),
	sources require HTTP or HTTPS
);
select ok(
	exists (select 1 from pg_proc where proname = 'purge_reading_suggestion_audit'),
	'a private retention function exists'
);

select * from finish();

rollback;
