# Saath backend test report

## Source state

- Git commit: `740e17380a4fb4be64616467f6bfeeb4b0c1f4e1` (`Save the Saath foundation with named assets and a layered backend.`)
- Working tree: uncommitted enrollment, at-rest encryption, Two Chairs, and this audit’s targeted request-isolation fixes
- App root: `Saath/app`

## Environment

- Runtime: local Vinext / Vite 8 on `http://127.0.0.1:5173/`
- Auth: Sites local mock only. Cookie `__sites_local_auth=1` maps to synthetic user A `local_seedy` / `seedy@sites.test`. Header `x-saath-local-actor: guest` maps to synthetic user B `local_guest` / `guest@sites.test`. This plugin runs in `configureServer` and is not a production worker bypass. Hosted identity uses `oai-authenticated-user-*` headers from Sites.
- HTTP/browser database: existing local Miniflare D1 persist under `Saath/app/.wrangler` (local only, not production)
- Fresh-schema database: isolated file `/tmp/saath-backend-audit-43933/fresh.sqlite` created for this audit. Existing databases were not replayed.
- AI: `AI_API_KEY` / `AI_MODEL` unset in the checked runtime. No paid provider calls were made.
- Voice: `LIVEKIT_*` unset. Payments out of scope.

## Commands

```bash
# baseline (before audit edits)
node --experimental-strip-types --test \
  lib/server/validation.test.mjs \
  lib/server/lifecycle.test.mjs \
  lib/application/request-service.test.mjs \
  lib/application/chair-service.test.mjs
./node_modules/.bin/tsc --noEmit --pretty false

# after fixes
node --experimental-strip-types --test \
  lib/server/validation.test.mjs \
  lib/server/lifecycle.test.mjs \
  lib/application/request-service.test.mjs \
  lib/application/chair-service.test.mjs
node --experimental-strip-types --experimental-sqlite \
  scripts/apply-fresh-migrations.mjs /tmp/saath-backend-audit-43933/fresh.sqlite
node scripts/audit-http.mjs
./node_modules/.bin/tsc --noEmit --pretty false
pnpm build
```

Baseline before edits: 21 unit tests pass, `tsc` pass.

After fixes: 27 unit tests pass, 29 HTTP integration checks pass, `tsc` pass, `pnpm build` pass.

## Test results

