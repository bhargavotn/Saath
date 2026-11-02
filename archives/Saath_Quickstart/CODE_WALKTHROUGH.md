# Learn Saath by following one real request

## Start with a small goal

Open My Space and understand what happens when a signed-in user saves their context. Do this before trying to understand the entire application.

| Layer | File | What to look for |
| --- | --- | --- |
| Screen and state | app/page.tsx | Context state, save handler, fetch call, loading/error message |
| API | app/api/context/route.ts | GET, PUT, DELETE handlers |
| Identity | app/chatgpt-auth.ts | Stable authenticated user ID from platform headers |
| Request checks | lib/server/http.ts | Authentication, same-origin check, JSON parsing, bounded body, errors |
| Validation | lib/server/validation.ts | Context content bounds and sharing-mode values |
| Database adapter | db/index.ts | D1 binding passed to Drizzle |
| Schema | db/schema.ts | Context row keyed by owner ID |
| Migrations | drizzle/ | Existing SQL defining stored tables |
| Styling | app/globals.css | Palette, typography, responsive behaviour |
| Sound | components/AmbientSound.tsx | Explicit audio start, gain, sources, cleanup |
| Review studio | app/studio/page.tsx | Named assets, device voice preview, microphone meter |

## Save flow

1. A user edits the context field. React state holds the text.
2. Save sends a JSON PUT request to `/api/context`.
3. The server rejects a request from an unexpected origin.
4. The server obtains the signed-in user's ID; the browser cannot choose another owner.
5. Validation checks allowed fields and text size.
6. Drizzle inserts that owner's context, or updates it when the owner already has a row.
7. The server returns the saved context and timestamp without returning another user's information.
8. The interface displays success or a useful error.

GET and DELETE use the same authenticated owner key. The permission check matters more than whether the Save button is visible.

## What is actually in the current database

- `contexts`: private user context.
- `session_requests`: pending request records; not actual provider delivery or acceptance.
- `reports`: report submissions; not a staffed moderation process.
- `ai_usage`: per-user/hour AI request counts.

This is a foundation, not the final schema for all proposed features.

## What to provide for your database connection

Share the database engine/provider name, schema or migrations, required relationships, auth identity mapping, and permission requirements. Use fake sample rows. Do not share passwords, live connection strings, API keys, or actual personal disclosures.

Changing to PostgreSQL later requires an actual adapter/schema/migration change; changing a database URL alone will not convert the D1 code. Keep it as a separate deliberate task.

## Small learning exercises

1. Change a button label and observe it locally.
2. Find the image reference, then swap it to another included asset.
3. Follow one Save request in the browser Network panel and inspect status/payload with synthetic text.
4. Find the corresponding validation rule and owner filter in the server.
5. Read one migration and identify its primary key.
6. Run a targeted test and explain which failure it prevents.

Do not log private context or secrets while debugging. Keep edits small so you can explain what changed.
