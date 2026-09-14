begin;

select plan(14);

select ok(
	(select relrowsecurity from pg_class where oid = 'public.shares'::regclass),
	'shares has RLS enabled'
);

select ok(
	not has_table_privilege('anon', 'public.shares', 'select,insert,update,delete'),
	'anon has no share privileges'
);

select ok(
	has_table_privilege('authenticated', 'public.shares', 'select'),
	'authenticated can read their share rows'
);

select ok(
	has_column_privilege('authenticated', 'public.shares', 'token_hash', 'insert')
	and has_column_privilege('authenticated', 'public.shares', 'owner_user_id', 'insert')
	and has_column_privilege('authenticated', 'public.shares', 'resource_type', 'insert')
	and has_column_privilege('authenticated', 'public.shares', 'resource_id', 'insert'),
	'authenticated can insert only share creation columns'
);

select ok(
	has_column_privilege('authenticated', 'public.shares', 'revoked_at', 'update'),
	'authenticated can update the revocation timestamp'
);

select ok(
	has_table_privilege('service_role', 'public.shares', 'select'),
	'service_role can resolve shares server-side'
);

select ok(
	exists (
		select 1 from pg_constraint
		where conrelid = 'public.shares'::regclass
			and conname = 'shares_token_hash_format'
	),
	'token hashes have a fixed hexadecimal format constraint'
);

select ok(
	exists (
		select 1 from pg_constraint
		where conrelid = 'public.shares'::regclass
			and conname = 'shares_owner_user_id_fkey'
	),
	'shares belong to an auth user through a foreign key'
);

select ok(
	exists (
		select 1 from pg_policies
		where schemaname = 'public'
			and tablename = 'shares'
			and policyname = 'Users can view their shares'
			and qual like '%auth.uid%'
	),
	'share reads are limited to the owner'
);

select ok(
	exists (
		select 1 from pg_policies
		where schemaname = 'public'
			and tablename = 'shares'
			and policyname = 'Users can create shares for their saved readings'
			and with_check like '%saved_items%'
			and with_check like '%auth.uid%'
	),
	'share creation checks ownership of the saved reading'
);

select ok(
	exists (
		select 1 from pg_policies
		where schemaname = 'public'
			and tablename = 'shares'
			and policyname = 'Users can revoke their shares'
			and qual like '%auth.uid%'
			and with_check like '%auth.uid%'
	),
	'share revocation checks ownership before and after update'
);

select ok(
		not has_column_privilege('authenticated', 'public.shares', 'owner_user_id', 'update'),
		'authenticated cannot reassign share ownership through column grants'
);

select ok(
		not has_column_privilege('authenticated', 'public.shares', 'token_hash', 'update'),
		'authenticated cannot replace a share token through column grants'
);

select ok(
	exists (
		select 1 from pg_indexes
		where schemaname = 'public'
			and tablename = 'shares'
			and indexname = 'shares_active_token_idx'
	),
	'active token lookup has a dedicated index'
);

select * from finish();

rollback;
