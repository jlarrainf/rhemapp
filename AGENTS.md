# AGENTS.md — Rhemapp

## Project context

Rhemapp is a Christian/Catholic reading app built with Next.js App Router, React, Tailwind CSS, and deployed to Vercel.

Current baseline:

- JavaScript and JSX are used instead of TypeScript.
- The application uses the `src/` directory and the `@/*` alias maps to `src/*`.
- Public liturgical data currently lives in `public/data/daily-readings/*.json`.
- The daily calendar is Chilean and uses `America/Santiago` as its canonical timezone.
- `/api/passage` uses API.Bible and must keep its API key server-side whenever possible.
- Existing daily data is traceable to its source and must not be replaced with invented or unverified content.

This file is the default operating contract for agents working in this repository. More specific `AGENTS.md` files, if added later, override this file for their directory.

## Language policy

- Write code, identifiers, filenames, database fields, API fields, comments, tests, commit messages, and pull-request text in English.
- Write every user-facing string in Spanish, including navigation labels, empty states, validation messages, errors, loading states, notifications, email copy, metadata visible in the product, and `aria-label` values.
- Product specifications and planning prose may be written in Spanish so the owner can review intent precisely. Keep technical identifiers, API names, table names, and code examples in English.
- Use correct Spanish spelling, accents, punctuation, and Chile-appropriate wording. Do not use English fallback text in the interface.
- Keep biblical quotations and source-provided liturgical titles faithful to the selected source. Do not silently translate or paraphrase canonical reading text.
- When a technical term is shown to users, prefer a clear Spanish label and keep the technical term in code only.

## Product and content principles

- Treat the liturgical calendar and biblical references as content with pastoral and editorial consequences, not as arbitrary UI data.
- Never invent a reading, citation, celebration, source, or Church teaching to fill a missing field.
- Preserve source provenance for every published reading: provider, source URL, verification state, and fetch/review metadata when available.
- Any change to a reading must be reproducible, reviewable, and validated before publication.
- The default calendar remains Chilean unless the product requirements explicitly introduce another calendar. Do not infer the calendar from the browser locale.
- Use ISO calendar dates (`YYYY-MM-DD`) for domain values. Do not pass date-only values through `new Date("YYYY-MM-DD")` when a timezone conversion could shift the displayed day.
- Keep the canonical calendar timezone centralized. Reuse the existing `DAILY_TIME_ZONE` and date helpers instead of duplicating timezone logic.

## Engineering rules

- Read the relevant existing files and inspect `git status` before editing.
- Preserve unrelated user changes. Do not reset, checkout, or overwrite work that is not part of the requested change.
- Use `apply_patch` for hand-authored file edits. Do not use shell redirection, `cat`, or ad-hoc scripts to write source files.
- Prefer the existing Next.js App Router patterns: server components for data fetching and metadata; client components only for interaction, browser APIs, and local UI state.
- Keep route handlers thin. Put reusable domain logic in `src/lib/` or a clearly named domain module, and keep data validation at API boundaries.
- Do not add a dependency when the platform or existing code can provide the behavior. If a dependency is necessary, explain why and verify its maintenance, bundle impact, and server/client compatibility.
- Do not expose secrets, service-role credentials, API keys, internal database identifiers, or private user data to the browser.
- Treat every client-provided value as untrusted. Validate identifiers, dates, enum values, pagination, payload size, and ownership on the server.
- Use stable, opaque public identifiers for share links. Never expose sequential private IDs or user IDs as the public sharing mechanism.
- Keep authentication and authorization checks on the server. UI hiding is not authorization.
- For user-owned records, enforce ownership in the data layer as well as in route handlers. Prefer deny-by-default policies when the selected persistence layer supports them.
- Make mutations idempotent where practical, especially saves, group membership changes, notification registration, and review actions.
- Return actionable Spanish errors to the UI while logging useful technical details server-side without secrets or sensitive content.

## Liturgical reading data contract

The long-term model must support one daily celebration with an ordered set of optional readings, rather than assuming that the Gospel is the only reading. New code should target a generic reading shape similar to:

```js
{
  date: "YYYY-MM-DD",
  calendar: "chile",
  liturgicalYear: "YYYY",
  celebration: "...",
  readings: [
    {
      type: "first-reading|psalm|second-reading|gospel",
      reference: "...",
      passageId: "...",
      ranges: [],
      title: "...",
      excerpt: "...",
      excerptReference: "...",
      source: { provider: "...", url: "...", verified: true }
    }
  ],
  source: { provider: "...", url: "...", verified: true }
}
```

