import {
  FIXTURE_NOTICE,
  canTransitionActivity,
  type ActivityRecord,
  type ActivityStatus,
  type ConversationMessage,
  type ConversationRecord,
  type InterestId,
  type IntroAnswers,
  type IntroductionCard,
  type MoodEntry,
  type MoodKind,
  type ProviderDraft,
  type CircleMembership,
} from '@/lib/domain';

const KEY = 'saath-dev-fixtures-v1';

export type FixtureState = {
  notice: string;
  intro: IntroductionCard | null;
  reflections: string;
  blocks: string[];
  activities: ActivityRecord[];
  conversations: ConversationRecord[];
  providerDraft: ProviderDraft | null;
  circleMembership: Record<string, CircleMembership>;
  circleInterest: string[];
  moods: MoodEntry[];
  interests: InterestId[];
  quietThoughts: string;
};

const emptyIntro = (): IntroAnswers => ({
  beforeTalking: '',
  supportStyle: '',
  pace: '',
  offLimits: '',
  readiness: '',
});

function blank(): FixtureState {
  return {
    notice: FIXTURE_NOTICE,
    intro: null,
    reflections: '',
    blocks: [],
    activities: [],
    conversations: [demoConversation()],
    providerDraft: null,
    circleMembership: {},
    circleInterest: [],
    moods: [],
    interests: [],
    quietThoughts: '',
  };
}

function demoConversation(): ConversationRecord {
  return {
    id: 'fixture-conversation-preview',
    requestId: 'fixture-request-preview',
    title: 'Development fixture conversation',
    fixture: true,
    paused: false,
    left: false,
    blocked: false,
    messages: [
      {
        id: 'fixture-msg-1',
        clientKey: 'fixture-msg-1',
        sender: 'system',
        content: `${FIXTURE_NOTICE} There is no live participant on the other side.`,
        createdAt: new Date().toISOString(),
        status: 'sent',
      },
    ],
  };
}

function read(): FixtureState {
  if (typeof window === 'undefined') return blank();
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return blank();
    const parsed = JSON.parse(raw) as FixtureState;
    return {
      ...blank(),
      ...parsed,
      notice: FIXTURE_NOTICE,
      conversations: parsed.conversations?.length ? parsed.conversations : blank().conversations,
      moods: parsed.moods ?? [],
      interests: parsed.interests ?? [],
      quietThoughts: parsed.quietThoughts ?? '',
      activities: (parsed.activities ?? []).map(item => ({
        ...item,
        syncKind: item.syncKind ?? 'solo',
        syncEndsAt: item.syncEndsAt ?? '',
      })),
    };
  } catch {
    return blank();
  }
}

function write(next: FixtureState): FixtureState {
  const value = { ...next, notice: FIXTURE_NOTICE };
  window.localStorage.setItem(KEY, JSON.stringify(value));
  return value;
}

export function loadFixtures(): FixtureState {
  return read();
}

export function saveIntro(answers: IntroAnswers, completed: boolean): IntroductionCard {
  const state = read();
  const card: IntroductionCard = {
    answers,
    visibility: 'private',
    wordingApproved: false,
    updatedAt: new Date().toISOString(),
    completed,
  };
  write({ ...state, intro: card });
  return card;
}

export function emptyIntroAnswers(): IntroAnswers {
  return emptyIntro();
}

export function saveReflections(value: string): void {
  write({ ...read(), reflections: value });
}

export function toggleBlock(targetId: string): string[] {
  const state = read();
  const blocks = state.blocks.includes(targetId)
    ? state.blocks.filter(id => id !== targetId)
    : [...state.blocks, targetId];
  write({ ...state, blocks });
  return blocks;
}

export function isBlocked(targetId: string): boolean {
  return read().blocks.includes(targetId);
}

export function upsertActivity(record: ActivityRecord): ActivityRecord[] {
  const state = read();
  const activities = state.activities.some(item => item.id === record.id)
    ? state.activities.map(item => (item.id === record.id ? record : item))
    : [record, ...state.activities];
  write({ ...state, activities });
  return activities;
}

