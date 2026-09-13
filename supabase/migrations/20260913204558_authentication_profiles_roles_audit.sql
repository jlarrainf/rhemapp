create schema if not exists private;

revoke all on schema private from public;

create type public.app_role as enum ('user', 'editor', 'admin');

create table public.profiles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  avatar_url text,
  locale text not null default 'es-CL',
  timezone text not null default 'America/Santiago',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_display_name_length check (display_name is null or char_length(display_name) between 1 and 120),
  constraint profiles_locale_format check (locale ~ '^[a-z]{2}(?:-[A-Z]{2})?$'),
  constraint profiles_timezone_not_blank check (char_length(btrim(timezone)) > 0)
);

create table public.roles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  role public.app_role not null default 'user',
  granted_by uuid references auth.users (id) on delete set null,
  granted_at timestamptz not null default now()
);

create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_user_id uuid references auth.users (id) on delete set null,
  action text not null,
  target_type text not null,
  target_id text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  anonymized_at timestamptz,
  constraint audit_logs_action_not_blank check (char_length(btrim(action)) > 0),
  constraint audit_logs_target_type_not_blank check (char_length(btrim(target_type)) > 0)
);

insert into public.profiles (user_id, display_name, avatar_url)
select
  users.id,
  nullif(coalesce(users.raw_user_meta_data ->> 'full_name', users.raw_user_meta_data ->> 'name'), ''),
  nullif(users.raw_user_meta_data ->> 'avatar_url', '')
from auth.users as users
on conflict (user_id) do nothing;

insert into public.roles (user_id, role)
select users.id, 'user'
from auth.users as users
on conflict (user_id) do nothing;

create index roles_role_idx on public.roles (role);
create index roles_granted_by_idx on public.roles (granted_by);
create index audit_logs_actor_user_id_idx on public.audit_logs (actor_user_id);
create index audit_logs_created_at_idx on public.audit_logs (created_at);
create index audit_logs_target_idx on public.audit_logs (target_type, target_id);

alter table public.profiles enable row level security;
alter table public.roles enable row level security;
alter table public.audit_logs enable row level security;

grant select on public.profiles to authenticated;
grant insert (user_id, display_name, avatar_url, locale, timezone) on public.profiles to authenticated;
grant update (display_name, avatar_url, locale, timezone) on public.profiles to authenticated;
grant select on public.roles to authenticated;

create policy "Users can view their own profile"
  on public.profiles
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users can create their own profile"
  on public.profiles
  for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

create policy "Users can update their own profile"
  on public.profiles
  for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Users can view their own role"
  on public.roles
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

create function private.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

revoke all on function private.set_updated_at() from public;

create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function private.set_updated_at();

create function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (user_id, display_name, avatar_url)
  values (
    new.id,
    nullif(coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'), ''),
    nullif(new.raw_user_meta_data ->> 'avatar_url', '')
  )
  on conflict (user_id) do nothing;

  insert into public.roles (user_id, role)
  values (new.id, 'user')
  on conflict (user_id) do nothing;

  return new;
end;
$$;

revoke all on function private.handle_new_user() from public;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function private.handle_new_user();

create function private.purge_anonymized_audit_logs()
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  deleted_count integer;
begin
  delete from public.audit_logs
  where anonymized_at is not null
    and anonymized_at <= now() - interval '12 months';
  get diagnostics deleted_count = row_count;
  return deleted_count;
end;
$$;

revoke all on function private.purge_anonymized_audit_logs() from public;

create table public.auth_rate_limits (
  action text not null,
  key_hash text not null,
  window_started_at timestamptz not null default now(),
  attempt_count integer not null default 0,
  updated_at timestamptz not null default now(),
  primary key (action, key_hash),
  constraint auth_rate_limits_action check (action in ('login', 'recovery')),
  constraint auth_rate_limits_attempt_count check (attempt_count >= 0)
);

create index auth_rate_limits_updated_at_idx on public.auth_rate_limits (updated_at);

alter table public.auth_rate_limits enable row level security;
revoke all on public.auth_rate_limits from public;
revoke all on public.auth_rate_limits from anon, authenticated;

create function private.consume_auth_rate_limit(
  p_action text,
  p_key_hash text,
  p_limit integer,
  p_window_seconds integer,
  p_record_failure boolean default false
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_record public.auth_rate_limits%rowtype;
  next_count integer;
  retry_after integer;
begin
  if p_action not in ('login', 'recovery')
    or p_key_hash is null
    or char_length(p_key_hash) <> 64
    or p_limit <= 0
    or p_window_seconds <= 0 then
    raise exception 'Invalid authentication rate-limit arguments';
  end if;

  delete from public.auth_rate_limits
  where updated_at <= now() - interval '24 hours';

  select *
  into current_record
  from public.auth_rate_limits
  where action = p_action
    and key_hash = p_key_hash
  for update;

  if not found or current_record.window_started_at <= now() - make_interval(secs => p_window_seconds) then
    if p_record_failure then
      insert into public.auth_rate_limits (action, key_hash, window_started_at, attempt_count, updated_at)
      values (p_action, p_key_hash, now(), 1, now())
      on conflict (action, key_hash) do update
      set window_started_at = case
            when public.auth_rate_limits.window_started_at <= now() - make_interval(secs => p_window_seconds)
              then excluded.window_started_at
            else public.auth_rate_limits.window_started_at
          end,
          attempt_count = case
            when public.auth_rate_limits.window_started_at <= now() - make_interval(secs => p_window_seconds)
              then excluded.attempt_count
            else public.auth_rate_limits.attempt_count + 1
          end,
          updated_at = excluded.updated_at;
      select attempt_count
      into next_count
      from public.auth_rate_limits
      where action = p_action
        and key_hash = p_key_hash;
    else
      next_count := 0;
    end if;
    return jsonb_build_object('allowed', true, 'remaining', greatest(p_limit - next_count, 0));
  end if;

  if current_record.attempt_count >= p_limit then
    retry_after := greatest(
      0,
      ceil(extract(epoch from (current_record.window_started_at + make_interval(secs => p_window_seconds) - now())))::integer
    );
    return jsonb_build_object('allowed', false, 'remaining', 0, 'retry_after_seconds', retry_after);
  end if;

  next_count := current_record.attempt_count;
  if p_record_failure then
    next_count := current_record.attempt_count + 1;
    update public.auth_rate_limits
    set attempt_count = next_count,
        updated_at = now()
    where action = p_action
      and key_hash = p_key_hash;
  end if;

  return jsonb_build_object('allowed', true, 'remaining', greatest(p_limit - next_count, 0));
end;
$$;

revoke all on function private.consume_auth_rate_limit(text, text, integer, integer, boolean) from public;
grant usage on schema private to service_role;
grant execute on function private.consume_auth_rate_limit(text, text, integer, integer, boolean) to service_role;

create function public.consume_auth_rate_limit(
  p_action text,
  p_key_hash text,
  p_limit integer,
  p_window_seconds integer,
  p_record_failure boolean default false
)
returns jsonb
language sql
security invoker
set search_path = ''
as $$
  select private.consume_auth_rate_limit($1, $2, $3, $4, $5);
$$;

revoke all on function public.consume_auth_rate_limit(text, text, integer, integer, boolean) from public;
grant execute on function public.consume_auth_rate_limit(text, text, integer, integer, boolean) to service_role;
