import type { PanelVoiceUpdate } from '@/lib/port';
import { narratedKey, voiceErrorKey } from '@/ui/sidepanel/voice-status';

export const VOICE_CONFIRM_MS = 7000;

export type VoiceNoticeTone = 'progress' | 'done' | 'failed';

export interface VoiceNotice {
  tone: VoiceNoticeTone;
  signature: string;
  titleKey: string;
  titleSubstitutions?: string[];
  bodyKey?: string;
  showSettings: boolean;
  autoDismissMs: number | null;
}

export function voiceSignature(update: PanelVoiceUpdate): string {
  return `${update.phase}:${update.reason ?? ''}:${update.narrated ?? ''}`;
}

export function voiceNotice(update: PanelVoiceUpdate, seenLive: boolean): VoiceNotice | null {
  const signature = voiceSignature(update);

  if (update.phase === 'transcribing') {
    return {
      tone: 'progress',
      signature,
      titleKey: 'voice.transcribing',
      bodyKey: 'voice.transcribingHint',
      showSettings: false,
      autoDismissMs: null,
    };
  }

  if (update.phase === 'error') {
    return {
      tone: 'failed',
      signature,
      titleKey: voiceErrorKey(update.reason),
      bodyKey: 'voice.guideSafe',
      showSettings: update.reason === 'missing-api-key',
      autoDismissMs: null,
    };
  }

  if (update.phase !== 'idle' || update.narrated === undefined || !seenLive) return null;

  return {
    tone: 'done',
    signature,
    titleKey: narratedKey(update.narrated),
    titleSubstitutions: update.narrated > 0 ? [String(update.narrated)] : undefined,
    showSettings: false,
    autoDismissMs: VOICE_CONFIRM_MS,
  };
}
