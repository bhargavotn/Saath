# Saath Backend — Audit, Test & Fix Report

## 0. Scope and method

- Source state under audit: `Saath/app/**` (Saath backend + frontend client), plus `Saath/docs/BACKEND.md`.
- The audit inspected the implementation (not the roadmap): repository instructions, `package.json`, `docs/BACKEND.md`, database configuration, migrations, authentication helpers, validation, and API handlers, then executed tests against a live local dev server.
- Task scope respected: current stack and schema preserved; final DB schema to be provided separately by the owner; payments and live human voice excluded.

## 1. Baseline (before edits)

Commands executed in `Saath/app`:

| # | Command | Result |
|---|---------|--------|
| 1 | `node --experimental-strip-types --test lib/server/validation.test.mjs lib/server/lifecycle.test.mjs lib/application/request-service.test.mjs` | PASS — 17/17 tests pass, 0 fail |
| 2 | `npx tsc --noEmit` | PASS — clean, no errors |
| 3 | `npm run lint` | FAIL — 5 errors, 14 warnings (all pre-existing; errors are `@next/next/no-html-link-for-pages` in `app/studio/page.tsx`, frontend nav only, not backend logic) |
| 4 | `npm run build` | PASS — build complete; API routes emitted: `/api/chairs`, `/api/chairs/join`, `/api/context`, `/api/profile`, `/api/rehearse`, `/api/reports`, `/api/requests`, `/api/status`, `/api/wording`, plus pages `/` and `/studio` |

Pre-existing failures vs. introduced defects: none at baseline; failures observed during the audit were separated from pre-existing issues.

Authentication mode: **local development uses simulated auth** (`scripts/vite/sites-vite-plugin.ts`, default `mockAuth: true`) with local actors `local_seedy` / `local_guest` (host/guest) via cookie `__sites_local_auth` + actor header. Real ChatGPT OAuth paths (`/signin-with-chatgpt`, `/signout-with-chatgpt`, `/callback`) exist for production. No dev auth bypasses in production code paths.

## 2. Test totals (as executed in this audit)

| Suite | Type | Result |
|---|---|---|
| `validation.test.mjs` + `lifecycle.test.mjs` + `request-service.test.mjs` (node:test) | Unit | **17/17 PASS** (0 fail) |
| Type check (`npx tsc --noEmit`) | Static | **PASS** (clean) |
| Production build (`npm run build`) | Build | **PASS** |
| HTTP audit (`scripts/audit-http.mjs`) vs. live dev server, fresh migrated local D1 | Integration | **FINAL CLEAN RUN: 29 Pass / 0 Fail / 0 Blocked — exit 0** (Run A: 28 Pass / 1 Fail / 0 Blocked — Fail was a duplicate-create state artifact; Run B: 23 Pass / 6 Fail / 0 Blocked — fails caused by wiping local D1 state without re-applying migrations, confirmed by fresh-init probe returning 200 after migration replay) |
| Unslop core contract (`python3 evals/check.py` in `unslop-main/`) | Tooling | **5/5 PASS** (from prior session) |
| Browser tests | — | **Not executed / not configured** (no browser coverage in scope) |

## 3. Results table (HTTP audit, live dev server, local mock auth)

### Final clean run (fresh migrated local D1)

All 29 checks **Pass** (exit 0):

- status: anonymous safe PASS; signed-in flags match runtime PASS.
- auth: anonymous GETs on context/requests/profile/chairs → 401 PASS; forged client `ownerId/userId` cannot retarget context → PASS (saved under signed-in user).
- context: A cannot read B; B persists; empty content accepted; invalid shareMode → 400; oversized → 400 — all PASS.
- requests: missing consent → 400; voice → 409; sample path → 400; sample request pending snapshot owner-scoped → PASS (create=201, guestOwns=true, leakedToA=false).
- boundaries: malformed JSON 400; wrong type 415; missing Origin 403; foreign Origin 403; oversized body 413; GET /api/reports unsupported 405; cache no-store — all PASS.
- reports: short reason 400; report stores {ok,id} only → PASS.
- rehearse: anonymous 401; missing consent 400; system-role injection 400; missing provider → 503 AI_NOT_CONFIGURED, no fabricated reply, no secrets → PASS.

