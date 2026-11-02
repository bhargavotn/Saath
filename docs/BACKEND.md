# Saath backend

This first vertical slice uses Vinext route handlers, Cloudflare D1, and the starter's platform-authenticated ChatGPT identity. The site is owner-private at initial publication. Backend APIs do not trust an owner ID supplied by the client.

## Implemented

- `GET /api/status`: `{authenticated, displayName, aiConfigured, encryption, voiceConfigured, pairing, twoChairs, persistence}`. Never exposes credentials. `encryption.endToEnd` is always false.
- `GET /api/profile`: signed-in enrollment, or `{profile:null}`. Never returns `owner_id`.
- `PUT /api/profile`: enroll as client, listener, or both on the same account.
- `PATCH /api/profile`: switch the active role. The user cannot grant verification.
- `GET /api/context`: signed-in user's `{context: {content,shareMode,updatedAt} | null}`.
- `PUT /api/context`: JSON `{content,shareMode: "private" | "ask-first"}`. Maximum 8,000 characters. Does not disclose context to anyone.
- `DELETE /api/context`: deletes the signed-in user's saved context.
- `GET /api/requests`: `{requests, incoming}`, newest first, up to 100 each. Pending requests older than seven days are marked expired.
- `POST /api/requests`: `{providerId,providerName,topic,context,consent:true,mode:"chat"|"voice"|"video",pairingCode?}`. Sample-profile requests stay labelled and do not contact a real person. A pairing code creates a pending request for an enrolled listener. Rejects duplicate active requests and non-chat modes.
- `PATCH /api/requests`: `{id,action:"cancel"|"accept"|"decline"}`. The sender may cancel. The enrolled listener may accept or decline. Sample profiles cannot act.
- `POST /api/wording`: `{text,consent:true,approveFactsUnchanged:true}`. Optional AI wording help. Returns 503 `AI_NOT_CONFIGURED` when credentials are missing. Does not save the suggestion.
- `POST /api/reports`: `{targetId,reason}` saves a moderation report. Moderation staff workflow is not yet implemented.
- `POST /api/rehearse`: `{messages:[{role:"user"|"assistant",content}],scenario,style:"hesitant"|"defensive"|"receptive",consent:true}`. Authenticated server-side AI call. Messages are not persisted by Saath. Atomic D1 accounting limits each user to 20 provider attempts per UTC-aligned hour; failed provider attempts count toward the limit. Returns `{reply,disclaimer}`. With no configured provider, returns HTTP 503 and `code: "AI_NOT_CONFIGURED"`; never fabricates an AI response.
- `GET /api/chairs`: `{sessions}` for the signed-in member, or `{session}` when `?id=` is set.
- `POST /api/chairs`: `{mode:"same-device"|"ai"|"paired",displayName?,pairingCode?}` opens a room. Paired rooms stay waiting until the other person joins.
- `POST /api/chairs/join`: `{code,displayName?}`. Presence is recorded only after this succeeds.
- `PATCH /api/chairs`: `{id,action:"start"|"next"|"pause"|"resume"|"leave"|"note"|"ai-turn"|"call",note?,message?}`. `call` returns 409 until a real LiveKit room exists. `ai-turn` uses the fictional rehearsal model on Person B steps only.

All data endpoints require authentication. Mutations enforce same-origin requests. Inputs have size bounds and validation. Responses disable caching. Internal database and upstream errors are not disclosed to clients. Application code does not log sensitive content.

## Hosting and local setup

Set `d1` to `"DB"` in `.openai/hosting.json`. Additive migrations `drizzle/0002_enrolled_profiles.sql` and `drizzle/0003_chair_sessions.sql` add `profiles` and `chair_sessions`. Sites applies generated migrations during publication. For local database setup use the starter's Wrangler D1 migration flow; local and production databases are separate.

Set `CONTEXT_ENCRYPTION_KEY` to 64 hex characters to encrypt private context and request notes at rest with AES-256-GCM. The server decrypts for the signed-in owner. This is not end-to-end encryption. Without the key, text is stored as written and `/api/status` reports `encryption.atRest: false`.

For AI, configure server-side production secrets `AI_API_KEY` and `AI_MODEL`, and optionally `AI_BASE_URL` for an OpenAI-compatible HTTPS endpoint. Defaults to `https://api.openai.com/v1`. Do not put credentials in client components or commit `.env` files. For local Workers development, configure these values in an ignored `.dev.vars` file. The example file only documents key names.

Before AI use, the frontend must explain that selected conversation text is transmitted to the configured external provider. Provider retention and processing terms need to be included in the published privacy policy. This integration does not provide end-to-end encryption or predict the thoughts of a real person.

## Remaining production work

Provider identity and qualification verification; invitation acceptance and participant messaging; persistent blocks enforced during matching; moderation queue and staff access controls; booking conflict prevention; payment verification; circle membership, moderation, and reporting; real-time voice/video; granular context revocation; verified privacy/retention policy and export/deletion workflow for all account records; additional AI abuse and budget controls before public rollout. No automated provider contacts or simulated live people are included.

## Validation

`node --experimental-strip-types --test lib/server/validation.test.mjs lib/server/lifecycle.test.mjs lib/application/request-service.test.mjs lib/application/chair-service.test.mjs` covers validation, request pairing, encryption, enrollment, rehearsal limits, Two Chairs join rules, AI-chair gating, and encrypted chair notes. `npx tsc --noEmit` should pass. Live voice remains untested because LIVEKIT values are unset. Live AI replies remain untested until provider credentials are configured.
