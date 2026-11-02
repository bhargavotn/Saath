# Implementation status

Updated: 2026-11-01

## Completed

- Extracted `Saath_Cursor_Source-2.zip` into `saath/` without mixing it into the sibling workspace project.
- Preserved the Vinext / React / TypeScript / Cloudflare Workers / D1 / platform-auth stack and the current D1 schema.
- Phase 1: calm homepage copy, garden-courtyard hero, existing palette, local assets, `ASSET_MANIFEST.md`.
- Phase 2: optional Getting to Know You, private introduction card, My Space sections, no personality inference.
- Phase 3: role distinction, discovery filters, request preview/consent, pending/cancel/expire on the server, duplicate active-request prevention.
- Phase 4: participant conversation UI with labelled development fixtures, report/block/pause/leave controls. Voice/video stay disabled.
- Phase 5: rehearsal consent, explicit context inclusion, cancel/restart, static prompts when AI is missing, wording help API that does not fabricate replies.
- Phase 6: same-device six-stage exercise, fictional rehearsal mode, remote mode that does not invent a present participant.
- Phase 7: activities workspace, templates, suggestions from explicit answers, private draft vs preview.
- Phase 8: circle exploration with guidelines, membership request fixtures, planned/not-operating status.
- Phase 9: Need a moment, phrase preview, discreet urgent-help route with reviewed IASP directory only.
- Phase 10: one ambient engine, off by default, stop/mute, no treatment claims.
- Phase 11: request lifecycle validation, same-origin mutations, honest privacy copy. No client-granted roles.
- Phase 12: price shown before a sample booking; payments and live rooms remain unconfigured.

## Current work

- Additive `profiles` table for one-account client/listener enrollment and pairing-code sync.
- AES-256-GCM at-rest encryption for private context and request notes when `CONTEXT_ENCRYPTION_KEY` is configured. End-to-end encryption is not claimed.
- Dusty-blue and ivory theme applied from the requested palette.
- Local git history exists on `main` in `saath/`. An online Cursor copy is waiting until the Studyous team Origin namespace is enabled at cursor.com/codebase.

## Verification

- 9/9 targeted tests passed: `node --experimental-strip-types --test lib/server/validation.test.mjs lib/server/lifecycle.test.mjs`
- `./node_modules/.bin/tsc --noEmit` passed.
- `pnpm build` succeeded, including `/api/wording`.
- Named asset pack copied in. Hashes match `app/public/assets/ASSET_MANIFEST.json`. Circles, rehearsal, and homepage use only those files.
- Backend split into ports, services, and D1 adapters. Route handlers no longer contain database or provider logic.
- Named asset pack copied in. File hashes match `app/public/assets/ASSET_MANIFEST.json`. Homepage, rehearsal, and circles use only those images.
- Backend split into ports, services, and D1 adapters. Route handlers no longer contain database or provider logic.
- Local images loaded: `saath-garden-hero.png` 2048×768, `saath-rehearsal.png` 1536×1024, `saath-circles.png` 1536×1024.

## Blockers

- Authoritative database schema is still outstanding. Introduction cards, activities, conversations, provider drafts, circle membership, and blocks cannot persist in D1 without new tables. See `SCHEMA_MAPPING.md`.
- Sample profiles cannot accept requests. There are no live participants.
- AI replies require `AI_API_KEY` and `AI_MODEL` as server-side secrets.
- Voice/video, LiveKit rooms, payments, operator verification, staffed moderation, and live circle operation are unconfigured.
- Regional emergency phone numbers are omitted until they pass `URGENT_HELP.md`.
