# How Saath is built, and how to learn it

Saath keeps screens, rules, and storage apart. That is how the backend stays robust when the real schema arrives, and how you can learn one layer at a time.

## The idea in one sentence

A route never talks to the database directly. It asks a **service**. The service asks a **port**. A **D1 adapter** implements that port today; a memory adapter implements it in tests.

```
Browser
  -> app/page.tsx
  -> app/api/*/route.ts          transport: auth, origin, JSON
  -> lib/application/*-service   rules: ownership, transitions, limits
  -> lib/application/ports.ts    contracts
  -> lib/infrastructure/d1-*     Cloudflare D1
  -> db/schema.ts + drizzle/     current tables only
```

## SOLID, in this codebase

| Principle | What it means here | Where to look |
| --- | --- | --- |
| Single responsibility | A route only translates HTTP. A service only applies product rules. A repository only stores rows. | `app/api/requests/route.ts` vs `lib/application/request-service.ts` |
| Open / closed | New storage can be added by implementing a port. Existing services stay unchanged. | `ContextRepository` + `D1ContextRepository` + `MemoryContextRepository` |
| Liskov substitution | Tests use in-memory adapters in place of D1. The service cannot tell the difference. | `lib/application/request-service.test.mjs` |
| Interface segregation | Small ports: context, requests, reports, usage, language model. Nothing asks for a “god” database. | `lib/application/ports.ts` |
| Dependency inversion | Services depend on ports, not Drizzle or `fetch`. `createServices()` wires the real adapters. | `lib/server/compose.ts` |

## One working journey: save private context

1. In My Space, the person writes in the context field. React state holds the text (`app/page.tsx`).
2. Save sends `PUT /api/context` with `{ content, shareMode }`.
3. The route checks same-origin, reads the signed-in user from platform headers, and validates the body (`lib/server/http.ts`, `lib/server/validation.ts`).
4. `ContextService.save` uses only the server identity. The browser cannot choose another owner.
5. `D1ContextRepository` upserts the `contexts` row keyed by `owner_id`.
6. The response is that owner’s context only.

Try the same path signed out: the API returns `401 AUTH_REQUIRED`. Another user’s id is never accepted from the client.

## Design principles used on the screen

- One visual identity: dusty-blue and ivory (`#F5F7FA` background, `#FFFFFF` cards, `#526B86` primary, `#D9C9B8` accent, `#293440` text).
- Text sits on a solid surface. Images are illustration, not a full-page website mockup.
- Named assets only: `/assets/saath-garden-hero.png`, `/assets/saath-rehearsal.png`, `/assets/saath-circles.png`, `/favicon.svg`.
- Honest states: sample profiles, pending requests, missing AI, disabled voice/video, planned circles.
- Silence and exit stay available. Nothing autoplays.

## Small exercises

1. Change a button label in `app/page.tsx` and refresh.
2. Swap the homepage image to `/assets/saath-rehearsal.png`, then put the garden hero back.
3. Save synthetic context while signed in. Watch `PUT /api/context` in the Network panel.
4. Find the owner filter in `D1ContextRepository`.
5. Run `node --experimental-strip-types --test lib/application/request-service.test.mjs` and explain which failure each test prevents.
6. Read `drizzle/0000_petite_hellcat.sql` and name the primary key of `contexts`.

Do not log private text or secrets. Keep edits small enough that you can explain them.
