import type { ElementMeta } from './types';

export type MessageType = 'PING' | 'CAPTURE_SCREENSHOT' | 'GET_STATE';

export interface PingMessage {
  type: 'PING';
}
export interface PingResponse {
  alive: boolean;
}

export interface CaptureScreenshotMessage {
  type: 'CAPTURE_SCREENSHOT';
  tabId: number;
  stepId: string;
}
export interface CaptureScreenshotResponse {
  screenshotId: string;
}

export interface GetStateMessage {
  type: 'GET_STATE';
}
export interface GetStateResponse {
  state: string;
}

export interface StartRecordingMessage {
  type: 'START_RECORDING';
  url: string;
}
export interface StopRecordingMessage {
  type: 'STOP_RECORDING';
}
export interface UserActionMessage {
  type: 'USER_ACTION';
  guideId: string;
  action: 'click' | 'input' | 'scroll';
  elementMeta: ElementMeta;
}
export interface SpaNavigateMessage {
  type: 'URL_CHANGED';
  url: string;
  guideId: string;
}

export type ExtensionMessage =
  | PingMessage
  | CaptureScreenshotMessage
  | GetStateMessage
  | StartRecordingMessage
  | StopRecordingMessage
  | UserActionMessage
  | SpaNavigateMessage;
