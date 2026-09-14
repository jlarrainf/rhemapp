revoke execute on function public.claim_notification_delivery(uuid, text, timestamptz, integer) from public, anon, authenticated;
revoke execute on function public.complete_notification_delivery(uuid, text) from public, anon, authenticated;
revoke execute on function public.fail_notification_delivery(uuid, text) from public, anon, authenticated;

grant execute on function public.claim_notification_delivery(uuid, text, timestamptz, integer) to service_role;
grant execute on function public.complete_notification_delivery(uuid, text) to service_role;
grant execute on function public.fail_notification_delivery(uuid, text) to service_role;
