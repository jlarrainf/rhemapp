alter table public.profiles
  add column theme_preference text not null default 'system';

alter table public.profiles
  add constraint profiles_theme_preference_check
  check (theme_preference in ('system', 'light', 'dark'));

grant select on public.profiles to authenticated;
grant update (theme_preference) on public.profiles to authenticated;
