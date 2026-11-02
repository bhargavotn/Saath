Complete the current Saath development phase in this existing repository. Implement and verify; do not stop at a plan.

Read repository instructions, START_HERE.md, CODE_WALKTHROUGH.md, README.md, CURSOR_GUIDE.md, BACKEND.md, ASSETS.md, AUDIO.md, and VOICE_SELECTION.md. Preserve the current React/TypeScript/Vinext/Cloudflare stack and working code.

Do these tasks in order:

1. Install the locked dependencies, run the app, and record any baseline failures. Use the repository's supported commands.
2. Verify the three exact image files under public/assets: saath-garden-hero.png, saath-rehearsal.png, saath-circles.png. Use them in the corresponding homepage, rehearsal, and circles introductory surfaces where they improve the existing layout. Preserve functional controls and the approved ivory/sage/forest-green design. Do not redesign unrelated screens. Keep imagery restrained and text readable. Check /studio asset downloads.
3. Verify navigation, mobile layout, Quiet Corner Play/Pause/volume, context editor, consent preview, rehearsal error states, and same-device Two Chairs. Fix concrete defects. Do not add fake participants, messages, or model responses.
4. Trace and verify existing context persistence through frontend -> /api/context -> server identity/validation -> D1 -> response. Use synthetic data. Test signed-out rejection and owner isolation. Apply only the existing migrations to a fresh local database; do not replay applied migrations blindly.
5. I will provide the authoritative DB schema separately. Until then preserve the current schema and implement only schema-independent work. Do not invent new production tables or switch DB providers. List the exact schema inputs needed for onboarding activities, actual connections, and circles. Do not call those features complete while persistence or permissions remain placeholders.
6. Keep payments and live human voice out of this phase. Retain honest unavailable states. Existing optional local sounds may stay. AI text rehearsal can use existing server-side environment configuration if available; otherwise keep its clear unavailable state.
7. Run type checks, meaningful targeted tests, and a production build. Browser-check the main journey where tooling permits. Report anything not actually tested.
8. Update IMPLEMENTATION_STATUS.md and explain one working journey with file paths: user action -> UI state -> API -> authentication -> validation -> database -> response. Keep the explanation beginner-friendly and tied to actual code.

Continue through all unblocked work. Finish with implemented changes, passed checks, exact run commands, and concrete remaining blockers. Never expose secrets, contact real people, charge money, overwrite data, or perform unrelated refactors.
