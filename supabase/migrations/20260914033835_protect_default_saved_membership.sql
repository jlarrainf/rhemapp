create function private.protect_default_saved_item_membership()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if pg_trigger_depth() > 1 then
    return old;
  end if;

  if exists (
    select 1
    from public.reading_groups as groups
    where groups.id = old.group_id
      and groups.is_default = true
  ) then
    raise exception 'The default reading group membership cannot be removed';
  end if;
  return old;
end;
$$;

revoke all on function private.protect_default_saved_item_membership() from public;

create trigger protect_default_saved_item_membership
before delete on public.saved_item_groups
for each row execute function private.protect_default_saved_item_membership();
