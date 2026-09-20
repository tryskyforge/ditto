import type { VideoResolution } from '@/core/export/options';

export const FRAME_WIDTH = 1280;
export const FRAME_HEIGHT = 720;

export const FRAME_FILL = '#0B0A1F';

export const FPS = 30;
export const STEP_ZOOMED_OUT_SEC = 1.5;
export const STEP_ZOOM_TRANSITION_SEC = 0.73;
export const STEP_ZOOMED_IN_SEC = 3;
export const STEP_SECONDS = STEP_ZOOMED_OUT_SEC + STEP_ZOOM_TRANSITION_SEC + STEP_ZOOMED_IN_SEC;

export interface ResolutionSpec {
  width: number;
  height: number;
  avc: string;
  vp9: string;
}

export const RESOLUTION_SPECS: Record<VideoResolution, ResolutionSpec> = {
  '720p': { width: 1280, height: 720, avc: 'avc1.64001f', vp9: 'vp09.00.31.08' },
  '1080p': { width: 1920, height: 1080, avc: 'avc1.640028', vp9: 'vp09.00.40.08' },
};

export const AVC_CODEC = RESOLUTION_SPECS['720p'].avc;
export const VP9_CODEC = RESOLUTION_SPECS['720p'].vp9;

export type VideoContainer = 'mp4' | 'webm';

async function encodes(codec: string, width: number, height: number): Promise<boolean> {
  try {
    const { supported } = await VideoEncoder.isConfigSupported({ codec, width, height });
    return Boolean(supported);
  } catch {
    return false;
  }
}

async function probe(spec: ResolutionSpec): Promise<VideoContainer | null> {
  if (typeof VideoEncoder === 'undefined') return null;
  if (await encodes(spec.avc, spec.width, spec.height)) return 'mp4';
  return (await encodes(spec.vp9, spec.width, spec.height)) ? 'webm' : null;
}

const pending = new Map<VideoResolution, Promise<VideoContainer | null>>();

export function pickContainer(resolution: VideoResolution = '720p'): Promise<VideoContainer | null> {
  const cached = pending.get(resolution);
  if (cached) return cached;
  const next = probe(RESOLUTION_SPECS[resolution]);
  pending.set(resolution, next);
  return next;
}

export async function canExportVideo(): Promise<boolean> {
  return (await pickContainer()) !== null;
}
