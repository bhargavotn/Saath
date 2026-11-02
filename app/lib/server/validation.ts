import {z} from 'zod';
const short=z.string().trim().min(1).max(160);
export const contextSchema=z.object({content:z.string().trim().max(8000),shareMode:z.enum(['private','ask-first']).default('private')});
export const requestSchema=z.object({
  providerId:short.optional(),
  providerName:short.optional(),
  topic:short,
  context:z.string().trim().max(8000),
  consent:z.literal(true),
  mode:z.enum(['chat','voice','video']),
  pairingCode:z.string().trim().toUpperCase().regex(/^[A-Z2-9]{6}$/).optional(),
}).refine(value => Boolean(value.pairingCode || (value.providerId && value.providerName)), {
  message: 'Choose a sample person or enter a listener pairing code.',
});
export const enrollSchema=z.object({
  clientEnrolled:z.boolean(),
  listenerEnrolled:z.boolean(),
  displayName:z.string().trim().max(80).optional(),
  activeRole:z.enum(['client','listener']).optional(),
}).refine(value => value.clientEnrolled || value.listenerEnrolled, {message:'Choose client, listener, or both.'});
export const roleSchema=z.object({activeRole:z.enum(['client','listener'])});
export const requestPatchSchema=z.object({id:z.string().trim().min(1).max(80),action:z.enum(['cancel','accept','decline'])});
export const rehearsalSchema=z.object({
  messages:z.array(z.object({role:z.enum(['user','assistant']),content:z.string().trim().min(1).max(2000)})).min(1).max(16),
  scenario:z.string().trim().min(1).max(2000),
  style:z.enum(['hesitant','defensive','receptive']).default('receptive'),
  consent:z.literal(true),
  includePrivateContext:z.literal(true).optional(),
});
export const reportSchema=z.object({targetId:short,reason:z.string().trim().min(5).max(2000)});
export const wordingSchema=z.object({text:z.string().trim().min(1).max(2000),consent:z.literal(true),approveFactsUnchanged:z.literal(true)});
export const chairCreateSchema=z.object({
  mode:z.enum(['same-device','ai','paired']),
  displayName:z.string().trim().max(80).optional(),
  pairingCode:z.string().trim().toUpperCase().regex(/^[A-Z2-9]{6}$/).optional(),
});
export const chairJoinSchema=z.object({
  code:z.string().trim().toUpperCase().regex(/^[A-Z2-9]{6}$/),
  displayName:z.string().trim().max(80).optional(),
});
export const chairActSchema=z.object({
  id:z.string().trim().min(1).max(80),
  action:z.enum(['start','next','pause','resume','leave','note','ai-turn','call']),
  note:z.string().max(2000).optional(),
  message:z.string().trim().max(2000).optional(),
});
