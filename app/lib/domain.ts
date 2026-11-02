export const FIXTURE_NOTICE =
  'Development fixture — stored in this browser only. Not production persistence, not a live person, and not a completed integration.';

export const SAMPLE_PROFILE_NOTICE =
  'Fictional AI personality. This is not a person, therapist, or available participant. It cannot accept a live request.';

export const SAMPLE_PROVIDER_IDS = ['sample-meera', 'sample-arjun', 'sample-isha', 'sample-kabir'] as const;

export function isSampleProviderId(id: string): boolean {
  return (SAMPLE_PROVIDER_IDS as readonly string[]).includes(id);
}

export type View =
  | 'home'
  | 'connect'
  | 'circles'
  | 'rehearsal'
  | 'chairs'
  | 'space'
  | 'activities'
  | 'intro'
  | 'onboard'
  | 'conversation'
  | 'enroll'
  | 'arrive'
  | 'assessment'
  | 'sanctuary';

export type EnrollmentRole = 'client' | 'listener';

export type EnrollmentProfile = {
  displayName: string;
  clientEnrolled: boolean;
  listenerEnrolled: boolean;
  activeRole: EnrollmentRole;
  pairingCode: string | null;
  updatedAt: string;
};

export type EncryptionStatus = {
  atRest: boolean;
  endToEnd: false;
  algorithm: 'AES-256-GCM' | null;
  detail: string;
};

export type ProviderRole = 'Peer listener' | 'Counsellor';
export type RequestStatus = 'pending' | 'accepted' | 'declined' | 'cancelled' | 'expired';
export type RequestAction = 'cancel' | 'accept' | 'decline';
export type CommMode = 'chat' | 'voice' | 'video';
export type ShareMode = 'private' | 'ask-first';
export type ActivityStatus = 'not-started' | 'in-progress' | 'done' | 'skipped' | 'archived';
export type ChairMode = 'same-device' | 'fictional-rehearsal' | 'remote';
export type ChairStage =
  | 'agree'
  | 'a-speaks'
  | 'b-reflects'
  | 'a-clarifies'
  | 'switch'
  | 'b-speaks'
  | 'a-reflects'
  | 'b-clarifies'
  | 'closing';
export type SupportStyle = 'listening' | 'reflection' | 'suggestions' | 'ask-first';
export type PacePreference = 'time-to-think' | 'gentle-questions' | 'talking-freely';
export type CircleMembership = 'none' | 'requested' | 'approved' | 'left';
export type SoundChoice = 'rain' | 'brown' | 'stereo';
export type MoodKind = 'steady' | 'heavy' | 'restless' | 'tender' | 'unsure';
export type InterestId =
  | 'quiet-sitting'
  | 'spiritual-life'
  | 'family'
  | 'work'
  | 'finding-words'
  | 'alongside';

export type MoodEntry = {
  id: string;
  mood: MoodKind;
  note: string;
  createdAt: string;
};

export type Person = {
  id: string;
  name: string;
  role: ProviderRole;
  kind: 'ai-persona' | 'counselor' | 'peer-listener';
  domain: string;
  specialty: string;
  intro: string;
  languages: string[];
  topics: string[];
  price: number;
  initials: string;
  color: string;
  modes: CommMode[];
  availabilityLabel: string;
  actuallyAvailable: boolean;
  sample?: boolean;
  avatarUrl?: string;
  rating?: number;
  experienceYears?: number;
  isVerified?: boolean;
};

export type SessionRequest = {
  id: string;
  providerId: string;
  providerName: string;
  topic: string;
  context: string;
  mode: CommMode;
  status: RequestStatus;
  createdAt: string;
};

export type IntroAnswers = {
  beforeTalking: string;
  supportStyle: SupportStyle | '';
  pace: PacePreference | '';
  offLimits: string;
  readiness: string;
};

export type IntroductionCard = {
  answers: IntroAnswers;
  visibility: 'private';
  wordingApproved: boolean;
  updatedAt: string;
  completed: boolean;
};

export type ActivityRecord = {
  id: string;
  templateId: string;
  title: string;
  purpose: string;
  instructions: string;
  estimatedMinutes: number;
  visibility: 'private' | 'shared-draft' | 'shared';
  dueDate: string;
  status: ActivityStatus;
  response: string;
  publishedResponse: string;
  sharedWith: string;
  invitationStatus: 'none' | 'pending' | 'accepted' | 'declined';
  syncKind: 'solo' | 'same-device' | 'paired';
  syncEndsAt: string;
  updatedAt: string;
};

export type ConversationMessage = {
  id: string;
  clientKey: string;
  sender: 'you' | 'counterpart' | 'system';
  content: string;
  createdAt: string;
  status: 'sent' | 'failed' | 'pending';
};

export type ConversationRecord = {
  id: string;
  requestId: string;
  title: string;
  fixture: true;
  paused: boolean;
  left: boolean;
  blocked: boolean;
  messages: ConversationMessage[];
};

export type ProviderDraft = {
  displayName: string;
  introduction: string;
  languages: string;
  topics: string;
  role: ProviderRole | '';
  modes: CommMode[];
  price: string;
  availability: string;
  submittedAt: string;
};

