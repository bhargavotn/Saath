import { env } from 'cloudflare:workers';
type AIEnv = {AI_API_KEY?:string;AI_BASE_URL?:string;AI_MODEL?:string};
export function aiConfig() {
 const values = env as unknown as AIEnv;
 return {key:values.AI_API_KEY, base:values.AI_BASE_URL || 'https://api.openai.com/v1', model:values.AI_MODEL};
}
export function aiReady() {const c=aiConfig();return Boolean(c.key && c.model);}
