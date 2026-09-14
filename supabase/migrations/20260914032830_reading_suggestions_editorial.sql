create type public.suggestion_status as enum (
  'pending',
  'in_review',
  'approved',
  'rejected',
  'needs_changes',
  'published'
);

create table public.reading_suggestions (
  id uuid primary key default gen_random_uuid(),
  author_user_id uuid references auth.users (id) on delete set null,
  date date not null,
  reading_type text not null,
  reference text not null,
  source_url text not null,
  body text not null,
  status public.suggestion_status not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  reviewed_at timestamptz,
  published_at timestamptz,
  constraint reading_suggestions_reading_type check (reading_type in ('first-reading', 'psalm', 'second-reading', 'gospel')),
  constraint reading_suggestions_reference_length check (char_length(btrim(reference)) between 1 and 300),
  constraint reading_suggestions_source_url_length check (char_length(btrim(source_url)) between 1 and 500),
  constraint reading_suggestions_source_url_protocol check (source_url ~* '^https?://'),
  constraint reading_suggestions_body_length check (char_length(btrim(body)) between 1 and 5000),
  constraint reading_suggestions_body_no_markup check (position('<' in body) = 0 and position('>' in body) = 0)
);

create unique index reading_suggestions_pending_identity_idx
  on public.reading_suggestions (author_user_id, date, reading_type, lower(btrim(reference)), lower(btrim(source_url)))
  where status in ('pending', 'in_review', 'approved');

create index reading_suggestions_author_created_idx
  on public.reading_suggestions (author_user_id, created_at desc);

create index reading_suggestions_status_created_idx
  on public.reading_suggestions (status, created_at asc);

create table public.suggestion_events (
  id uuid primary key default gen_random_uuid(),
  suggestion_id uuid references public.reading_suggestions (id) on delete set null,
  actor_user_id uuid references auth.users (id) on delete set null,
  from_status public.suggestion_status,
  to_status public.suggestion_status not null,
  comment text,
  created_at timestamptz not null default now(),
  retention_until timestamptz not null default (now() + interval '12 months'),
  anonymized_at timestamptz,
  constraint suggestion_events_comment_length check (comment is null or char_length(comment) <= 2000)
);

create index suggestion_events_suggestion_created_idx
  on public.suggestion_events (suggestion_id, created_at asc);

create index suggestion_events_retention_idx
  on public.suggestion_events (retention_until, anonymized_at);

create table public.published_reading_versions (
  id uuid primary key default gen_random_uuid(),
  reading_key text not null,
  payload_json jsonb not null,
  published_by uuid references auth.users (id) on delete set null,
  source_suggestion_id uuid references public.reading_suggestions (id) on delete set null,
  rollback_of uuid references public.published_reading_versions (id) on delete set null,
  created_at timestamptz not null default now(),
  superseded_at timestamptz,
  constraint published_reading_versions_key_format check (reading_key ~ '^chile:[0-9]{4}-[0-9]{2}-[0-9]{2}$'),
  constraint published_reading_versions_payload_object check (jsonb_typeof(payload_json) = 'object')
);

create unique index published_reading_versions_one_active_idx
  on public.published_reading_versions (reading_key)
  where superseded_at is null;

create index published_reading_versions_key_created_idx
  on public.published_reading_versions (reading_key, created_at desc);

alter table public.reading_suggestions enable row level security;
alter table public.suggestion_events enable row level security;
alter table public.published_reading_versions enable row level security;

revoke all on table public.reading_suggestions from anon, authenticated;
revoke all on table public.suggestion_events from anon, authenticated;
revoke all on table public.published_reading_versions from anon, authenticated;

grant select on table public.reading_suggestions to authenticated;
grant insert (author_user_id, date, reading_type, reference, source_url, body) on table public.reading_suggestions to authenticated;

grant select, insert, update, delete on table public.reading_suggestions to service_role;
grant select, insert, update, delete on table public.suggestion_events to service_role;
grant select, insert, update on table public.published_reading_versions to service_role;

create policy "Users can view their own reading suggestions"
  on public.reading_suggestions
  for select
  to authenticated
  using ((select auth.uid()) = author_user_id);

create policy "Users can create their own reading suggestions"
  on public.reading_suggestions
  for insert
  to authenticated
  with check (
    (select auth.uid()) = author_user_id
    and status = 'pending'
  );

create trigger reading_suggestions_set_updated_at
before update on public.reading_suggestions
for each row execute function private.set_updated_at();

create function private.purge_reading_suggestion_audit()
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  deleted_count integer;
begin
  update public.suggestion_events
  set actor_user_id = null,
      comment = null,
      anonymized_at = coalesce(anonymized_at, now())
  where anonymized_at is null
    and retention_until <= now()
    and (suggestion_id is null or exists (
      select 1
      from public.reading_suggestions as suggestions
      where suggestions.id = suggestion_events.suggestion_id
        and suggestions.status = 'rejected'
    ));

  update public.audit_logs
  set actor_user_id = null,
      metadata = jsonb_build_object('retained', 'anonymized'),
      anonymized_at = coalesce(anonymized_at, now())
  where target_type = 'reading_suggestion'
    and anonymized_at is null
    and created_at <= now() - interval '12 months';

  delete from public.reading_suggestions
  where status = 'rejected'
    and updated_at <= now() - interval '12 months';

  delete from public.suggestion_events
  where anonymized_at is not null
    and anonymized_at <= now() - interval '12 months';

  delete from public.audit_logs
  where target_type = 'reading_suggestion'
    and anonymized_at is not null
    and anonymized_at <= now() - interval '12 months';

  get diagnostics deleted_count = row_count;
  return deleted_count;
end;
$$;

revoke all on function private.purge_reading_suggestion_audit() from public;
grant usage on schema private to service_role;
grant execute on function private.purge_reading_suggestion_audit() to service_role;
