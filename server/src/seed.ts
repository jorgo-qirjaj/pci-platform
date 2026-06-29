import { randomUUID } from 'crypto';
import { Case, User } from './types';

// Tenants. Access to every case is scoped to the caller's labId.
export const PRIMARY_LAB_ID = 'LAB-PCI-HOUSTON';
export const SECONDARY_LAB_ID = 'LAB-NORTHSHORE'; // a separate lab, used to prove tenant isolation

// bcrypt hash of the demo password "123456789" (shared by both demo users).
const DEMO_PASSWORD_HASH = '$2b$10$p/CUH1z.emFvzNEz2Y9EDu7deqtrGnnT2HunQh8xEQ9k0LSZoJ5S6';

export const USERS: User[] = [
  {
    email: 'jandersen@pcibio.com',
    passwordHash: DEMO_PASSWORD_HASH,
    name: 'John Andersen',
    role: 'Pathologist',
    initials: 'JA',
    labId: PRIMARY_LAB_ID,
  },
  {
    // A pathologist at a different lab. Sees only their own lab's cases.
    email: 'rkhan@northshore.example',
    passwordHash: DEMO_PASSWORD_HASH,
    name: 'Riya Khan',
    role: 'Pathologist',
    initials: 'RK',
    labId: SECONDARY_LAB_ID,
  },
];

// Standard whole-slide metadata shared by the demo Aperio scans.
// PDL1 scans are captured at ≤20× (its clinical cap); other biomarkers at 40×.
function slide(file: string, status: 'uploading' | 'ready' = 'ready', magnification = 40) {
  return {
    file,
    vendor: 'Aperio',
    objective: `${magnification}x`,
    magnification,
    dimensions: '126,976 × 73,728',
    sizeBytes: 2_298_000_000, // ~2.14 GB
    levels: 13,
    status,
  };
}

function fileName(biomarker: string, accession: string) {
  return `${biomarker}-${accession.slice(-5)}.svs`;
}

// Mirrors the design-system mock cases, expanded into the full domain model.
// id + labId are stamped on below so we don't repeat them on every entry.
const SEED_CASE_DATA: Omit<Case, 'id' | 'labId'>[] = [
  {
    accession: 'PCI-2026-00142',
    biomarker: 'p53',
    site: 'HCA Houston · Clear Lake',
    specimen: 'Prostate, needle core biopsy',
    block: '00142-B',
    submitted: '2026-06-19',
    received: '2026-06-17',
    status: 'ai-ready',
    pathologist: 'John Andersen, DO',
    slide: slide(fileName('p53', 'PCI-2026-00142')),
    controls: { OE: true, WT: true, NULL: true },
    annotations: [
      { id: 'ROI-1', microns: 325 },
      { id: 'ROI-2', microns: 210 },
    ],
    ai: {
      value: 87.4,
      display: '87.4%',
      pattern: 'Overexpression (mutant)',
      patternTone: 'oe',
      metric: 'Positive nuclei (TPS)',
      positive: 1842,
      total: 2108,
      confidence: 94.2,
      scoredAt: '2026-06-20T14:12:00Z',
    },
  },
  {
    accession: 'PCI-2026-00141',
    biomarker: 'PDL1',
    site: 'Baylor St. Luke’s',
    specimen: 'Lung, core biopsy',
    block: '00141-A',
    submitted: '2026-06-18',
    received: '2026-06-16',
    status: 'review',
    pathologist: 'John Andersen, DO',
    slide: slide(fileName('PDL1', 'PCI-2026-00141'), 'ready', 20),
    controls: { OE: true, WT: true, NULL: false },
    annotations: [{ id: 'ROI-1', microns: 280 }],
    ai: null,
  },
  {
    accession: 'PCI-2026-00140',
    biomarker: 'p53',
    site: 'MD Anderson',
    specimen: 'Colon, resection',
    block: '00140-C',
    submitted: '2026-06-17',
    received: '2026-06-15',
    status: 'complete',
    pathologist: 'John Andersen, DO',
    slide: slide(fileName('p53', 'PCI-2026-00140')),
    controls: { OE: true, WT: true, NULL: true },
    annotations: [{ id: 'ROI-1', microns: 190 }],
    ai: {
      value: 12.1,
      display: '12.1%',
      pattern: 'Wild-type',
      patternTone: 'wt',
      metric: 'Positive nuclei (TPS)',
      positive: 248,
      total: 2049,
      confidence: 96.1,
      scoredAt: '2026-06-18T09:30:00Z',
    },
  },
  {
    accession: 'PCI-2026-00139',
    biomarker: 'HER2',
    site: 'HCA Houston · Clear Lake',
    specimen: 'Breast, core biopsy',
    block: '00139-A',
    submitted: '2026-06-16',
    received: '2026-06-14',
    status: 'uploading',
    pathologist: 'John Andersen, DO',
    slide: slide(fileName('HER2', 'PCI-2026-00139'), 'uploading'),
    controls: { OE: false, WT: false, NULL: false },
    annotations: [],
    ai: null,
  },
  {
    accession: 'PCI-2026-00138',
    biomarker: 'MMR',
    site: 'Memorial Hermann',
    specimen: 'Endometrium, biopsy',
    block: '00138-B',
    submitted: '2026-06-15',
    received: '2026-06-13',
    status: 'complete',
    pathologist: 'John Andersen, DO',
    slide: slide(fileName('MMR', 'PCI-2026-00138')),
    controls: { OE: true, WT: true, NULL: true },
    annotations: [{ id: 'ROI-1', microns: 240 }],
    ai: {
      value: null,
      display: 'Intact',
      pattern: 'MMR proficient (intact)',
      patternTone: 'wt',
      metric: 'Nuclear expression',
      positive: 1990,
      total: 2031,
      confidence: 97.4,
      scoredAt: '2026-06-16T11:05:00Z',
    },
  },
  {
    accession: 'PCI-2026-00137',
    biomarker: 'p53',
    site: 'Baylor St. Luke’s',
    specimen: 'Bladder, TURBT',
    block: '00137-D',
    submitted: '2026-06-14',
    received: '2026-06-12',
    status: 'ai-scored',
    pathologist: 'John Andersen, DO',
    slide: slide(fileName('p53', 'PCI-2026-00137')),
    controls: { OE: true, WT: true, NULL: true },
    annotations: [
      { id: 'ROI-1', microns: 410 },
      { id: 'ROI-2', microns: 165 },
    ],
    ai: {
      value: 94.0,
      display: '94.0%',
      pattern: 'Overexpression (mutant)',
      patternTone: 'oe',
      metric: 'Positive nuclei (TPS)',
      positive: 1976,
      total: 2102,
      confidence: 95.8,
      scoredAt: '2026-06-15T16:40:00Z',
    },
  },
  {
    accession: 'PCI-2026-00136',
    biomarker: 'PDL1',
    site: 'MD Anderson',
    specimen: 'Head & neck, biopsy',
    block: '00136-A',
    submitted: '2026-06-13',
    received: '2026-06-11',
    status: 'active',
    pathologist: 'John Andersen, DO',
    slide: slide(fileName('PDL1', 'PCI-2026-00136'), 'ready', 20),
    controls: { OE: true, WT: true, NULL: false },
    annotations: [],
    ai: null,
  },
];

// All seed cases belong to the primary lab; each gets an opaque id.
export const SEED_CASES: Case[] = SEED_CASE_DATA.map((c) => ({
  id: randomUUID(),
  labId: PRIMARY_LAB_ID,
  ...c,
}));
