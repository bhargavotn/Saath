# Schema mapping

Existing tables were preserved. One additive table was added so client/listener enrollment can persist. No destructive migrations were run.

## Current tables

| Table | Used for | Gap |
| --- | --- | --- |
| `contexts` | Owner-private life context and share mode (`private` / `ask-first`). Encrypted at rest when `CONTEXT_ENCRYPTION_KEY` is set. | Cannot store introduction cards, reflections, or recipient-specific snapshots without mixing concerns. |
| `session_requests` | Connection requests: pending, cancelled, expired. Owner-scoped outgoing and listener-scoped incoming. Shared notes encrypted at rest when the key is set. | Sample profiles still cannot accept. No booking slots. |
| `profiles` | One signed-in identity, client and/or listener enrollment, active role, listener pairing code. | Not operator verification. A listener is not automatically a counsellor. |
| `reports` | Owner-created moderation reports. | No staff queue, assignee, or block table. |
| `ai_usage` | Per-user hourly rehearsal attempt counter. | Wording assistance is not separately metered. |

## Required when the schema arrives

Map, then add only necessary migrations:

- Users / provider profiles, roles, languages, topics, modes, price, availability, operator-only verification.
- Recipient-specific shared context snapshots and revocation.
- Request membership plus accept/decline actor.
- Conversation membership, messages, pagination, idempotency keys, blocks.
- Two Chairs remote membership and turn state.
- Activities, invitations, private drafts vs published responses.
- Circles, membership approval, facilitator authorisation, private membership.
- Introduction card persistence.
- Payment orders and verified webhook events.

Until then, introduction cards, activities, conversation previews, provider drafts, circle membership, and blocks use explicitly labelled browser fixtures. They are not described as production functionality.
