import { requestSchema as schema, requestPatchSchema } from '@/lib/server/validation';
import { user, json, fail, sameOrigin, body } from '@/lib/server/http';
import { createServices } from '@/lib/server/compose';

const services = () => createServices();

export async function GET() {
  try {
    const actor = await user();
    return json(await services().requests.list(actor.userId));
  } catch (error) {
    return fail(error);
  }
}

export async function POST(request: Request) {
  try {
    sameOrigin(request);
    const actor = await user();
    const { consent: _consent, providerId, providerName, pairingCode, ...data } = await body(request, schema);
    return json(await services().requests.create(actor.userId, {
      ...data,
      providerId: providerId ?? '',
      providerName: providerName ?? '',
      pairingCode,
    }), 201);
  } catch (error) {
    return fail(error);
  }
}

export async function PATCH(request: Request) {
  try {
    sameOrigin(request);
    const actor = await user();
    const data = await body(request, requestPatchSchema);
    return json(await services().requests.change(actor.userId, data));
  } catch (error) {
    return fail(error);
  }
}
