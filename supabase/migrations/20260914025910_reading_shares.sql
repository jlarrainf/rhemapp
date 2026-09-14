create table public.shares (
  id uuid primary key default gen_random_uuid(),
  token_hash text not null unique,
  owner_user_id uuid not null references auth.users (id) on delete cascade,
  resource_type text not null,
  resource_id uuid not null,
  revoked_at timestamptz,
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  constraint shares_token_hash_format check (token_hash ~ '^[0-9a-f]{64}$'),
  constraint shares_resource_type check (resource_type in ('saved-reading')),
  constraint shares_not_expired_at_creation check (expires_at is null or expires_at > created_at)
);

create index shares_owner_created_idx
  on public.shares (owner_user_id, created_at desc);

create index shares_resource_idx
  on public.shares (resource_type, resource_id);

create index shares_active_token_idx
  on public.shares (token_hash)
  where revoked_at is null;

alter table public.shares enable row level security;

revoke all on table public.shares from anon, authenticated;
grant select on table public.shares to authenticated;
grant insert (token_hash, owner_user_id, resource_type, resource_id, expires_at) on table public.shares to authenticated;
grant update (revoked_at) on table public.shares to authenticated;
grant select on table public.shares to service_role;

create policy "Users can view their shares"
  on public.shares
  for select
  to authenticated
  using ((select auth.uid()) = owner_user_id);

create policy "Users can create shares for their saved readings"
  on public.shares
  for insert
  to authenticated
  with check (
    (select auth.uid()) = owner_user_id
    and resource_type = 'saved-reading'
    and exists (
      select 1
      from public.saved_items as items
      where items.id = resource_id
        and items.user_id = (select auth.uid())
    )
  );

create policy "Users can revoke their shares"
  on public.shares
  for update
  to authenticated
  using ((select auth.uid()) = owner_user_id)
  with check ((select auth.uid()) = owner_user_id);
