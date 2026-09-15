begin;
select plan(15);

select has_table('public', 'notification_preferences', 'creates notification preferences');
select has_table('public', 'push_devices', 'creates push devices');
select has_table('public', 'notification_deliveries', 'creates notification deliveries');
select col_is_pk('public', 'notification_preferences', 'user_id', 'one preference per user');
select col_is_unique('public', 'push_devices', ARRAY['user_id', 'token_hash'], 'deduplicates a token per user');
select col_is_unique('public', 'notification_deliveries', ARRAY['device_id', 'reading_key'], 'deduplicates a delivery per device and reading');
select col_is_fk('public', 'push_devices', 'user_id', 'push device belongs to auth user');
select col_is_fk('public', 'notification_deliveries', 'device_id', 'delivery belongs to device');
select has_check('public', 'push_devices', 'push_devices_platform', 'only Android devices are accepted');
select has_check('public', 'notification_deliveries', 'notification_deliveries_status', 'delivery statuses are constrained');
select policies_are('public', 'notification_preferences', ARRAY[
  'Users can view their notification preferences',
  'Users can create their notification preferences',
  'Users can update their notification preferences'
], 'preferences use owner policies');
select policies_are('public', 'push_devices', ARRAY[
  'Users can register their Android devices',
  'Users can update their Android devices'
], 'device policies are explicit');
select has_function('public', 'claim_notification_delivery', ARRAY['uuid', 'text', 'timestamp with time zone', 'integer'], 'claim RPC exists');
select has_function('public', 'complete_notification_delivery', ARRAY['uuid', 'text'], 'complete RPC exists');
select has_function('public', 'fail_notification_delivery', ARRAY['uuid', 'text'], 'failure RPC exists');

select * from finish();
rollback;