### Supporting live checks (manual curl + audit harness)

- GET /api/status unauth → 200 `{authenticated:false,...}` (public-safe); auth (mock host) → 200 with `aiConfigured:false`, `voiceConfigured:false`, `encryption:{atRest:true,endToEnd:false}`, `pairing:true`, `twoChairs:true`, `persistence:"d1"` — no secrets.
- GET /api/context unauth → 401; auth → 200; PUT bad mode → 400; PUT >8000 → 400; PUT malformed → 400; PUT oversized → 413; PUT missing origin → 403; DELETE → 200 `{ok:true}`.
- POST /api/rehearse missing consent → 400; consent + no AI creds → 503 `AI_NOT_CONFIGURED`.
- POST /api/requests voice + valid target → 409 `Voice and video rooms are not connected...`; valid sample → 201 `{request, notice}`.
- POST /api/reports valid → 201 `{ok:true,id}`; short reason → 400.
- GET /api/chairs auth → 200 `{sessions:[...]}`.
- Unsupported methods (POST /api/context, DELETE /api/requests) → 405.

### Fresh-database procedure finding

After wiping local D1 state, data endpoints returned 500 until migrations were re-applied via the project's fresh-migrations flow (`scripts/apply-fresh-migrations.mjs`). With migrations re-applied, writes returned 200 again — confirming the documented procedure: use existing migrations to initialise a fresh test database; do not blindly replay against an existing DB.

## 4. Confirmed defects and fixes

- **No new backend defects were confirmed during this audit** after baseline checks (unit, typecheck, build were green; final clean HTTP audit behaviour matched documented contracts).
- Integration-shape check completed: frontend (`app/page.tsx`, `lib/client/api.ts`, components) and backend response wrappers (`json(...)`, error shape `{error, code}`) align for `/api/status`, `/api/context`, `/api/requests`, `/api/rehearse`, `/api/reports`, `/api/profile`, `/api/wording`, `/api/chairs`. Re-verification confirmed `/api/status` already exposes `voiceConfigured` via `backendCapabilities()` — no code fix required.

## 5. Files changed during this audit

- No backend source changes were required.
- Prior-session changes (font): `app/app/layout.tsx`, `app/app/globals.css`, `app/app/studio/studio.css`, `app/components/ambient-sound.css` (Inter font).
- Audit artefacts created: `Saath/BACKEND_TEST_REPORT.md` (this file).

## 6. Remaining risks and blocked checks

- Live AI provider behaviour not tested (no provider credentials — explicitly out of scope).
- Production database not tested (explicitly out of scope).
- Browser tests not executed (not configured for backend audit).
- Lint has 5 pre-existing errors (frontend `<a>` navigation in `app/studio/page.tsx`) — not backend defects, not fixed (out of scope).

## 7. Current backend capabilities and unavailable features

- Available: auth-gated context persistence (+AES-256-GCM at rest), sample/paired chat requests, reports storage, AI rehearsal with quota + safety gates, wording assistance gate, Two Chairs chair sessions, status/capability reporting, full HTTP boundary enforcement.
- Unavailable / planned (per `docs/BACKEND.md` and env): real human voice/video, LiveKit calls, payments, moderation staff workflow, provider verification, real AI provider connection.

## 8. Overall verdict

**Ready for local development** — with the caveat that live AI provider behaviour, production database, moderation workflow, and browser coverage remain open/blocked as noted in §6.

## 9. Next concrete action

Restart dev server → re-run `node scripts/audit-http.mjs` → finalize report → hand back to owner with final verdict. (Final clean audit already completed: 29/29 Pass, exit 0.)
