import { getChatGPTUser } from '@/app/chatgpt-auth';
import { backendCapabilities } from '@/lib/server/compose';
import { json } from '@/lib/server/http';

export async function GET() {
  const actor = await getChatGPTUser();
  const capabilities = backendCapabilities();
  return json({
    authenticated: Boolean(actor),
    displayName: actor?.displayName ?? null,
    userId: actor?.userId ?? null,
    aiConfigured: capabilities.aiConfigured,
    encryption: capabilities.encryption,
    voiceConfigured: capabilities.voiceConfigured,
    pairing: capabilities.pairing,
    twoChairs: capabilities.twoChairs,
    persistence: capabilities.persistence,
  });
}
