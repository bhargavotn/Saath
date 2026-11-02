import { env } from 'cloudflare:workers';

type VoiceEnv = {
  LIVEKIT_URL?: string;
  LIVEKIT_API_KEY?: string;
  LIVEKIT_API_SECRET?: string;
};

export function voiceConfig() {
  const values = env as unknown as VoiceEnv;
  return {
    url: values.LIVEKIT_URL,
    key: values.LIVEKIT_API_KEY,
    secret: values.LIVEKIT_API_SECRET,
  };
}

export function voiceReady() {
  const config = voiceConfig();
  return Boolean(config.url && config.key && config.secret);
}
