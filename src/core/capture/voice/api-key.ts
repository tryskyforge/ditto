import { resolveAiKey } from '@/core/capture/ai/keys';
import { type VoiceProvider, WHISPER_SERVER_PROVIDER } from './transcribe';

export const VOICE_KEY_SETTINGS = [
  'voiceProvider',
  'voiceApiKey',
  'voiceBaseUrl',
  'voiceModel',
  'aiProvider',
  'aiApiKey',
  'aiApiKeys',
] as const;

export interface VoiceKeySettings {
  voiceProvider?: unknown;
  voiceApiKey?: unknown;
  voiceBaseUrl?: unknown;
  voiceModel?: unknown;
  aiProvider?: unknown;
  aiApiKey?: unknown;
  aiApiKeys?: unknown;
}

export type VoiceApiKeySource = 'voice' | 'ai' | 'none';

export interface ResolvedVoiceApiKey {
  provider: VoiceProvider;
  apiKey: string;
  source: VoiceApiKeySource;
  ready: boolean;
}

function trimmed(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

export function normalizeVoiceProvider(value: unknown): VoiceProvider {
  if (value === 'groq') return 'groq';
  if (value === WHISPER_SERVER_PROVIDER) return WHISPER_SERVER_PROVIDER;
  return 'openai';
}

export function voiceKeyRequired(provider: VoiceProvider): boolean {
  return provider !== WHISPER_SERVER_PROVIDER;
}

export function resolveVoiceApiKey(settings: VoiceKeySettings): ResolvedVoiceApiKey {
  const provider = normalizeVoiceProvider(settings.voiceProvider);
  const own = trimmed(settings.voiceApiKey);
  if (own) return { provider, apiKey: own, source: 'voice', ready: true };

  if (!voiceKeyRequired(provider)) return { provider, apiKey: '', source: 'none', ready: true };

  const resolved = resolveAiKey(settings);
  const shared = resolved.apiKey;
  const aiProvider = resolved.provider;
  if (provider !== 'openai' || aiProvider !== 'openai' || !shared) {
    return { provider, apiKey: '', source: 'none', ready: false };
  }

  return { provider, apiKey: shared, source: 'ai', ready: true };
}

export function isVoiceReady(settings: VoiceKeySettings): boolean {
  return resolveVoiceApiKey(settings).ready;
}
