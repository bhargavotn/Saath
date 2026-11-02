import { rehearsalSchema as schema } from '@/lib/server/validation';
import { user, json, fail, sameOrigin, body } from '@/lib/server/http';
import { createServices } from '@/lib/server/compose';

export async function POST(request: Request) {
  try {
    sameOrigin(request);
    const actor = await user();
    const data = await body(request, schema);
    return json(await createServices().rehearsal.reply(actor.userId, data));
  } catch (error) {
    return fail(error);
  }
}
