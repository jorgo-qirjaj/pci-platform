// Negatives-first triage for the Report worklist (ticket 505).
//
// ⚠️ PROVISIONAL — this is a UI placeholder, NOT a clinical decision. It buckets
// cases from the *existing* AI scores so the worklist has structure today. When
// John's real AI model lands, replace `triageBucket` (and CLEAR_CONFIDENCE) with
// its output. No case is ever auto-cleared clinically here — "cleared by AI" only
// means "de-prioritized in the UI, still one click from a full report".

import type { AiScore, Case } from './types';

export type TriageBucket = 'review' | 'cleared' | 'signed';

/** Provisional confidence bar for auto-clearing a negative. */
export const CLEAR_CONFIDENCE = 95;

/**
 * True when the AI pattern is abnormal and warrants a human look.
 * 'wt' (p53 wild-type / MMR-intact) is the normal/negative pattern; 'oe'
 * (overexpression) and 'null' (complete absence) are aberrant.
 */
export function isAberrant(ai: AiScore): boolean {
  return ai.patternTone !== 'wt';
}

/** Which worklist bucket a case belongs in. */
export function triageBucket(c: Case): TriageBucket {
  if (c.status === 'complete') return 'signed';
  if (!c.ai) return 'review'; // in the worklist but unscored → a human decides
  if (!isAberrant(c.ai) && c.ai.confidence >= CLEAR_CONFIDENCE) return 'cleared';
  return 'review';
}

/**
 * Short, human reason a case is flagged for review — drives the row chip.
 * Kept compact (the pattern + confidence are already shown in their own columns).
 */
export function reviewReason(c: Case): { label: string; tone: 'pos' | 'warn' } {
  if (!c.ai) return { label: 'Awaiting AI', tone: 'warn' };
  if (isAberrant(c.ai)) return { label: 'Aberrant', tone: 'pos' };
  if (c.ai.confidence < CLEAR_CONFIDENCE) return { label: 'Uncertain', tone: 'warn' };
  return { label: 'Flagged', tone: 'warn' };
}

/** Confidence-meter fill color (independent of bucket). */
export function confidenceColor(confidence: number): string {
  if (confidence >= 90) return 'var(--teal-500)';
  if (confidence >= 70) return 'var(--amber-500)';
  return 'var(--red-600)';
}
