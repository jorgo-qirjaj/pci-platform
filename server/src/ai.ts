import { AiScore, Biomarker, Case, ExpressionTone } from './types';

// Lightweight deterministic PRNG so a given accession scores consistently,
// with a small per-run jitter to mimic a real re-run of the model.
function hashSeed(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const round1 = (n: number) => Math.round(n * 10) / 10;

/** Bump when the scoring logic changes; stamped onto every score for traceability. */
export const MODEL_VERSION = 'p53AI-1.4.0';

export interface ScoreContext {
  /** Annotation/ROI the score is anchored to. */
  regionId: string;
  /** Capture magnification used. */
  magnification: number;
  /** Who initiated the run. */
  operator: string;
  /** Timestamp for this run (provenance only — does not affect the score). */
  scoredAt: string;
}

/**
 * Mock p53AI inference. The numeric result is a pure, deterministic function of
 * (accession, region, model version): re-running the same model on the same region
 * always reproduces the same score. No Math.random — only `ctx.scoredAt`/operator
 * vary per run, and those are provenance, not the result.
 */
export function runP53AI(c: Case, ctx: ScoreContext): AiScore {
  // Seed is fully determined by the inputs — reproducible by construction.
  const rnd = mulberry32(hashSeed(`${c.accession}|${ctx.regionId}|${MODEL_VERSION}`));
  const provenance = {
    scoredAt: ctx.scoredAt,
    modelVersion: MODEL_VERSION,
    regionId: ctx.regionId,
    magnification: ctx.magnification,
    operator: ctx.operator,
  };
  const total = 1980 + Math.floor(rnd() * 220); // ~2000–2200 nuclei

  if (c.biomarker === 'MMR') {
    // Categorical: proficient (intact) vs deficient (loss).
    const intact = rnd() > 0.25;
    const positive = intact ? Math.floor(total * (0.95 + rnd() * 0.04)) : Math.floor(total * (rnd() * 0.06));
    return {
      value: null,
      display: intact ? 'Intact' : 'Loss',
      pattern: intact ? 'MMR proficient (intact)' : 'MMR deficient (loss)',
      patternTone: intact ? 'wt' : 'oe',
      metric: 'Nuclear expression',
      positive,
      total,
      confidence: round1(95 + rnd() * 4),
      ...provenance,
    };
  }

  // Numeric biomarkers (p53 / PDL1 / HER2): bimodal around the positivity threshold.
  const high = hashSeed(c.accession) % 2 === 0; // stable per-accession class
  const value = high
    ? round1(72 + rnd() * 26) // overexpression / high positivity
    : round1(3 + rnd() * 22); // wild-type / low positivity
  const positive = Math.round((total * value) / 100);

  let pattern: string;
  let patternTone: ExpressionTone;
  if (c.biomarker === 'p53') {
    pattern = high ? 'Overexpression (mutant)' : 'Wild-type';
    patternTone = high ? 'oe' : 'wt';
  } else {
    pattern = high ? 'High expression' : 'Low / negative';
    patternTone = high ? 'oe' : 'wt';
  }

  return {
    value,
    display: `${value}%`,
    pattern,
    patternTone,
    metric: metricFor(c.biomarker),
    positive,
    total,
    confidence: round1(90 + rnd() * 8),
    ...provenance,
  };
}

export function metricFor(biomarker: Biomarker): string {
  switch (biomarker) {
    case 'p53':
      return 'Positive nuclei (TPS)';
    case 'PDL1':
      return 'Tumor proportion score';
    case 'HER2':
      return 'Membrane completeness';
    case 'MMR':
      return 'Nuclear expression';
  }
}
