import { sqliteTable, text, index, integer, uniqueIndex } from 'drizzle-orm/sqlite-core';
export const contexts = sqliteTable('contexts', {
  ownerId: text('owner_id').primaryKey(), content: text('content').notNull(),
  shareMode: text('share_mode').notNull().default('private'), updatedAt: text('updated_at').notNull(),
});
export const sessionRequests = sqliteTable('session_requests', {
  id: text('id').primaryKey(), ownerId: text('owner_id').notNull(),
  providerId: text('provider_id').notNull(), providerName: text('provider_name').notNull(),
  topic: text('topic').notNull(), context: text('shared_context').notNull(),
  mode: text('mode').notNull(), status: text('status').notNull().default('pending'),
  createdAt: text('created_at').notNull(),
}, table => [index('requests_owner_idx').on(table.ownerId)]);
export const reports = sqliteTable('reports', {
  id: text('id').primaryKey(), ownerId: text('owner_id').notNull(),
  targetId: text('target_id').notNull(), reason: text('reason').notNull(), createdAt: text('created_at').notNull(),
}, table => [index('reports_owner_idx').on(table.ownerId)]);
export const aiUsage = sqliteTable('ai_usage', {
  id: text('id').primaryKey(), ownerId: text('owner_id').notNull(),
  windowStart: text('window_start').notNull(), calls: integer('calls').notNull().default(0),
});
export const profiles = sqliteTable('profiles', {
  ownerId: text('owner_id').primaryKey(),
  displayName: text('display_name').notNull().default(''),
  clientEnrolled: integer('client_enrolled').notNull().default(0),
  listenerEnrolled: integer('listener_enrolled').notNull().default(0),
  activeRole: text('active_role').notNull().default('client'),
  pairingCode: text('pairing_code'),
  updatedAt: text('updated_at').notNull(),
}, table => [uniqueIndex('profiles_pairing_idx').on(table.pairingCode)]);
export const chairSessions = sqliteTable('chair_sessions', {
  id: text('id').primaryKey(),
  code: text('code').notNull(),
  hostId: text('host_id').notNull(),
  guestId: text('guest_id'),
  hostName: text('host_name').notNull(),
  guestName: text('guest_name'),
  mode: text('mode').notNull(),
  status: text('status').notNull().default('waiting'),
  stage: text('stage').notNull().default('agree'),
  paused: integer('paused').notNull().default(0),
  guestJoined: integer('guest_joined').notNull().default(0),
  note: text('note').notNull().default(''),
  aiReply: text('ai_reply').notNull().default(''),
  updatedAt: text('updated_at').notNull(),
}, table => [
  uniqueIndex('chairs_code_idx').on(table.code),
  index('chairs_host_idx').on(table.hostId),
  index('chairs_guest_idx').on(table.guestId),
]);
