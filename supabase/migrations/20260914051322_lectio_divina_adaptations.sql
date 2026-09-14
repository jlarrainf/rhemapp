create table public.lectio_adaptations (
  id uuid primary key default gen_random_uuid(),
  reading_key text not null,
  prompt_version text not null,
  schema_version text not null,
  guide_version text not null,
  anchors_json jsonb not null default '[]'::jsonb,
  questions_json jsonb not null default '[]'::jsonb,
  state text not null default 'pending',
  generated boolean not null default false,
  validation_json jsonb not null default '{}'::jsonb,
  rejection_reasons jsonb not null default '[]'::jsonb,
  metrics_json jsonb not null default '{}'::jsonb,
  attempt_count integer not null default 0,
  last_error_code text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  published_at timestamptz,
  constraint lectio_adaptations_key_format check (reading_key ~ '^chile:[0-9]{4}-[0-9]{2}-[0-9]{2}$'),
  constraint lectio_adaptations_versions_not_blank check (
    char_length(btrim(prompt_version)) between 1 and 40
    and char_length(btrim(schema_version)) between 1 and 40
    and char_length(btrim(guide_version)) between 1 and 40
  ),
  constraint lectio_adaptations_payload_arrays check (
    jsonb_typeof(anchors_json) = 'array'
    and jsonb_typeof(questions_json) = 'array'
    and jsonb_typeof(rejection_reasons) = 'array'
    and jsonb_typeof(metrics_json) = 'object'
    and jsonb_typeof(validation_json) = 'object'
  ),
  constraint lectio_adaptations_state check (state in ('pending', 'published', 'fallback')),
  constraint lectio_adaptations_attempt_count check (attempt_count between 0 and 3)
);

create unique index lectio_adaptations_reading_prompt_idx
  on public.lectio_adaptations (reading_key, prompt_version);

create index lectio_adaptations_state_updated_idx
  on public.lectio_adaptations (state, updated_at desc);

create table public.ai_generation_logs (
  id uuid primary key default gen_random_uuid(),
  adaptation_id uuid references public.lectio_adaptations (id) on delete set null,
  reading_key text not null,
  prompt_version text not null,
  schema_version text not null,
  guide_version text not null,
  anchor_ids jsonb not null default '[]'::jsonb,
  attempt integer not null,
  provider text not null,
  model text,
  status text not null,
  error_code text,
  rejection_reasons jsonb not null default '[]'::jsonb,
  metrics_json jsonb not null default '{}'::jsonb,
  latency_ms integer,
  input_tokens integer,
  output_tokens integer,
  total_tokens integer,
  estimated_cost_usd numeric(12, 6) not null default 0,
  created_at timestamptz not null default now(),
  constraint ai_generation_logs_key_format check (reading_key ~ '^chile:[0-9]{4}-[0-9]{2}-[0-9]{2}$'),
  constraint ai_generation_logs_attempt check (attempt between 0 and 3),
  constraint ai_generation_logs_status check (status in ('disabled', 'provider_error', 'validation_rejected', 'published', 'fallback')),
  constraint ai_generation_logs_reasons_array check (jsonb_typeof(rejection_reasons) = 'array'),
  constraint ai_generation_logs_anchor_ids_array check (jsonb_typeof(anchor_ids) = 'array'),
  constraint ai_generation_logs_metrics_object check (jsonb_typeof(metrics_json) = 'object'),
  constraint ai_generation_logs_non_negative_metrics check (
    (latency_ms is null or latency_ms >= 0)
    and (input_tokens is null or input_tokens >= 0)
    and (output_tokens is null or output_tokens >= 0)
    and (total_tokens is null or total_tokens >= 0)
    and estimated_cost_usd >= 0
  )
);

create index ai_generation_logs_reading_created_idx
  on public.ai_generation_logs (reading_key, created_at desc);

create index ai_generation_logs_adaptation_created_idx
  on public.ai_generation_logs (adaptation_id, created_at desc);

alter table public.lectio_adaptations enable row level security;
alter table public.ai_generation_logs enable row level security;

revoke all on table public.lectio_adaptations from public, anon, authenticated;
revoke all on table public.ai_generation_logs from public, anon, authenticated;

grant select, insert, update, delete on table public.lectio_adaptations to service_role;
grant select, insert, update, delete on table public.ai_generation_logs to service_role;

create trigger lectio_adaptations_set_updated_at
before update on public.lectio_adaptations
for each row execute function private.set_updated_at();
