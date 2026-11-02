import { chairJoinSchema } from '@/lib/server/validation';
import { user, json, fail, sameOrigin, body } from '@/lib/server/http';
import { createServices } from '@/lib/server/compose';

export async function POST(request: Request) {
  try {
    sameOrigin(request);
    const actor = await user();
    const data = await body(request, chairJoinSchema);
    return json(await createServices().chairs.join(actor.userId, data.code, data.displayName || actor.displayName));
  } catch (error) {
    return fail(error);
  }
}
