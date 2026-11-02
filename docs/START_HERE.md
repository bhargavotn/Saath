# Saath: one prompt, then learn by running it

This is an asset and instruction supplement, not a second application.

1. Extract the latest `Saath_Cursor_Source.zip` and open its `saath` folder in Cursor.
2. Copy this supplement's `public/assets` folder into that project's `public/assets`. The latest source already contains these same files, so keep the filenames.
3. Copy `CURSOR_START.md` and `CODE_WALKTHROUGH.md` into the project root.
4. Paste the contents of `CURSOR_START.md` into Cursor Agent once.
5. Follow the app's local URL and the agent's verified setup steps. Open `/studio` for artwork and sound review.

## Scope now

Run and inspect the app; wire the provided artwork; verify existing private-context persistence; understand the frontend/API/database path. More database-backed features must wait for your authoritative schema. Payment integration and live human voice are later phases.

## Assets

| File | Intended placement |
| --- | --- |
| public/assets/saath-garden-hero.png | Homepage illustration or quiet-mode visual |
| public/assets/saath-rehearsal.png | Rehearsal/Two Chairs introduction |
| public/assets/saath-circles.png | Circle discovery/empty state |
| public/favicon.svg | Browser icon |

Use URL paths `/assets/saath-garden-hero.png`, `/assets/saath-rehearsal.png`, and `/assets/saath-circles.png` in browser markup. Do not put `public` in the browser URL.

Keep body text on a solid reading surface. Fit images without stretching. Desktop may use side-by-side illustration/text; mobile should stack them. No image-generation service is needed at runtime.

## Credentials

AI.env.example documents names only. For local Worker development, private values belong in ignored `.dev.vars`; production values belong in the hosting environment. Do not paste keys into chat or frontend files. No payments or calling credentials are needed for the current phase.

## Working versus planned

Current source: homepage, discovery examples, context saving routes, saved sample requests, AI text gateway (requires configuration), guided same-device Two Chairs, Circles exploration, procedural sounds, asset/voice studio.

Planned: real provider acceptance, participant messaging/calls, operational moderation, database-backed onboarding activities/circles, payments. UI examples do not establish a real human connection.
