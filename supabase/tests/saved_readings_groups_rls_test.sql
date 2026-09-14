begin;

select plan(19);

select ok(
	  (select relrowsecurity from pg_class where oid = 'public.saved_items'::regclass),
	  'saved_items has RLS enabled'
);
select ok(
	  (select relrowsecurity from pg_class where oid = 'public.reading_groups'::regclass),
	  'reading_groups has RLS enabled'
);
select ok(
	  (select relrowsecurity from pg_class where oid = 'public.saved_item_groups'::regclass),
	  'saved_item_groups has RLS enabled'
);

select ok(
	  not has_table_privilege('anon', 'public.saved_items', 'select,insert,update,delete'),
	  'anon has no saved item privileges'
);
select ok(
	  not has_table_privilege('anon', 'public.reading_groups', 'select,insert,update,delete'),
	  'anon has no reading group privileges'
);
select ok(
	  not has_table_privilege('anon', 'public.saved_item_groups', 'select,insert,delete'),
	  'anon has no membership privileges'
);

select ok(
	  has_table_privilege('authenticated', 'public.saved_items', 'select,insert,update,delete'),
	  'authenticated can manage saved items'
);
select ok(
	  has_table_privilege('authenticated', 'public.reading_groups', 'select,insert,update,delete'),
	  'authenticated can manage reading groups'
);
select ok(
	  has_table_privilege('authenticated', 'public.saved_item_groups', 'select,insert,delete'),
	  'authenticated can manage memberships'
);

select ok(
	  exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'saved_items' and policyname = 'Users can view their saved items'),
	  'saved item select policy exists'
);
select ok(
	  exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'saved_items' and policyname = 'Users can update their saved items' and with_check like '%auth.uid%'),
	  'saved item update policy checks ownership'
);
select ok(
	  exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'reading_groups' and policyname = 'Users can delete non-default reading groups' and qual like '%is_default = false%'),
	  'default groups cannot be deleted by policy'
);
select ok(
	  exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'saved_item_groups' and policyname = 'Users can create their saved item groups' and with_check like '%saved_items%' and with_check like '%reading_groups%'),
	  'membership inserts require ownership of both resources'
);

select ok(
	  not has_table_privilege('anon', 'public.saved_items', 'delete'),
	  'anon cannot delete saved items'
);
select ok(
	  not has_table_privilege('anon', 'public.reading_groups', 'delete'),
	  'anon cannot delete reading groups'
);
select ok(
	  not has_table_privilege('anon', 'public.saved_item_groups', 'delete'),
	  'anon cannot delete memberships'
);

select ok(
	  exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'saved_item_groups' and policyname = 'Users can view their saved item groups'),
	  'membership select policy exists'
);
select ok(
	  exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'saved_item_groups' and policyname = 'Users can delete their saved item groups'),
	  'membership delete policy exists'
);
select ok(
	  exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'reading_groups' and policyname = 'Users can update their reading groups' and qual like '%auth.uid%' and with_check like '%auth.uid%'),
	  'reading group updates check ownership before and after mutation'
);

select * from finish();

rollback;
