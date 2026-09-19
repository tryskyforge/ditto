import type { VoiceStatusResponse } from './voice-messages';

export type VoiceStopAction = 'stop-host' | 'recover' | 'report-lost' | 'skip';

export function isVoiceStatus(value: unknown): value is VoiceStatusResponse {
  if (typeof value !== 'object' || value === null) return false;
  const candidate = value as Partial<VoiceStatusResponse>;
  return typeof candidate.recording === 'boolean' && typeof candidate.transcribing === 'boolean';
}

export function handedOffPcm(value: unknown): Int16Array | null {
  if (value instanceof Int16Array) return value.length > 0 ? value : null;
  if (value instanceof ArrayBuffer) return value.byteLength > 0 ? new Int16Array(value) : null;
  if (ArrayBuffer.isView(value)) {
    return value.byteLength > 0 ? new Int16Array(value.buffer, value.byteOffset, value.byteLength / 2) : null;
  }
  return null;
}

export function voiceStopAction(input: {
  hostAlive: boolean;
  hasOrphanAudio: boolean;
  wasRecording: boolean;
}): VoiceStopAction {
  if (input.hasOrphanAudio) return 'recover';
  if (input.hostAlive) return 'stop-host';
  return input.wasRecording ? 'report-lost' : 'skip';
}