The exact schema may evolve, but these invariants must hold:

- Reading order is explicit and deterministic.
- `second-reading` is optional and must not render as an empty placeholder when absent.
- The Gospel is one reading type, not the whole daily entry.
- References, passage IDs, ranges, and excerpts are validated before publication.
- Legacy `entry.gospel` data must be migrated deliberately and remain backward-compatible until all consumers are updated.
- Local validation scripts and source checks must continue to pass after data changes.

## Date and Sunday behavior

- “Today” means the current date in `America/Santiago`, not the device timezone.
- A selected date is an explicit state and must be represented as an ISO date in the URL/API. It must not be confused with the live “today” mode.
- The Sunday reading cutover is a domain rule. Centralize it in a tested resolver; do not implement it with scattered UI conditionals.
- The current requirement is a Saturday 15:00 cutover in `America/Santiago`. Test both sides of the boundary (`14:59:59` and `15:00:00`) and the behavior on Sunday.
- If the product interpretation of “Sunday reading” is ambiguous, document the chosen behavior in the feature specification before coding it.

## Authentication, privacy, and account data

When authentication is introduced:

- Support Google OAuth only after its redirect, account-linking, logout, error, and cancellation flows are specified. Add email/password only if it is an explicit product decision.
- Include secure session handling, CSRF/state protection where applicable, account deletion, and a clear privacy/terms path before collecting personal data.
- Store the minimum necessary profile data. Do not store Google access tokens unless a documented integration requires them.
- Separate public liturgical content from private user content in the data model and authorization policy.
- Saved readings, groups, notification preferences, Lectio responses, and submissions belong to a user unless explicitly marked public.
- Never log raw passwords, OAuth tokens, notification tokens, private notes, or full user-submitted content.

## Supabase-specific rules

When Supabase is part of an implementation:

- Verify the current Supabase documentation and changelog before adding or changing Auth, SSR, database, RLS, Storage, Functions, Cron, or client-library behavior.
- Use `@supabase/ssr` and cookie-based server/client helpers for Next.js SSR flows when the chosen integration requires them. Keep OAuth callbacks and redirect allowlists explicit per environment.
- Only a publishable client key may reach the browser. Never expose a `service_role` or secret key through a `NEXT_PUBLIC_` variable, client component, mobile bundle, log, or API response.
- Enable RLS on every table in an exposed schema, and write policies for the real ownership model. `TO authenticated` alone is not authorization; pair it with an ownership predicate such as `(select auth.uid()) = user_id`.
- Do not use editable `user_metadata` as an authorization source. Store roles in protected database data or trusted application metadata and audit role changes.
- UPDATE policies need a matching SELECT policy and both `USING` and `WITH CHECK` ownership conditions. Avoid `SECURITY DEFINER`; if genuinely required, keep it out of exposed schemas, check the caller, and document why.
- Treat views as a security boundary. Use security-invoker behavior where supported or keep sensitive views out of exposed schemas.
- Deleting a Supabase user does not automatically invalidate already issued access tokens. Revoke/sign out sessions or enforce an equivalent short-lived-session policy before claiming strict deletion guarantees.
- Pin Supabase package versions and commit lockfile changes. Do not create migration filenames by hand; use the supported Supabase migration workflow when implementation begins.
- A native client must use the same authorized API/contracts as the web client and must never connect with privileged database credentials.

## Sharing rules

- Sharing a reading creates an intentional public representation and must not accidentally expose private groups, notes, account details, or internal moderation data.
- Public share pages need a stable canonical URL, server-rendered metadata where useful, a clear source attribution, and a revocation strategy.
- Validate that shared content still exists and define the behavior for deleted, unpublished, or replaced readings.
- Add abuse protection and reasonable rate limits before exposing a public share endpoint.

## Suggestions and editorial workflow

- User suggestions are untrusted submissions, never direct writes to the published calendar.
- Use explicit states such as `pending`, `in_review`, `approved`, `rejected`, and `needs_changes` (the final enum must be documented in the schema).
- Require an authenticated editor/admin role for review and publication. Record who changed a suggestion and when.
- Keep an audit trail for changes to readings and moderation decisions.
- Validate references and source URLs server-side; reject malformed or unsupported book/range values.
- Avoid accepting file uploads until storage, malware scanning, size limits, and retention are designed.