export type CircleRecord = {
  id: string;
  name: string;
  topic: string;
  description: string;
  facilitator: string;
  capacity: number;
  language: string;
  schedule: string;
  timezone: string;
  guidelines: string[];
  operating: false;
  membership: CircleMembership;
};

export type UrgentResource = {
  region: string;
  name: string;
  url: string;
  reviewedOn: string;
  note: string;
};

export const REQUEST_TRANSITIONS: Record<RequestStatus, RequestStatus[]> = {
  pending: ['accepted', 'declined', 'cancelled', 'expired'],
  accepted: [],
  declined: [],
  cancelled: [],
  expired: [],
};

export const ACTIVITY_TRANSITIONS: Record<ActivityStatus, ActivityStatus[]> = {
  'not-started': ['in-progress', 'skipped', 'archived'],
  'in-progress': ['done', 'skipped', 'archived', 'not-started'],
  done: ['archived', 'in-progress'],
  skipped: ['not-started', 'archived'],
  archived: ['not-started'],
};

export const CHAIR_SEQUENCE: ChairStage[] = [
  'agree',
  'a-speaks',
  'b-reflects',
  'a-clarifies',
  'switch',
  'b-speaks',
  'a-reflects',
  'b-clarifies',
  'closing',
];

export function nextChairStage(current: ChairStage): ChairStage | 'done' {
  const index = CHAIR_SEQUENCE.indexOf(current);
  if (index < 0 || index >= CHAIR_SEQUENCE.length - 1) return 'done';
  return CHAIR_SEQUENCE[index + 1];
}

export function chairSpeaker(stage: ChairStage): 'a' | 'b' | 'both' {
  if (stage === 'agree' || stage === 'switch' || stage === 'closing') return 'both';
  return stage.startsWith('b-') ? 'b' : 'a';
}

export function canTransitionRequest(from: RequestStatus, to: RequestStatus): boolean {
  return REQUEST_TRANSITIONS[from].includes(to);
}

export function canTransitionActivity(from: ActivityStatus, to: ActivityStatus): boolean {
  return ACTIVITY_TRANSITIONS[from].includes(to);
}

export function composeIntroduction(answers: IntroAnswers): string {
  const lines = [
    answers.beforeTalking && `Before we talk: ${answers.beforeTalking}`,
    answers.supportStyle && `How I would like to be supported: ${labelSupport(answers.supportStyle)}`,
    answers.pace && `Conversation pace: ${labelPace(answers.pace)}`,
    answers.offLimits && `Please do not discuss: ${answers.offLimits}`,
    answers.readiness && `I would like to feel more ready to: ${answers.readiness}`,
  ].filter(Boolean);
  return lines.join('\n') || 'No introduction details yet.';
}

export function labelSupport(value: SupportStyle | ''): string {
  switch (value) {
    case 'listening':
      return 'Listening';
    case 'reflection':
      return 'Reflection';
    case 'suggestions':
      return 'Suggestions';
    case 'ask-first':
      return 'Ask me first';
    default:
      return 'Not specified';
  }
}

export function labelMood(value: MoodKind): string {
  switch (value) {
    case 'steady':
      return 'Steady';
    case 'heavy':
      return 'Heavy';
    case 'restless':
      return 'Restless';
    case 'tender':
      return 'Tender';
    case 'unsure':
      return 'Unsure';
  }
}

export function labelPace(value: PacePreference | ''): string {
  switch (value) {
    case 'time-to-think':
      return 'Time to think';
    case 'gentle-questions':
      return 'Gentle questions';
    case 'talking-freely':
      return 'Talking freely';
    default:
      return 'Not specified';
  }
}

export function isActiveRequest(status: RequestStatus): boolean {
  return status === 'pending' || status === 'accepted';
}

export const REQUEST_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000;

export class LifecycleError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export function applyRequestAction(status: RequestStatus, action: RequestAction, actor: 'owner' | 'recipient' | 'system'): RequestStatus {
  if (action === 'cancel') {
    if (actor !== 'owner') throw new LifecycleError(403, 'Only the person who sent this request can cancel it.');
    if (!canTransitionRequest(status, 'cancelled')) throw new LifecycleError(409, `A ${status} request cannot be cancelled.`);
    return 'cancelled';
  }
  if (action === 'accept' || action === 'decline') {
    if (actor !== 'recipient') {
      throw new LifecycleError(
        403,
        'Only the recipient can accept or decline. Sample profiles cannot act, and users cannot grant themselves an accepted connection.',
      );
    }
    const next = action === 'accept' ? 'accepted' : 'declined';
    if (!canTransitionRequest(status, next)) throw new LifecycleError(409, `A ${status} request cannot be ${next}.`);
    return next;
  }
  throw new LifecycleError(400, 'Unknown request action.');
}

export function expireIfNeeded(status: RequestStatus, createdAt: string, now = Date.now(), windowMs = REQUEST_EXPIRY_MS): RequestStatus {
  if (status !== 'pending') return status;
  const created = Date.parse(createdAt);
  if (Number.isNaN(created) || now - created < windowMs) return status;
  return 'expired';
}
