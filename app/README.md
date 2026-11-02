# Saath — Someone alongside you

A full-stack foundation for supportive conversations: discovery, shared context, AI rehearsal, guided Two Chairs, and Circles exploration.

## Run in Cursor

Requires Node 22.13+ and pnpm. Open `Saath/app`. Guides live in `../docs`.

```bash
pnpm install
pnpm dev
```

Then open the local URL printed by the dev server. The portable development profile provides local-only simulated ChatGPT sign-in. Hosted identity is provided by Sites; this is not a standalone public authentication service.

```bash
node --experimental-strip-types --test lib/server/validation.test.mjs lib/server/lifecycle.test.mjs lib/application/request-service.test.mjs
npx tsc --noEmit
pnpm build
```

- `app/page.tsx`, `app/globals.css`, `components/`: frontend.
- `app/api/`: thin HTTP routes.
- `lib/application/`, `lib/infrastructure/`, `lib/server/compose.ts`: services, ports, and adapters.
- `db/`, `drizzle/`: persistent data schema and migrations.
- `../docs/ARCHITECTURE.md` and `../docs/CODE_WALKTHROUGH.md`: how to read and learn the system.
- `../docs/BACKEND.md`: endpoint contract and operational details.

## Current boundaries

People and Circles shown in discovery are examples, not a live provider directory. Requests are records of interest; they do not notify or connect real people. Two Chairs is a guided local exercise. Calling, payments, provider verification, real-time participant sessions, moderated group membership, and operational moderation staffing need implementation before a public service launch.

AI rehearsal requires server-side environment configuration described in `.env.example`; it returns an honest unavailable state until configured. Do not enter API credentials in the browser. Private context can be encrypted at rest with `CONTEXT_ENCRYPTION_KEY`. End-to-end encryption is not claimed. Context saving and enrollment require ChatGPT sign-in; guest interactions remain in memory.

## Deployment

This checkout uses the Sites Vinext/Cloudflare Worker runtime with D1 (`DB`). Source configuration is `.openai/hosting.json`. Generate schema migrations with `pnpm db:generate`; hosted deployment applies pending migrations. See starter scripts for portable execution setup.

## Before inviting public users

Connect a real provider registry and acceptance workflow; implement participant-authorized real-time messaging/calls; implement provider credential review, operational reporting, retention and deletion policies, and regional support resources. Review AI data processing and consent with your selected provider. This foundation does not diagnose or deliver emergency care.
