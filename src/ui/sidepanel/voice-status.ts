import type { VoiceErrorReason } from '@/lib/voice-messages';

export const SPEAKING_HOLD_MS = 1200;
export const LEVEL_STALE_MS = 1500;
export const MIC_BAR_MIN_SCALE = 0.14;

export interface MicBar {
  id: string;
  weight: number;
}

export const MIC_BARS: MicBar[] = [
  { id: 'far-left', weight: 0.45 },
  { id: 'left', weight: 0.75 },
  { id: 'center', weight: 1 },
  { id: 'right', weight: 0.75 },
  { id: 'far-right', weight: 0.45 },
];

export type MicActivity = 'waiting' | 'speaking' | 'quiet';

export const MIC_ACTIVITIES: MicActivity[] = ['waiting', 'speaking', 'quiet'];

const MIC_ACTIVITY_KEYS: Record<MicActivity, string> = {
  waiting: 'voice.micStarting',
  speaking: 'voice.micHearing',
  quiet: 'voice.micQuiet',
};

export function micActivityKey(activity: MicActivity): string {
  return MIC_ACTIVITY_KEYS[activity];
}

export function micActivity(levelAt: number | null, speakingAt: number | null, now: number): MicActivity {
  if (levelAt === null) return 'waiting';
  if (speakingAt !== null && now - speakingAt <= SPEAKING_HOLD_MS) return 'speaking';
  return 'quiet';
}

export function micBarScale(level: number, weight: number): number {
  const bounded = Number.isFinite(level) ? Math.min(1, Math.max(0, level)) : 0;
  return MIC_BAR_MIN_SCALE + (1 - MIC_BAR_MIN_SCALE) * bounded * weight;
}

const VOICE_ERROR_KEYS: Record<VoiceErrorReason, string> = {
  'permission-denied': 'voice.errorPermissionDenied',
  'no-device': 'voice.errorNoDevice',
  'no-audio': 'voice.errorNoAudio',
  'missing-api-key': 'voice.errorMissingApiKey',
  'stream-ended': 'voice.errorStreamEnded',
  'not-recording': 'voice.errorNotRecording',
  'already-recording': 'voice.errorAlreadyRecording',
  unsupported: 'voice.errorUnsupported',
  unknown: 'voice.errorUnknown',
};

export function voiceErrorKey(reason: VoiceErrorReason | undefined): string {
  const key = reason === undefined ? undefined : VOICE_ERROR_KEYS[reason];
  return key ?? VOICE_ERROR_KEYS.unknown;
}

export function narratedKey(narrated: number): string {
  if (narrated <= 0) return 'voice.narratedNone';
  return narrated === 1 ? 'voice.narrated' : 'voice.narratedPlural';
}
