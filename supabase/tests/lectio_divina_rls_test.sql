begin;

select plan(16);

select ok(
  (select relrowsecurity from pg_class where oid = 'public.lectio_adaptations'::regclass),
  'lectio_adaptations has RLS enabled'
);
select ok(
  (select relrowsecurity from pg_class where oid = 'public.ai_generation_logs'::regclass),
  'ai_generation_logs has RLS enabled'
);
select ok(
  not has_table_privilege('anon', 'public.lectio_adaptations', 'select,insert,update,delete'),
  'anon cannot access lectio adaptations'
);
select ok(
  not has_table_privilege('authenticated', 'public.lectio_adaptations', 'select,insert,update,delete'),
  'authenticated cannot access lectio adaptations'
);
select ok(
  not has_table_privilege('anon', 'public.ai_generation_logs', 'select,insert,update,delete'),
  'anon cannot access generation logs'
);
select ok(
  not has_table_privilege('authenticated', 'public.ai_generation_logs', 'select,insert,update,delete'),
  'authenticated cannot access generation logs'
);
select ok(
  has_table_privilege('service_role', 'public.lectio_adaptations', 'select,insert,update,delete'),
  'service_role can manage lectio adaptations'
);
select ok(
  has_table_privilege('service_role', 'public.ai_generation_logs', 'select,insert,update,delete'),
  'service_role can manage generation logs'
);
select ok(
  exists (select 1 from pg_indexes where indexname = 'lectio_adaptations_reading_prompt_idx'),
  'there is at most one adaptation per reading and prompt version'
);
select ok(
  exists (select 1 from pg_indexes where indexname = 'ai_generation_logs_reading_created_idx'),
  'generation logs can be queried by reading and time'
);
select ok(
  exists (select 1 from pg_constraint where conname = 'lectio_adaptations_key_format'),
  'adaptation keys are restricted to Chile ISO dates'
);
select ok(
  exists (select 1 from pg_constraint where conname = 'lectio_adaptations_attempt_count'),
  'adaptation attempts are capped at three'
);
select ok(
  exists (select 1 from pg_constraint where conname = 'ai_generation_logs_status'),
  'generation outcomes are explicit'
);
select ok(
  exists (select 1 from pg_trigger where tgname = 'lectio_adaptations_set_updated_at'),
  'adaptation updates keep their timestamp'
);
select ok(
  not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename in ('lectio_adaptations', 'ai_generation_logs')
  ),
  'client roles have no policies that could expose technical data'
);
select ok(
  exists (select 1 from pg_constraint where conname = 'ai_generation_logs_non_negative_metrics'),
  'technical metrics cannot be negative'
);

select * from finish();

rollback;