## AI and Lectio divina guardrails

AI-generated Lectio content is an assistive reflection feature, not an authoritative source of doctrine.

- Ground generation in the selected, verified reading and a versioned application instruction set.
- Use a strict structured output schema. Reject, repair, or fall back to curated questions when output is malformed, off-topic, sensational, or doctrinally unsupported.
- Version every generation prompt together with explicit reading-anchor rules and positive/negative examples. A positive example must show how a question points to a concrete theme, action, person, image, contrast, or tension in the supplied reading; a negative example must show generic, repetitive, invented, or off-topic wording that must be rejected.
- Validate that each generated question contains a concrete anchor to the selected reading and is not a reusable generic question. Reject the whole adaptation when the anchor is missing, the questions repeat the same angle, or the answer cannot be traced to the supplied reading context.
- The internal guide must enforce the four stages observe, meditate, pray, and act; use only what is explicit in the verified reading; keep a sober, hopeful Catholic tone; avoid invented context, quotations, doctrine, moralizing, medical or psychological advice; and fall back when the reading does not support a specific question.
- Human review is required for the doctrinal guide, prompt, schema, examples, and validators before release. It is not required for every generated adaptation when the approved automatic validators and deterministic fallback are in force.
- The UI must identify generated content as assisted reflection and must not present it as official Church teaching or as pastoral, medical, or mental-health advice.
- Do not allow the model to invent citations, saints, magisterial documents, historical claims, or biblical context not present in approved inputs.
- Keep prompts, model configuration, schema versions, validation results, and failure reasons observable without storing unnecessary private responses.
- Establish token/cost limits, abuse protection, timeout behavior, and a deterministic fallback before enabling the feature.
- Do not send private user notes to an AI provider by default. Require an explicit product/privacy decision first.

## UI, accessibility, and mobile

- Preserve the existing visual language unless a redesign is explicitly requested: clean, calm, readable, responsive, and compatible with light/dark themes.
- Build mobile-first. Interactive targets should be comfortable on touch screens, and every control needs a visible focus state and an accessible name.
- Use semantic HTML, keyboard navigation, proper dialog focus management, `aria-live` only for meaningful status changes, and reduced-motion-friendly transitions.
- Keep loading, empty, error, offline, and permission-denied states explicit in Spanish.
- Do not make a native app depend on browser-only UI assumptions. Share domain/API contracts between web and phone clients rather than duplicating business rules.

## Testing and verification

At minimum, every feature should include the smallest relevant automated or repeatable checks:

- `npm run lint` for code changes.
- `npm run build` for routing, metadata, server/client boundary, and production configuration changes.
- `npm run validate:daily` for liturgical data changes.
- Unit tests for date/timezone resolvers, especially the Saturday 15:00 Sunday transition.
- API tests for invalid input, unauthorized access, ownership, idempotency, and useful error responses.
- UI checks for keyboard access, responsive layout, loading/error states, and Spanish copy.
- Manual verification of Google OAuth, public sharing, notification permission, and deep links whenever those integrations change.

Do not claim a feature is complete based only on a successful local render. Verify the relevant data path, authorization boundary, and failure path.

## Delivery workflow

1. State the scope and assumptions before making a non-trivial change.
2. Inspect existing conventions and identify affected routes, data contracts, and scripts.
3. Make the smallest coherent change; avoid unrelated refactors.
4. Run proportional checks and report what was and was not verified.
5. Include migration, rollback, environment-variable, and operational notes for stateful or external-service changes.
6. Keep user-facing release notes in Spanish; keep code and commit messages in English.

Suggested branch naming is `codex/<short-description>` unless the user requests another branch. Never perform destructive Git or data operations without explicit authorization and a verified target.

## Spec-anchored development workflow

Rhemapp follows a lightweight spec-anchored development process. The specification is a living statement of product intent: it is versioned next to the code, reviewed by a human, and updated whenever behavior changes. It is not a document written once and then abandoned, and it is not permission for an agent to invent unstated behavior.

### Source-of-truth hierarchy

Use these artifacts in this order:

