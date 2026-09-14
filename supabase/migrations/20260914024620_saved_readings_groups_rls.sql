alter table public.saved_items enable row level security;
alter table public.reading_groups enable row level security;
alter table public.saved_item_groups enable row level security;

revoke all on table public.saved_items from anon, authenticated;
revoke all on table public.reading_groups from anon, authenticated;
revoke all on table public.saved_item_groups from anon, authenticated;

grant select, insert, update, delete on table public.saved_items to authenticated;
grant select, insert, update, delete on table public.reading_groups to authenticated;
grant select, insert, delete on table public.saved_item_groups to authenticated;

create policy "Users can view their saved items"
  on public.saved_items
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users can create their saved items"
  on public.saved_items
  for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

create policy "Users can update their saved items"
  on public.saved_items
  for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Users can delete their saved items"
  on public.saved_items
  for delete
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users can view their reading groups"
  on public.reading_groups
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users can create their reading groups"
  on public.reading_groups
  for insert
  to authenticated
  with check ((select auth.uid()) = user_id and (is_default = false or name = 'Mis lecturas'));

create policy "Users can update their reading groups"
  on public.reading_groups
  for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Users can delete non-default reading groups"
  on public.reading_groups
  for delete
  to authenticated
  using ((select auth.uid()) = user_id and is_default = false);

create policy "Users can view their saved item groups"
  on public.saved_item_groups
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.saved_items as items
      where items.id = saved_item_id
        and items.user_id = (select auth.uid())
    )
    and exists (
      select 1
      from public.reading_groups as groups
      where groups.id = group_id
        and groups.user_id = (select auth.uid())
    )
  );

create policy "Users can create their saved item groups"
  on public.saved_item_groups
  for insert
  to authenticated
  with check (
    exists (
      select 1
      from public.saved_items as items
      where items.id = saved_item_id
        and items.user_id = (select auth.uid())
    )
    and exists (
      select 1
      from public.reading_groups as groups
      where groups.id = group_id
        and groups.user_id = (select auth.uid())
    )
  );

create policy "Users can delete their saved item groups"
  on public.saved_item_groups
  for delete
  to authenticated
  using (
    exists (
      select 1
      from public.saved_items as items
      where items.id = saved_item_id
        and items.user_id = (select auth.uid())
    )
    and exists (
      select 1
      from public.reading_groups as groups
      where groups.id = group_id
        and groups.user_id = (select auth.uid())
    )
  );
