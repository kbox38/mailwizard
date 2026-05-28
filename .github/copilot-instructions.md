## Quick agent guide — Email Wizard (practical, repository-specific)

This file highlights the minimal, high-value knowledge an AI code agent needs to be productive in this repo.

1. Big-picture architecture

- Frontend: React + TypeScript + Vite in `src/` (entry: `src/main.tsx`, routes in `src/App.tsx`). Styling with Tailwind (`tailwind.config.js`).
- Backend: Node/Express TypeScript in `backend/src/` (server: `backend/src/server.ts`). Background jobs use BullMQ + Redis (`backend/queues/*`).
- Database & auth: Supabase (Postgres + RLS). DB migrations in `supabase/migrations/`.
- Edge Functions: Supabase Edge functions in `supabase/functions/` (Deno runtime). Examples: `send-email`, `sendgrid-webhook`, `stripe-checkout`, `stripe-webhook`.

2. Critical developer workflows & commands

- Frontend development: run from repo root: `npm install` then `npm run dev` (Vite on :5173). `npm run build` produces `dist` for Netlify.
- Backend development: `cd backend && npm install && npm run dev` — uses `tsx watch src/server.ts` for fast iteration. Build with `npm run build` (tsc) and run with `npm start`.
- Type checking: `npm run typecheck` (root) for the frontend TS config. Backend relies on `tsc` via `backend/npm run build`.
- Supabase Edge Functions: these are Deno-based. Use the Supabase CLI to run locally (`supabase functions serve`) and ensure the function expects `Authorization: Bearer <supabase_user_token>` for user-scoped actions.

3. Project-specific conventions and patterns

- Environment variables: frontend uses `VITE_` prefix (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` in `src/lib/supabase.ts`) — agents must not rename these.
- Backend/server vs Edge Functions: backend APIs live under `backend/src/routes/*` and are started by express in `backend/src/server.ts`. Edge functions in `supabase/functions/*` interact directly with Supabase and the DB (they use the service role key). Do not conflate the two when changing auth flows.
- Rate-limiting & RPC: Supabase RPCs are used (example: `check_rate_limit`, `increment_usage`). When editing functions that touch quotas, preserve RPC calls and their parameter shapes.
- Email sending pattern: `supabase/functions/send-email/index.ts` demonstrates batching (batchSize 1000), personalization with `{{tag}}` replacement, retry/backoff (maxRetries=3), and a helper to generate a verified sender email. Keep the batching and retry logic if modifying send behavior.
- Telemetry & DB updates: after sending a batch the function inserts into `email_events` and `campaign_recipients`, then updates `campaigns` and calls `increment_usage` RPC — preserve this sequence.

4. Integration points to be careful with

- SendGrid: functions call `https://api.sendgrid.com/v3/mail/send` and expect `SENDGRID_API_KEY` in environment.
- Stripe: checkout/webhook functions reference Stripe keys — prefer to respect existing env names and webhook semantics.
- Redis + BullMQ: backend worker started from `backend/src/server.ts` via `startEmailWorker()` — shutting down workers must close Redis connections cleanly (see graceful SIGTERM handling).
- Supabase service role key: Edge functions that read/write sensitive tables use `SUPABASE_SERVICE_ROLE_KEY` — do not commit or expose this key.

5. Where to look for examples

- Frontend auth and route protection: `src/contexts/AuthContext.tsx`, `src/contexts/AdminAuthContext.tsx`, and `src/App.tsx` (uses `ProtectedRoute` patterns).
- Email function example: `supabase/functions/send-email/index.ts` (rate limiting, batching, retries, personalization, verified sender helper).
- Backend routes and admin processors: `backend/src/routes/*`, `backend/queues/*`, `backend/src/server.ts` (health check, CORS origin from `process.env.FRONTEND_URL`).
- Migrations and DB shape: `supabase/migrations/*.sql`.

6. Editing rules for agents (do this, not that)

- Do: Update both client and server code when changing API shapes. Example: changing a campaign property requires updating `src/pages/app/Campaigns` UI + `backend/src/routes/campaigns` or the relevant Edge Function.
- Do: Preserve environment variable names. Frontend must keep `VITE_` prefixed vars.
- Don't: Replace direct DB RPC invocations with ad-hoc queries without checking existing RPCs (e.g., `check_rate_limit`, `increment_usage`). Keep the RPC call semantics.
- Don't: Modify SendGrid reply-to behavior without validating `verifiedSenderEmail` logic in `supabase/functions/send-email/index.ts` — replies must go to the user's email while `from` uses a verified domain.

7. Quick testing checklist for PRs that change runtime logic

- Run frontend dev: `npm run dev` from repo root and sanity-check pages / login flows.
- Run backend dev: `cd backend && npm run dev` and call `/health` to confirm Redis / worker status.
- For Edge Functions, run locally with Supabase CLI or deploy to a staging project and test via HTTP with the same Authorization header and required env vars.

If anything here is unclear or you want me to expand a section (e.g., local Supabase function dev, exact RPC signatures in SQL, or backend CI details), tell me which area and I will iterate.
