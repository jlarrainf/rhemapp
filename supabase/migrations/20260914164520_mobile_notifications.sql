create table public.notification_preferences (
  user_id uuid primary key references auth.users (id) on delete cascade,
  enabled boolean not null default false,
  local_time time without time zone not null default time '08:00',
  timezone text not null default 'America/Santiago',
  sunday_mode boolean not null default false,
  updated_at timestamptz not null default now(),
  constraint notification_preferences_timezone_length check (char_length(btrim(timezone)) between 1 and 100)
);

create table public.push_devices (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  platform text not null,
  token_hash char(64) not null,
  token_ciphertext text not null,
  last_seen_at timestamptz not null default now(),
  revoked_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint push_devices_platform check (platform in ('android')),
  constraint push_devices_token_hash_format check (token_hash ~ '^[0-9a-f]{64}$'),
  constraint push_devices_token_ciphertext_length check (char_length(token_ciphertext) between 20 and 10000),
  constraint push_devices_unique_token unique (user_id, token_hash)
);

create table public.notification_deliveries (
  id uuid primary key default gen_random_uuid(),
  device_id uuid not null references public.push_devices (id) on delete cascade,
  reading_key text not null,
  scheduled_for timestamptz not null,
  status text not null default 'pending',
  attempts integer not null default 0,
  provider_message_id text,
  last_error_code text,
  sent_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint notification_deliveries_reading_key_length check (char_length(btrim(reading_key)) between 1 and 200),
  constraint notification_deliveries_status check (status in ('pending', 'sending', 'sent', 'failed', 'invalid_token')),
  constraint notification_deliveries_attempts check (attempts >= 0 and attempts <= 100),
  constraint notification_deliveries_unique_reading_per_device unique (device_id, reading_key)
);

create index push_devices_active_user_idx on public.push_devices (user_id, last_seen_at desc) where revoked_at is null;
create index notification_deliveries_status_idx on public.notification_deliveries (status, updated_at asc);

create function private.set_mobile_notification_updated_at()
returns trigger language plpgsql set search_path = '' as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

revoke all on function private.set_mobile_notification_updated_at() from public;

create trigger notification_preferences_set_updated_at before update on public.notification_preferences for each row execute function private.set_mobile_notification_updated_at();
create trigger push_devices_set_updated_at before update on public.push_devices for each row execute function private.set_mobile_notification_updated_at();
create trigger notification_deliveries_set_updated_at before update on public.notification_deliveries for each row execute function private.set_mobile_notification_updated_at();

alter table public.notification_preferences enable row level security;
alter table public.push_devices enable row level security;
alter table public.notification_deliveries enable row level security;

revoke all on table public.notification_preferences from public, anon;
revoke all on table public.push_devices from public, anon, authenticated;
revoke all on table public.notification_deliveries from public, anon, authenticated;
grant select, insert, update on table public.notification_preferences to authenticated;
grant select, insert, update, delete on table public.push_devices to service_role;
grant select, insert, update, delete on table public.notification_deliveries to service_role;

create policy "Users can view their notification preferences" on public.notification_preferences for select to authenticated using ((select auth.uid()) = user_id);
create policy "Users can create their notification preferences" on public.notification_preferences for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "Users can update their notification preferences" on public.notification_preferences for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

create policy "Users can register their Android devices" on public.push_devices for insert to authenticated with check ((select auth.uid()) = user_id and platform = 'android');
create policy "Users can update their Android devices" on public.push_devices for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id and platform = 'android');

create function public.claim_notification_delivery(p_device_id uuid, p_reading_key text, p_scheduled_for timestamptz, p_max_attempts integer default 3)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare current_delivery public.notification_deliveries%rowtype;
begin
  if p_device_id is null or p_reading_key is null or char_length(btrim(p_reading_key)) not between 1 and 200 or p_scheduled_for is null or p_max_attempts < 1 then
    raise exception 'Invalid notification delivery arguments';
  end if;
  insert into public.notification_deliveries (device_id, reading_key, scheduled_for)
  values (p_device_id, btrim(p_reading_key), p_scheduled_for)
  on conflict (device_id, reading_key) do nothing;
  select * into current_delivery from public.notification_deliveries where device_id = p_device_id and reading_key = btrim(p_reading_key) for update;
  if current_delivery.status in ('sent', 'invalid_token') then return jsonb_build_object('claimed', false, 'reason', current_delivery.status, 'deliveryId', current_delivery.id); end if;
  if current_delivery.status = 'sending' and current_delivery.updated_at > now() - interval '10 minutes' then return jsonb_build_object('claimed', false, 'reason', 'in_flight', 'deliveryId', current_delivery.id); end if;
  if current_delivery.attempts >= p_max_attempts then return jsonb_build_object('claimed', false, 'reason', 'attempt_limit', 'deliveryId', current_delivery.id); end if;
  update public.notification_deliveries set status = 'sending', attempts = current_delivery.attempts + 1, scheduled_for = p_scheduled_for, last_error_code = null, updated_at = now() where id = current_delivery.id;
  return jsonb_build_object('claimed', true, 'deliveryId', current_delivery.id, 'attempts', current_delivery.attempts + 1);
end;
$$;

create function public.complete_notification_delivery(p_delivery_id uuid, p_provider_message_id text default null)
returns void language plpgsql security definer set search_path = '' as $$
begin
  update public.notification_deliveries set status = 'sent', provider_message_id = nullif(left(p_provider_message_id, 200), ''), last_error_code = null, sent_at = now(), updated_at = now() where id = p_delivery_id and status = 'sending';
end;
$$;

create function public.fail_notification_delivery(p_delivery_id uuid, p_error_code text)
returns void language plpgsql security definer set search_path = '' as $$
begin
  update public.notification_deliveries set status = case when p_error_code = 'invalid_token' then 'invalid_token' else 'failed' end, last_error_code = left(coalesce(p_error_code, 'delivery_failed'), 100), updated_at = now() where id = p_delivery_id and status = 'sending';
end;
$$;

revoke all on function public.claim_notification_delivery(uuid, text, timestamptz, integer) from public;
revoke all on function public.complete_notification_delivery(uuid, text) from public;
revoke all on function public.fail_notification_delivery(uuid, text) from public;
grant execute on function public.claim_notification_delivery(uuid, text, timestamptz, integer) to service_role;
grant execute on function public.complete_notification_delivery(uuid, text) to service_role;
grant execute on function public.fail_notification_delivery(uuid, text) to service_role;
