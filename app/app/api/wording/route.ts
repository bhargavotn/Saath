import { wordingSchema } from '@/lib/server/validation';
import { user, json, fail, sameOrigin, body } from '@/lib/server/http';
import { createServices } from '@/lib/server/compose';

export async function POST(request: Request) {
  try {
    sameOrigin(request);
    await user();
    const data = await body(request, wordingSchema);
    return json(await createServices().wording.suggest(data.text));
  } catch (error) {
    return fail(error);
  }
}
