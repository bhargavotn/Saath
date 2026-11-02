# Continue building Saath in Cursor

## Open and run

1. Extract the complete source archive and open the `saath` folder in Cursor.
2. Install Node.js 22.13 or newer and pnpm.
3. Run `pnpm install`.
4. A clean download automatically uses the portable development profile; no cloud workspace configuration is included.
5. Run `pnpm dev` and open the displayed local URL.

The cloud-hosted site uses the Sites/Cloudflare runtime. This repository is Vinext-compatible App Router React, not a plain static HTML export. The default source uses the Sites starter scripts; consult README and BACKEND.md when changing deployment platforms.

## Workstreams

| Frontend | Backend |
| --- | --- |
| Calm responsive pages and components | Identity and owner-scoped database access |
| Search/filter sample people | Real provider registry and availability |
| Context preview and sharing controls | Context permissions and revocation |
| Rehearsal chat, consent, errors | AI provider gateway and usage limits |
| Guided Two Chairs exercise | Invitations, mutual acceptance, participant permissions |
| Circle exploration | Membership, facilitator tools, moderation |
| Optional ambient sound controls | No audio backend needed for local synthesis |

## Activate AI

Set `AI_API_KEY` and `AI_MODEL` as server-side secrets. For compatible providers optionally set `AI_BASE_URL`. For local Worker development use `.dev.vars`, which must remain ignored by Git. Production values belong in the hosting environment. API keys are not provided in this source.

The API sends only the rehearsal scenario and message history submitted with consent. It does not automatically send the private context card or record audio. Check your provider's data processing and retention settings before using real personal disclosures.

## Build order after this foundation

1. Replace synthetic people with approved provider profiles and role distinctions.
2. Add invitation acceptance, participant membership checks, and real-time text messages.
3. Add reporting and enforced blocking, a staffed moderation queue, and provider review.
4. Integrate voice/video with private rooms and explicit microphone/camera permission.
5. Add moderated Circle membership and facilitator permissions.
6. Add booking conflict checks and verified payment webhooks if charging for sessions.
7. Complete retention, export/deletion, privacy notices, accessibility review, and operational testing.

Do not expose the application as a live support marketplace until these integrations and operating processes are ready. The current private release lets you review design, data saving, and rehearsal configuration without pretending example profiles are real participants.

## Useful Cursor instruction

Read README.md, BACKEND.md, ASSETS.md, AUDIO.md, and existing code before editing. Preserve the Saath palette and calm layout. Work in separate frontend and backend changes against the documented API contract. Implement one complete journey at a time, verify ownership boundaries and user-visible errors, and never replace missing integrations with silent mocks or invented live users.
