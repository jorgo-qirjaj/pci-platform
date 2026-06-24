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

/**
 * Mock p53AI inference. Produces a calibrated synthetic score for the slide,
 * anchored (conceptually) to the on-slide OE / WT / NULL TriControl™ cell lines.
 */
export function runP53AI(c: Case, jitter = true): AiScore {
  const rnd = mulberry32(hashSeed(c.accession) + (jitter ? Math.floor(Math.random() * 1000) : 0));
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
      scoredAt: new Date().toISOString(),
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
    scoredAt: new Date().toISOString(),
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
