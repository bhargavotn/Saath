import { reportSchema } from '@/lib/server/validation';
import { user, json, fail, sameOrigin, body } from '@/lib/server/http';
import { createServices } from '@/lib/server/compose';

export async function POST(request: Request) {
  try {
    sameOrigin(request);
    const actor = await user();
    const data = await body(request, reportSchema);
    return json(await createServices().reports.submit(actor.userId, data), 201);
  } catch (error) {
    return fail(error);
  }
}
