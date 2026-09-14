begin;

select plan(19);

select ok((select relrowsecurity from pg_class where oid = 'public.notification_preferences'::regclass), 'notification preferences have RLS enabled');
select ok((select relrowsecurity from pg_class where oid = 'public.push_devices'::regclass), 'push devices have RLS enabled');
select ok((select relrowsecurity from pg_class where oid = 'public.notification_deliveries'::regclass), 'notification deliveries have RLS enabled');

select ok(has_table_privilege('authenticated', 'public.notification_preferences', 'select,insert,update'), 'authenticated can use only their preference contract');
select ok(not has_table_privilege('authenticated', 'public.push_devices', 'select,insert,update,delete'), 'authenticated cannot read or mutate sensitive device rows directly');
select ok(not has_table_privilege('authenticated', 'public.notification_deliveries', 'select,insert,update,delete'), 'authenticated cannot read delivery diagnostics');
select ok(not has_table_privilege('anon', 'public.notification_preferences', 'select,insert,update,delete'), 'anon cannot access notification preferences');

select ok(has_table_privilege('service_role', 'public.push_devices', 'select,insert,update,delete'), 'service role can manage devices server-side');
select ok(has_table_privilege('service_role', 'public.notification_deliveries', 'select,insert,update,delete'), 'service role can manage delivery records server-side');

select ok(exists (select 1 from pg_constraint where conname = 'push_devices_unique_token'), 'device token hashes are unique per user');
select ok(exists (select 1 from pg_constraint where conname = 'notification_deliveries_unique_reading_per_device'), 'delivery identity is unique per device and reading');
select ok(exists (select 1 from pg_constraint where conname = 'push_devices_token_hash_format'), 'device token hashes have a fixed format');
select ok(exists (select 1 from pg_constraint where conname = 'notification_deliveries_attempts'), 'delivery retries have a bounded attempt counter');

select ok(exists (select 1 from pg_policies where tablename = 'notification_preferences' and policyname = 'Users can view their notification preferences' and qual like '%auth.uid%'), 'preference reads check the owner');
select ok(exists (select 1 from pg_policies where tablename = 'notification_preferences' and policyname = 'Users can update their notification preferences' and qual like '%auth.uid%' and with_check like '%auth.uid%'), 'preference updates check ownership before and after');
select ok(exists (select 1 from pg_policies where tablename = 'push_devices' and policyname = 'Users can register their Android devices' and with_check like '%auth.uid%' and with_check like '%android%'), 'device registration is restricted to the authenticated owner and Android');

select ok(has_function_privilege('service_role', 'public.claim_notification_delivery(uuid,text,timestamptz,integer)', 'execute'), 'scheduler can claim a delivery atomically');
select ok(has_function_privilege('service_role', 'public.complete_notification_delivery(uuid,text)', 'execute'), 'scheduler can complete a delivery');
select ok(has_function_privilege('service_role', 'public.fail_notification_delivery(uuid,text)', 'execute'), 'scheduler can record a failed delivery');

select * from finish();

rollback;
