import type { Person } from '@/lib/domain';

export function localActor(): 'host' | 'guest' {
  if (typeof window === 'undefined') return 'host';
  return window.sessionStorage.getItem('saath-local-actor') === 'guest' ? 'guest' : 'host';
}

export function setLocalActor(actor: 'host' | 'guest') {
  if (typeof window === 'undefined') return;
  if (actor === 'guest') window.sessionStorage.setItem('saath-local-actor', 'guest');
  else window.sessionStorage.removeItem('saath-local-actor');
}

export async function api<T = Record<string, unknown>>(path: string, method = 'GET', body?: unknown): Promise<T> {
  const headers: Record<string, string> = {};
  if (body) headers['Content-Type'] = 'application/json';
  if (typeof window !== 'undefined' && localActor() === 'guest') {
    headers['x-saath-local-actor'] = 'guest';
  }
  const response = await fetch(path, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = (await response.json()) as T & { error?: string };
  if (!response.ok) throw new Error(data.error || 'Something went wrong. Please try again.');
  return data;
}

// -----------------------------------------------------------------------------
// Django Microservice Client (Option 1 Integration)
// -----------------------------------------------------------------------------
export const DJANGO_API_BASE =
  typeof window !== 'undefined' && (window as unknown as { __DJANGO_API_URL__?: string }).__DJANGO_API_URL__
    ? (window as unknown as { __DJANGO_API_URL__: string }).__DJANGO_API_URL__
    : 'http://127.0.0.1:8000/api';

export async function djangoApi<T = Record<string, unknown>>(endpoint: string, method = 'GET', body?: unknown): Promise<T> {
  const url = `${DJANGO_API_BASE}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
  const headers: Record<string, string> = {
    Accept: 'application/json',
  };
  if (body) {
    headers['Content-Type'] = 'application/json';
  }

  const response = await fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    throw new Error(`Django API error: ${response.status} ${response.statusText}`);
  }
  return (await response.json()) as T;
}

export type DjangoCounselor = {
  id: string;
  name: string;
  qualification: string;
  avatar: string;
  languages: string[];
  specialties: string[];
  rate_per_min: number;
  rate_per_hour: number;
  rating: number;
  reviews_count: number;
  is_available_now: boolean;
  trust_story: string;
  experience_years: number;
  is_verified: boolean;
};

export async function fetchLiveCounselors(specialty?: string): Promise<Person[]> {
  try {
    const query = specialty && specialty !== 'all' ? `?specialty=${encodeURIComponent(specialty)}` : '';
    const res = await djangoApi<{ status: string; counselors: DjangoCounselor[] }>(`/counselors/${query}`);
    if (!res.counselors || !Array.isArray(res.counselors)) return [];

    return res.counselors.map((c, index) => {
      const palette = ['peach', 'sage', 'blue', 'yellow'] as const;
      const color = palette[index % palette.length];
      const initials = c.name
        .replace(/^(Dr\.|Counselor)\s+/i, '')
        .split(' ')
        .map(p => p[0])
        .join('')
        .slice(0, 2)
        .toUpperCase();

      return {
        id: `django-counselor-${c.id}`,
        name: c.name,
        role: 'Counsellor',
        kind: 'counselor',
        domain: c.specialties.join(' • '),
        specialty: c.qualification,
        intro: c.trust_story || `${c.qualification} with ${c.experience_years} years experience.`,
        languages: c.languages,
        topics: c.specialties,
        price: c.rate_per_hour,
        initials: initials || 'CO',
        color,
        modes: ['chat', 'voice'],
        availabilityLabel: c.is_available_now ? 'Available online now' : 'Schedule session',
        actuallyAvailable: c.is_available_now,
        sample: false,
        avatarUrl: c.avatar,
        rating: c.rating,
        experienceYears: c.experience_years,
        isVerified: c.is_verified,
      };
    });
  } catch {
    // If Django is unreachable, caller can safely fall back to sample fixtures
    return [];
  }
}

export type DjangoTraumaStory = {
  id: string;
  alias: string;
  category: string;
  language: string;
  content: string;
  reactions_count: number;
  created_at: string;
};

export async function fetchTraumaFeed(): Promise<DjangoTraumaStory[]> {
  try {
    const res = await djangoApi<{ status: string; stories: DjangoTraumaStory[] }>('/trauma-feed/');
    return res.stories || [];
  } catch {
    return [];
  }
}

export async function reactTraumaStory(storyId: string): Promise<number> {
  const res = await djangoApi<{ status: string; new_count: number }>(`/trauma-feed/${storyId}/react/`, 'POST');
  return res.new_count;
}

export async function postTraumaStory(content: string, category: string): Promise<DjangoTraumaStory> {
  const res = await djangoApi<{ status: string; story: DjangoTraumaStory }>('/trauma-feed/create/', 'POST', {
    content,
    category,
  });
  return res.story;
}

export type DjangoTriageResult = {
  status: string;
  reply: string;
  mood_acknowledged: string;
  recommended_counselor: string;
  grounding_technique: string;
};

export async function submitTriageMessage(message: string, mood?: string): Promise<DjangoTriageResult> {
  return await djangoApi<DjangoTriageResult>('/triage/', 'POST', { message, mood: mood || 'Overwhelmed' });
}

export type DjangoTraumaGroup = {
  id: string;
  title: string;
  domain: string;
  emoji: string;
  active_participants: number;
  description: string;
  ground_rules: string;
  room_type: string;
  host: string;
  status: string;
};

export async function fetchTraumaGroups(): Promise<DjangoTraumaGroup[]> {
  try {
    const res = await djangoApi<{ status: string; groups: DjangoTraumaGroup[] }>('/trauma-groups/');
    return res.groups || [];
  } catch {
    return [];
  }
}

export type ClinicalAssessmentResult = {
  status: string;
  score: number;
  max_score: number;
  severity: string;
  clinical_tier: string;
  anxiety_subscale: { score: number; max: number; label: string };
  depression_subscale: { score: number; max: number; label: string };
  burnout_subscale: { score: number; max: number; label: string };
  interpretation: string;
  recommendation: string;
  recommended_intervention: string;
  matched_counselor: string;
  action_cta: string;
};

export async function evaluateAssessment(answers: Record<string, number>): Promise<ClinicalAssessmentResult> {
  return await djangoApi<ClinicalAssessmentResult>('/assessment/evaluate/', 'POST', answers);
}

export type AssessmentHistoryItem = {
  id: string;
  score: number;
  max_score: number;
  severity: string;
  clinical_tier: string;
  anxiety_score: number;
  depression_score: number;
  burnout_score: number;
  interpretation: string;
  recommendation: string;
  matched_counselor: string;
  date: string;
};

export async function fetchAssessmentHistory(): Promise<AssessmentHistoryItem[]> {
  try {
    const res = await djangoApi<{ status: string; history: AssessmentHistoryItem[] }>('/assessment/history/');
    return res.history || [];
  } catch {
    return [];
  }
}

export type UserSessionRequest = {
  id: string;
  providerId: string;
  providerName: string;
  topic: string;
  context: string;
  mode: 'chat' | 'voice' | 'video';
  status: 'pending' | 'accepted' | 'declined' | 'cancelled';
  createdAt: string;
};

export async function fetchRequests(): Promise<UserSessionRequest[]> {
  try {
    const res = await djangoApi<{ status: string; requests: UserSessionRequest[] }>('/requests/');
    return res.requests || [];
  } catch {
    return [];
  }
}

export async function createSessionRequest(data: {
  providerId: string;
  providerName: string;
  topic: string;
  context: string;
  mode: string;
}): Promise<UserSessionRequest> {
  const res = await djangoApi<{ status: string; request: UserSessionRequest }>('/requests/', 'POST', data);
  return res.request;
}

export async function updateSessionRequestAction(requestId: string, action: 'accept' | 'decline' | 'cancel'): Promise<UserSessionRequest> {
  const res = await djangoApi<{ status: string; request: UserSessionRequest }>(`/requests/${requestId}/`, 'PATCH', { action });
  return res.request;
}

export type UserContextData = {
  content: string;
  shareMode: 'private' | 'ask-first';
  reflections: string;
  updatedAt: string;
};

export async function fetchUserContext(): Promise<UserContextData> {
  try {
    const res = await djangoApi<{ status: string; context: UserContextData }>('/context/');
    return res.context || { content: '', shareMode: 'private', reflections: '', updatedAt: '' };
  } catch {
    return { content: '', shareMode: 'private', reflections: '', updatedAt: '' };
  }
}

export async function saveUserContext(data: { content?: string; shareMode?: string; reflections?: string }): Promise<UserContextData> {
  const res = await djangoApi<{ status: string; context: UserContextData }>('/context/', 'PUT', data);
  return res.context;
}

export async function clearUserContext(): Promise<void> {
  await djangoApi('/context/', 'DELETE');
}

export type MoodRecord = {
  id: string;
  mood: 'steady' | 'heavy' | 'restless' | 'tender' | 'unsure';
  note: string;
  createdAt: string;
};

export async function fetchMoodRecords(): Promise<MoodRecord[]> {
  try {
    const res = await djangoApi<{ status: string; moods: MoodRecord[] }>('/moods/');
    return res.moods || [];
  } catch {
    return [];
  }
}

export async function saveMoodRecord(mood: string, note?: string): Promise<MoodRecord> {
  const res = await djangoApi<{ status: string; entry: MoodRecord }>('/moods/', 'POST', { mood, note: note || '' });
  return res.entry;
}

export type UserProfileRecord = {
  id: string;
  displayName: string;
  email: string;
  activeRole: 'client' | 'listener';
  clientEnrolled: boolean;
  listenerEnrolled: boolean;
  pairingCode: string;
  bio: string;
  updatedAt: string;
};

export async function fetchProfileRecord(): Promise<UserProfileRecord | null> {
  try {
    const res = await djangoApi<{ status: string; profile: UserProfileRecord }>('/profile/');
    return res.profile || null;
  } catch {
    return null;
  }
}

export async function saveProfileRecord(data: Partial<UserProfileRecord>): Promise<UserProfileRecord> {
  const res = await djangoApi<{ status: string; profile: UserProfileRecord }>('/profile/', 'PUT', data);
  return res.profile;
}

export async function joinPodChannel(groupId: string, mode?: string): Promise<{ channel: string; assigned_alias: string; message: string }> {
  return await djangoApi(`/trauma-groups/${groupId}/join/`, 'POST', { mode: mode || 'LISTENER' });
}

