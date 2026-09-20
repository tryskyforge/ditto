export const SYSTEM_DEFAULT_VALUE = 'ditto-system-default';

const GENERIC_DEVICE_IDS = new Set(['default', 'communications']);

export interface MicrophoneOption {
  deviceId: string;
  label: string;
}

export type MicrophoneListState = 'no-devices' | 'unlabelled' | 'ready';

export type MicrophoneDevice = Pick<MediaDeviceInfo, 'kind' | 'deviceId' | 'label'>;

function audioInputs(devices: readonly MicrophoneDevice[]): MicrophoneDevice[] {
  return devices.filter((device) => device.kind === 'audioinput');
}

export function toMicrophoneOptions(devices: readonly MicrophoneDevice[]): MicrophoneOption[] {
  const seen = new Set<string>();
  const options: MicrophoneOption[] = [];
  for (const device of audioInputs(devices)) {
    const deviceId = device.deviceId.trim();
    if (!deviceId || GENERIC_DEVICE_IDS.has(deviceId) || seen.has(deviceId)) continue;
    seen.add(deviceId);
    options.push({ deviceId, label: device.label.trim() });
  }
  return options;
}

export function microphoneListState(devices: readonly MicrophoneDevice[]): MicrophoneListState {
  const inputs = audioInputs(devices);
  if (inputs.length === 0) return 'no-devices';
  const withheld = inputs.some((device) => !device.deviceId.trim() || !device.label.trim());
  return withheld ? 'unlabelled' : 'ready';
}

export type MicrophonePermission = PermissionState | 'unknown';

export type MicrophoneStatus = 'allowed' | 'blocked' | 'pending';

export function microphoneStatus(permission: MicrophonePermission, list: MicrophoneListState): MicrophoneStatus {
  if (permission === 'denied') return 'blocked';
  if (permission === 'granted' || list === 'ready') return 'allowed';
  return 'pending';
}

export function toSelectValue(storedId: string): string {
  return storedId.trim() || SYSTEM_DEFAULT_VALUE;
}

export function toStoredMicrophoneId(value: string): string {
  return value === SYSTEM_DEFAULT_VALUE ? '' : value.trim();
}

export function isMicrophoneMissing(storedId: string, options: readonly MicrophoneOption[]): boolean {
  const id = storedId.trim();
  if (!id) return false;
  return !options.some((option) => option.deviceId === id);
}

const LEVEL_FLOOR_DB = -60;
const SPEAKING_FLOOR_DB = -45;
const LEVEL_SMOOTHING = 0.6;

export const SPEAKING_LEVEL = (SPEAKING_FLOOR_DB - LEVEL_FLOOR_DB) / -LEVEL_FLOOR_DB;

export function nextMicLevel(rms: number, previous: number): number {
  const db = rms > 0 ? 20 * Math.log10(rms) : LEVEL_FLOOR_DB;
  const normalised = Math.min(1, Math.max(0, (db - LEVEL_FLOOR_DB) / -LEVEL_FLOOR_DB));
  return previous * LEVEL_SMOOTHING + normalised * (1 - LEVEL_SMOOTHING);
}