Area | Test | Expected behaviour | Actual result | Pass/Fail/Blocked | Evidence
--- | --- | --- | --- | --- | ---
Baseline | Existing unit suite | All previous tests still pass | 21/21 pass before edits | Pass | `node --experimental-strip-types --test …`
Baseline | Typecheck | `tsc --noEmit` clean | exit 0 | Pass | local `tsc`
Auth | Protected GET endpoints reject anonymous | 401 `AUTH_REQUIRED` | 401 on `/api/context`, `/api/requests`, `/api/profile`, `/api/chairs` | Pass | `scripts/audit-http.mjs`
Auth | Identity from trusted mechanism | Owner comes from Sites headers, not body | PUT with `ownerId`/`userId` still saved only for signed-in A | Pass | HTTP audit; `user()` reads `oai-authenticated-user-*`
Auth | A cannot read B context | Separate snapshots | A=`owner-a-private`, B=`owner-b-private` | Pass | HTTP GET after both PUTs
Auth | Requests owner-scoped | B’s sample request not in A’s list | `leakedToA=false` | Pass | HTTP audit
Auth | Status has no credentials | No keys/tokens | `secrets=false` | Pass | GET `/api/status`
Auth | Production has no local auth bypass | Vite mock only in `configureServer` | `sites({ mockAuth: !managedLinux })`; worker uses ChatGPT headers only | Pass | `vite.config.ts`, `chatgpt-auth.ts`, `sites-vite-plugin.ts`
Context | Save / get / update / delete | Owner-scoped persistence | Empty, update, and delete leave B intact | Pass | unit `empty context is saved…`
Context | Empty content | Schema allows empty string | HTTP 200, stored `""` | Pass | HTTP audit; documented max 8000, no min
Context | Invalid share mode | 400 | 400 enum error | Pass | HTTP audit
Context | Oversized content | 400 at 8001 chars | 400 | Pass | HTTP audit
Requests | Consent required | 400 without `consent:true` | 400 | Pass | HTTP + validation tests
Requests | Allowed modes | chat can save; voice/video 409 | 409, no live connection | Pass | HTTP audit
Requests | Snapshot stored | Pending record matches approved context | `approved snapshot` pending, notice says not a live connection | Pass | HTTP 201
Requests | Invalid input creates no record | 400/409 leave owner list unchanged | missing consent / forged target rejected | Pass | HTTP audit
Requests | Duplicate prevention | 409 if active request exists | Browser: “You already have an active request with this person.” | Pass | UI error, not a success toast
Requests | Sample path cannot target a real account | 400 | 400 listed-sample-only | Pass | unit + HTTP; this was a confirmed defect
Requests | Delivery / live accept | Sample requests are not delivered | Notice: does not notify or connect a real person | Pass | HTTP notice
Requests | Listener accept | Enrolled listener can accept a pairing request | Existing pairing unit still passes | Pass | `request-service.test.mjs`
Reports | Auth + validation | 401 anonymous, 400 short reason, 201 `{ok,id}` | 400 / 201 keys=`ok,id` | Pass | HTTP + unit
Reports | No other-user data | Response does not return reason/owner | `{ok,id}` only | Pass | HTTP audit
Reports | Moderation workflow | Storage only | No staff queue exists | Pass | documented remaining work, not a defect
Rehearse | Auth + consent | 401 / 400 | 401 anonymous, 400 missing consent | Pass | HTTP audit
Rehearse | Roles / sizes | Reject `system`, oversized history | validation tests pass | Pass | `validation.test.mjs`
Rehearse | Missing config | 503 `AI_NOT_CONFIGURED`, no reply | 503, empty reply, no secrets | Pass | HTTP + browser notice
Rehearse | Mock timeout / empty / upstream | Sanitised 504/502 | unit mappings pass | Pass | mocked `MemoryLanguageModel` only
Rehearse | No private context append | Server does not load stored context | Probe messages omit private store text | Pass | unit; frontend only appends if the user typed it
Rehearse | Quota isolation + concurrency | 20/hour per user | 20 succeed, overflow rejected, B still allowed | Pass | unit `Promise.all`
Rehearse | Live provider | Real upstream reply | Not configured; no paid call made | Blocked | needs `AI_API_KEY` + `AI_MODEL`
Status | Flags match runtime | auth, atRest, voice false, twoChairs true | matches local `.dev.vars` | Pass | HTTP GET `/api/status`
Boundaries | Malformed JSON | 400 | 400 Invalid JSON | Pass | HTTP audit
Boundaries | Wrong content type | 415 | 415 | Pass | HTTP audit
Boundaries | Missing / foreign Origin | 403 | 403 | Pass | HTTP audit
Boundaries | Oversized body | 413 | 413 | Pass | HTTP audit
Boundaries | GET `/api/reports` | 405/404 | 405 | Pass | HTTP audit
Boundaries | Cache-Control | `no-store` on sensitive JSON | present | Pass | HTTP audit
Boundaries | Parameterised SQL | Bindings, not string concat | D1 usage uses `.bind()`; Drizzle uses bound params | Pass | code review of `d1-*-repository.ts`, `d1-usage-repository.ts`
Boundaries | DB failure sanitised | Generic 500, no internals | `fail()` hides non-status errors | Pass | `lib/server/http.ts` (no live D1 outage injected)
Migrations | Fresh DB apply | All current migrations succeed | tables + unique pairing/chair-code indexes | Pass | `/tmp/saath-backend-audit-43933/fresh.sqlite`
Frontend | My Space save → reload → GET | Same text after reload | `reload-check note` | Pass | browser
Frontend | Sample request error handling | Error notice, not success | Duplicate 409 shown as error | Pass | browser
Frontend | Rehearsal missing provider | Error, no fake reply | notice is 503 copy, `hasReply=false` | Pass | browser
Build | Production build | Completes | Vinext build complete | Pass | `pnpm build`
Voice | Live call | Out of scope | 409 `VOICE_UNAVAILABLE` | Blocked | LIVEKIT unset
Payments | Checkout / webhook | Out of scope | not implemented | Blocked | task excluded this

## Confirmed defects and fixes

1. **Sample request path accepted any `providerId`.** A client could create a pending request whose `provider_id` was another account, which then appeared as incoming. **Fix:** only `sample-meera`, `sample-arjun`, `sample-isha`, `sample-kabir` are valid without a pairing code. Incoming list and accept/decline now require listener enrollment when profiles are wired.
2. **Reports could be submitted with an empty owner at the service layer.** Routes already required auth. **Fix:** `ReportService.submit` rejects an empty owner.
3. **Drizzle `profiles.pairing_code` index did not match the unique index in migration `0002`.** **Fix:** schema now uses `uniqueIndex('profiles_pairing_idx')`. No migration replay.

## Files changed

- `lib/domain.ts` — sample provider allow-list
- `lib/application/request-service.ts` — sample-target guard, incoming/accept require listener
- `lib/application/report-service.ts` — auth guard
- `db/schema.ts` — pairing unique index matches migration
- `lib/application/request-service.test.mjs` — isolation, rehearsal mock, reports
- `lib/server/validation.test.mjs` — report bounds
- `scripts/apply-fresh-migrations.mjs` — isolated schema apply
- `scripts/audit-http.mjs` — HTTP boundary audit
- `docs/BACKEND_TEST_REPORT.md` — this report

## Remaining risks and blocked checks

- Live OpenAI-compatible replies are untested. Mock-provider tests do not verify a live model.
- Local Miniflare D1 is not the hosted production database.
- A passing `pnpm build` does not verify hosted D1 bindings, Sites auth headers, or secret injection.
- Concurrent duplicate request creates remain possible without a unique `(owner_id, provider_id)` constraint. Schema was not changed.
- Reports are stored only. There is no staff moderation queue.
- `includePrivateContext` is accepted by validation and unused by the rehearsal service. The UI appends chosen text on the client instead.
- Local second-person testing uses a Vite-only header. Production ignores it.

## Current capabilities

Available locally: ChatGPT/Sites identity, enrollment, pairing, owner-scoped context with optional AES-256-GCM at rest, pending sample and paired requests, report storage, Two Chairs text rooms, honest AI/voice unavailable states.

Unavailable: live AI replies until provider secrets exist; live voice/video; payments; provider verification; operational moderation; real-time participant messaging; production D1 verification.
