import { enrollSchema, roleSchema } from '@/lib/server/validation';
import { user, json, fail, sameOrigin, body } from '@/lib/server/http';
import { createServices } from '@/lib/server/compose';

const services = () => createServices();

export async function GET() {
  try {
    const actor = await user();
    return json(await services().profiles.read(actor.userId));
  } catch (error) {
    return fail(error);
  }
}

export async function PUT(request: Request) {
  try {
    sameOrigin(request);
    const actor = await user();
    const data = await body(request, enrollSchema);
    return json(await services().profiles.enroll(actor.userId, {
      ...data,
      displayName: data.displayName || actor.displayName,
    }));
  } catch (error) {
    return fail(error);
  }
}

export async function PATCH(request: Request) {
  try {
    sameOrigin(request);
    const actor = await user();
    const data = await body(request, roleSchema);
    return json(await services().profiles.switchRole(actor.userId, data.activeRole));
  } catch (error) {
    return fail(error);
  }
}
