import { normalizeBaseUrl } from '@/core/capture/ai/models';
import type { TranscriptionResponse } from './types';

export type VoiceProvider = 'openai' | 'groq' | 'whisperServer';

export const WHISPER_SERVER_PROVIDER: VoiceProvider = 'whisperServer';
export const WHISPER_SERVER_DEFAULT_BASE_URL = 'http://localhost:8000/v1';
export const WHISPER_SERVER_DEFAULT_MODEL = 'whisper-1';

export interface TranscribeConfig {
  provider: VoiceProvider;
  apiKey: string;
  language?: string;
  baseUrl?: string;
  model?: string;
}

const PROVIDERS: Partial<Record<VoiceProvider, { url: string; model: string }>> = {
  openai: { url: 'https://api.openai.com/v1/audio/transcriptions', model: 'whisper-1' },
  groq: { url: 'https://api.groq.com/openai/v1/audio/transcriptions', model: 'whisper-large-v3' },
};

export function whisperServerBase(baseUrl?: string): string {
  return normalizeBaseUrl(baseUrl?.trim() || WHISPER_SERVER_DEFAULT_BASE_URL);
}

const ERROR_BODY_LIMIT = 200;

export function createTranscriber(config: TranscribeConfig): (wav: Blob) => Promise<TranscriptionResponse> {
  const preset = PROVIDERS[config.provider];
  const url = preset ? preset.url : `${whisperServerBase(config.baseUrl)}/audio/transcriptions`;
  const model = preset ? preset.model : config.model?.trim() || WHISPER_SERVER_DEFAULT_MODEL;

  return async (wav: Blob): Promise<TranscriptionResponse> => {
    const form = new FormData();
    form.append('file', wav, 'audio.wav');
    form.append('model', model);
    form.append('response_format', 'verbose_json');
    form.append('timestamp_granularities[]', 'word');
    form.append('timestamp_granularities[]', 'segment');
    form.append('temperature', '0');
    if (config.language) form.append('language', config.language);

    const response = await fetch(url, {
      method: 'POST',
      headers: config.apiKey ? { Authorization: `Bearer ${config.apiKey}` } : {},
      body: form,
    });

    if (!response.ok) {
      const body = await response.text().catch(() => '');
      throw new Error(`Transcription failed with ${response.status}: ${body.slice(0, ERROR_BODY_LIMIT)}`);
    }

    const result = (await response.json()) as TranscriptionResponse;
    if (!Array.isArray(result.segments)) {
      throw new Error('Transcription response has no segments; verbose_json is required');
    }

    return result;
  };
}
