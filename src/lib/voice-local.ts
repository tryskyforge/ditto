import type { VoiceRequest } from './voice-messages';

export interface LocalVoiceHost {
  handle(request: VoiceRequest): Promise<unknown>;
}

let host: LocalVoiceHost | null = null;

export function setLocalVoiceHost(next: LocalVoiceHost | null): void {
  host = next;
}

export function localVoiceHost(): LocalVoiceHost | null {
  return host;
}
