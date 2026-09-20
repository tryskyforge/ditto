import { rejectReason } from './filter';
import {
  type AbsoluteSeconds,
  absoluteSeconds,
  type Batch,
  type StepWindow,
  type TranscriptionResponse,
} from './types';

export function makeToAbsolute(batch: Batch): (batchTime: number) => AbsoluteSeconds {
  const bounds: { offset: number; start: number; length: number }[] = [];
  let elapsed = 0;
  for (const s of batch.segments) {
    bounds.push({ offset: elapsed, start: s.start, length: s.end - s.start });
    elapsed += s.end - s.start;
  }
  return (batchTime) => {
    for (const b of bounds) {
      if (batchTime <= b.offset + b.length) {
        return absoluteSeconds(b.start + (batchTime - b.offset));
      }
    }
    const last = bounds[bounds.length - 1];
    return absoluteSeconds(last ? last.start + last.length : batchTime);
  };
}

export interface AssignResult {
  byStep: Map<string, string[]>;
  verbatim: number;
  split: number;
  rejected: number;
}

export function assignSegments(response: TranscriptionResponse, batch: Batch, steps: StepWindow[]): AssignResult {
  const toAbsolute = makeToAbsolute(batch);
  const byStep = new Map<string, string[]>();
  const add = (stepId: string, text: string) => {
    if (!text) return;
    const existing = byStep.get(stepId);
    if (existing) existing.push(text);
    else byStep.set(stepId, [text]);
  };

  let verbatim = 0;
  let split = 0;
  let rejected = 0;

  for (const segment of response.segments ?? []) {
    if (rejectReason(segment)) {
      rejected += 1;
      continue;
    }
    const start = toAbsolute(segment.start);
    const end = toAbsolute(segment.end);
    const spanned = steps.filter((s) => start < s.to && end > s.from);

    if (spanned.length <= 1) {
      const step = spanned[0] ?? steps.find((s) => start >= s.from && start <= s.to);
      if (step) {
        add(step.stepId, segment.text.trim());
        verbatim += 1;
      }
      continue;
    }

    split += 1;
    const grouped = new Map<string, string[]>();
    for (const word of response.words ?? []) {
      if (word.start < segment.start || word.start > segment.end) continue;
      const at = toAbsolute(word.start);
      const step = steps.find((s) => at >= s.from && at <= s.to) ?? spanned[spanned.length - 1];
      const existing = grouped.get(step.stepId);
      if (existing) existing.push(word.word.trim());
      else grouped.set(step.stepId, [word.word.trim()]);
    }
    for (const [stepId, words] of grouped) add(stepId, words.join(' ').trim());
  }

  return { byStep, verbatim, split, rejected };
}
