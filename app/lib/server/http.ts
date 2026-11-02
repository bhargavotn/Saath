import { getChatGPTUser } from '@/app/chatgpt-auth';
import { z } from 'zod';
import { isStatusError } from '../application/errors';
export class HttpError extends Error {
  status: number;
  code?: string;
  constructor(status: number, message: string, code?: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}
export const json = (data: unknown, status = 200) => Response.json(data, {status, headers: {'Cache-Control':'no-store'}});
export async function user() {
  const value = await getChatGPTUser();
  if (!value) throw new HttpError(401, 'Sign in to save your information.', 'AUTH_REQUIRED');
  return value;
}
export function sameOrigin(request: Request) {
  const origin = request.headers.get('origin');
  if (!origin || origin !== new URL(request.url).origin) throw new HttpError(403, 'This request must come from Saath.');
  if (!request.headers.get('content-type')?.includes('application/json') && request.method !== 'DELETE') throw new HttpError(415, 'Send JSON content.');
}
export async function body<T>(request: Request, schema: z.ZodType<T>): Promise<T> {
  const raw = await request.text();
  if (raw.length > 30000) throw new HttpError(413, 'Your message is too long.');
  let data: unknown;
  try { data = JSON.parse(raw); } catch { throw new HttpError(400, 'Invalid JSON.'); }
  const result = schema.safeParse(data);
  if (!result.success) throw new HttpError(400, result.error.issues[0]?.message || 'Invalid input.');
  return result.data;
}
export function fail(error: unknown) {
  if (isStatusError(error)) return json({error: error.message, code: error.code}, error.status);
  return json({error:'This action could not be completed. Please try again.'},500);
}
export const short = z.string().trim().min(1).max(160);
