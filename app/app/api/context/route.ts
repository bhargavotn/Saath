import { contextSchema as schema } from '@/lib/server/validation';
import { user, json, fail, sameOrigin, body } from '@/lib/server/http';
import { createServices } from '@/lib/server/compose';

const services = () => createServices();

export async function GET() {
  try {
    const actor = await user();
    return json(await services().context.read(actor.userId));
  } catch (error) {
    return fail(error);
  }
}

export async function PUT(request: Request) {
  try {
    sameOrigin(request);
    const actor = await user();
    const data = await body(request, schema);
    return json(await services().context.save(actor.userId, data));
  } catch (error) {
    return fail(error);
  }
}

export async function DELETE(request: Request) {
  try {
    sameOrigin(request);
    const actor = await user();
    return json(await services().context.remove(actor.userId));
  } catch (error) {
    return fail(error);
  }
}