1. `docs/constitution.md` — project-wide, non-negotiable principles. Change it only when a project-level principle truly changes.
2. `specs/NNN-feature/spec.md` — what the feature must do and why. It must contain actors, user stories, EARS-style functional requirements, non-functional requirements, edge cases, exclusions, completion criteria, and open questions.
3. `specs/NNN-feature/clarifications.md` — QA-style findings and the approved answers that remove ambiguity. Detection and resolution must be visible.
4. `specs/NNN-feature/plan.md` — how the approved behavior will fit the current architecture, including data model, modules, contracts, decisions, alternatives rejected, migrations, and test strategy.
5. `specs/NNN-feature/tasks.md` — the implementation backlog. Tasks are dependency-ordered, small, independently verifiable, linked to functional requirements, and include a `Hecho cuando:` line.
6. Code and tests — the implementation of the approved intent.
7. `specs/NNN-feature/validation.md` — final RF-by-RF evidence and verdict after implementation.

### Mandatory agent loop

- Before implementation, read `AGENTS.md`, `docs/constitution.md`, and the active spec artifacts.
- If the requested behavior is not specified or conflicts with the constitution, stop before coding and surface the ambiguity.
- During specification work, do not write application code. Ask clarification questions one at a time, up to six when an interview is needed.
- Clarification reviews detect ambiguities, contradictions, missing edge cases, and constitutional conflicts. Do not silently resolve them in the clarification artifact; record the decision explicitly after human review.
- Plans must cover every RF and must distinguish product intent from technical implementation. Do not use a plan to smuggle in unapproved scope.
- Generate tasks from the approved spec and plan. Prefer tasks that take roughly 20–30 minutes, with one coherent responsibility and a testable completion statement.
- During implementation, work on one task ID at a time. Write or update tests first when practical, run the relevant checks, update the task checkbox only after evidence, and stop at the requested task.
- Keep the active spec's `tasks.md` checklist synchronized with the actual work. When one or more tasks are fully completed and independently verified, mark exactly those completed task checkboxes and leave all incomplete, blocked, or future tasks unchecked. Do not mark a task merely because related code exists, and do not mark a range of tasks based on a single broad test.
- For every checked task, report the task ID, files changed, verification evidence, and any remaining limitations. If a task is partially complete, keep it unchecked and record the missing work or blocker instead.
- For every completed task, include a reproducible `Cómo probarlo` summary in the delivery message. If several tasks are completed together, identify each task ID and explain the corresponding checks separately or in an explicit grouped mapping. The summary must include prerequisites and non-secret environment configuration, exact commands with the expected result, manual steps or URLs when UI behavior is involved, relevant RF/task references, and anything that was not verified. For documentation-only tasks, describe the document checks instead. Never include secrets or claim a check passed without running it.
- When the evidence is durable and belongs to the feature, copy the same test instructions and results into the active spec's `validation.md`, keeping the evidence traceable to the task and RF. Keep the final delivery summary concise, but complete enough for another person to reproduce the verification.
- Validation must walk the functional requirements one by one, identify the test or manual evidence for each, report failures plainly, and give a final `SPEC CUMPLIDA` or `SPEC NO CUMPLIDA` verdict.
- When a new requirement or behavior change appears, update `spec.md` first, show the diff, then update clarifications, plan, and tasks as needed. Code changes come after those artifacts are approved.
- Keep one active feature spec in implementation at a time unless the user explicitly approves parallel work and the dependencies are clear.
- Never mark a spec or task complete because code exists. Completion requires the specified behavior, tests, and validation evidence.

### Prompt and artifact conventions

- Reuse the phase prompts in `specs/prompts.md` instead of improvising large implementation prompts.
- Every implementation request must name the exact spec and task, for example: “Implement only T3 from `specs/001-liturgical-readings/tasks.md`, following its `spec.md`, `plan.md`, and the constitution.”
- Every generated artifact must link back to the relevant RFs. Every test should make it possible to trace behavior back to at least one RF.
- Use unchecked task boxes for pending work. Only the implementing agent may check a task after running the required verification, and the human remains responsible for approving the result.
- Use `NEEDS CLARIFICATION` markers for unresolved decisions. Do not turn an assumption into an implementation without calling it out.
- A small feature can use one spec directory; a large feature can use sub-specs, but the parent index must state dependencies and the order.

## Definition of done

A change is done only when:

- It matches the requested behavior and documented assumptions.
- The implementation respects the language, content, privacy, and security rules above.
- Existing behavior and unrelated files are preserved.
- Relevant lint/build/data/API/UI checks pass, or failures are explicitly reported.
- New environment variables, migrations, roles, cron jobs, permissions, and rollback steps are documented.
- The user-facing result is understandable in Spanish and usable on both desktop and mobile layouts.