export function transitionActivity(id: string, status: ActivityStatus): ActivityRecord[] {
  const state = read();
  const activities = state.activities.map(item => {
    if (item.id !== id) return item;
    if (!canTransitionActivity(item.status, status)) return item;
    return { ...item, status, updatedAt: new Date().toISOString() };
  });
  write({ ...state, activities });
  return activities;
}

export function saveProviderDraft(draft: ProviderDraft): ProviderDraft {
  write({ ...read(), providerDraft: draft });
  return draft;
}

export function setCircleMembership(id: string, membership: CircleMembership): Record<string, CircleMembership> {
  const state = read();
  const circleMembership = { ...state.circleMembership, [id]: membership };
  write({ ...state, circleMembership });
  return circleMembership;
}

export function addCircleInterest(name: string): string[] {
  const state = read();
  const circleInterest = state.circleInterest.includes(name) ? state.circleInterest : [...state.circleInterest, name];
  write({ ...state, circleInterest });
  return circleInterest;
}

export function appendConversationMessage(conversationId: string, message: ConversationMessage): ConversationRecord | null {
  const state = read();
  let found: ConversationRecord | null = null;
  const conversations = state.conversations.map(item => {
    if (item.id !== conversationId) return item;
    if (item.left || item.blocked || item.paused) return item;
    if (item.messages.some(existing => existing.clientKey === message.clientKey)) {
      found = item;
      return item;
    }
    found = { ...item, messages: [...item.messages, message] };
    return found;
  });
  write({ ...state, conversations });
  return found;
}

export function updateConversation(conversationId: string, patch: Partial<ConversationRecord>): ConversationRecord | null {
  const state = read();
  let found: ConversationRecord | null = null;
  const conversations = state.conversations.map(item => {
    if (item.id !== conversationId) return item;
    found = { ...item, ...patch, id: item.id, fixture: true };
    return found;
  });
  write({ ...state, conversations });
  return found;
}

export function addMood(mood: MoodKind, note = ''): MoodEntry[] {
  const state = read();
  const entry: MoodEntry = {
    id: crypto.randomUUID(),
    mood,
    note: note.trim().slice(0, 400),
    createdAt: new Date().toISOString(),
  };
  const moods = [entry, ...state.moods].slice(0, 40);
  write({ ...state, moods });
  return moods;
}

export function saveInterests(interests: InterestId[]): InterestId[] {
  const unique = Array.from(new Set(interests));
  write({ ...read(), interests: unique });
  return unique;
}

export function saveQuietThoughts(value: string): void {
  write({ ...read(), quietThoughts: value.slice(0, 4000) });
}

export function suggestActivities(
  answers: IntroAnswers | null,
  extras?: { mood?: MoodKind | null; interests?: InterestId[] },
): { templateId: string; reason: string }[] {
  const suggestions: { templateId: string; reason: string }[] = [];
  if (extras?.mood === 'heavy' || extras?.mood === 'tender') {
    suggestions.push({
      templateId: 'shared-quiet-minute',
      reason: 'A short shared pause can sit beside a heavy or tender day.',
    });
  }
  if (extras?.mood === 'restless' || extras?.mood === 'unsure') {
    suggestions.push({
      templateId: 'what-i-carry',
      reason: 'One written thought can hold what is still unnamed.',
    });
  }
  if (extras?.interests?.includes('spiritual-life') || extras?.interests?.includes('quiet-sitting')) {
    suggestions.push({
      templateId: 'sit-together',
      reason: 'You marked quiet or spiritual sitting. This keeps two people on the same page.',
    });
  }
  if (answers?.readiness) {
    suggestions.push({
      templateId: 'one-small-step',
      reason: 'You named something you would like to feel more ready to do.',
    });
  }
  if (answers?.supportStyle) {
    suggestions.push({
      templateId: 'understand-my-support',
      reason: 'You already started describing the kind of support that helps.',
    });
  }
  if (answers?.beforeTalking) {
    suggestions.push({
      templateId: 'a-little-about-me',
      reason: 'You wrote something you might want someone to know.',
    });
  }
  if (!suggestions.length) {
    suggestions.push({
      templateId: 'find-the-words',
      reason: 'A short private draft is a gentle place to begin.',
    });
  }
  const seen = new Set<string>();
  return suggestions.filter(item => {
    if (seen.has(item.templateId)) return false;
    seen.add(item.templateId);
    return true;
  }).slice(0, 3);
}
