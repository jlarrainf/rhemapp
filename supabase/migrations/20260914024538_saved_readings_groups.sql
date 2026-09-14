create table public.saved_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  content_type text not null,
  canonical_key text not null,
  title text not null,
  reference text not null,
  snapshot_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint saved_items_content_type check (content_type in ('liturgical-reading', 'random-verse', 'bible-passage')),
  constraint saved_items_canonical_key_length check (char_length(btrim(canonical_key)) between 1 and 500),
  constraint saved_items_title_length check (char_length(btrim(title)) between 1 and 500),
  constraint saved_items_reference_length check (char_length(btrim(reference)) between 1 and 300),
  constraint saved_items_snapshot_object check (jsonb_typeof(snapshot_json) = 'object'),
  constraint saved_items_unique_identity unique (user_id, content_type, canonical_key)
);

create table public.reading_groups (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  normalized_name text not null,
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint reading_groups_name_length check (char_length(btrim(name)) between 1 and 120),
  constraint reading_groups_normalized_name_length check (char_length(btrim(normalized_name)) between 1 and 120),
  constraint reading_groups_unique_name unique (user_id, normalized_name)
);

create unique index reading_groups_one_default_per_user_idx
  on public.reading_groups (user_id)
  where is_default;

create table public.saved_item_groups (
  saved_item_id uuid not null references public.saved_items (id) on delete cascade,
  group_id uuid not null references public.reading_groups (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (saved_item_id, group_id)
);

create index saved_items_user_created_idx
  on public.saved_items (user_id, created_at desc);

create index reading_groups_user_created_idx
  on public.reading_groups (user_id, created_at asc);

create index saved_item_groups_group_idx
  on public.saved_item_groups (group_id, created_at desc);

create function private.saved_readings_assign_default_group()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.saved_item_groups (saved_item_id, group_id)
  select new.id, groups.id
  from public.reading_groups as groups
  where groups.user_id = new.user_id
    and groups.is_default = true
  on conflict (saved_item_id, group_id) do nothing;
  return new;
end;
$$;

revoke all on function private.saved_readings_assign_default_group() from public;

create trigger saved_items_assign_default_group
after insert on public.saved_items
for each row execute function private.saved_readings_assign_default_group();

create function private.saved_readings_set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

revoke all on function private.saved_readings_set_updated_at() from public;

create trigger saved_items_set_updated_at
before update on public.saved_items
for each row execute function private.saved_readings_set_updated_at();

create trigger reading_groups_set_updated_at
before update on public.reading_groups
for each row execute function private.saved_readings_set_updated_at();

create function private.protect_default_reading_group()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if tg_op = 'DELETE' then
    if old.is_default then
      raise exception 'The default reading group cannot be deleted or demoted';
    end if;
    return old;
  end if;

  if old.is_default and new.is_default is distinct from true then
    raise exception 'The default reading group cannot be deleted or demoted';
  end if;
  return new;
end;
$$;

revoke all on function private.protect_default_reading_group() from public;

create trigger protect_default_reading_group
before update or delete on public.reading_groups
for each row execute function private.protect_default_reading_group();

create function private.saved_readings_handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.reading_groups (user_id, name, normalized_name, is_default)
  values (new.id, 'Mis lecturas', 'mis lecturas', true)
  on conflict (user_id, normalized_name) do nothing;
  return new;
end;
$$;

revoke all on function private.saved_readings_handle_new_user() from public;

insert into public.reading_groups (user_id, name, normalized_name, is_default)
select users.id, 'Mis lecturas', 'mis lecturas', true
from auth.users as users
on conflict (user_id, normalized_name) do nothing;

create trigger on_auth_user_created_saved_readings
after insert on auth.users
for each row execute function private.saved_readings_handle_new_user();
