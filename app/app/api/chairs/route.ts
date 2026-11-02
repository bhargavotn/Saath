import { chairActSchema, chairCreateSchema } from '@/lib/server/validation';
import { user, json, fail, sameOrigin, body } from '@/lib/server/http';
import { createServices } from '@/lib/server/compose';

const services = () => createServices();

export async function GET(request: Request) {
  try {
    const actor = await user();
    const id = new URL(request.url).searchParams.get('id');
    if (id) return json(await services().chairs.read(actor.userId, id));
    return json(await services().chairs.list(actor.userId));
  } catch (error) {
    return fail(error);
  }
}

export async function POST(request: Request) {
  try {
    sameOrigin(request);
    const actor = await user();
    const data = await body(request, chairCreateSchema);
    return json(await services().chairs.create(actor.userId, {
      mode: data.mode,
      displayName: data.displayName || actor.displayName,
      pairingCode: data.pairingCode,
    }), 201);
  } catch (error) {
    return fail(error);
  }
}

export async function PATCH(request: Request) {
  try {
    sameOrigin(request);
    const actor = await user();
    const data = await body(request, chairActSchema);
    return json(await services().chairs.act(actor.userId, data));
  } catch (error) {
    return fail(error);
  }
}
