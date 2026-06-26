// Domain model for the PCI Pathology Platform.
// De-identified: cases are keyed by accession number, never patient names.

export type Biomarker = 'p53' | 'PDL1' | 'HER2' | 'MMR';

export type CaseStatus =
  | 'uploading'
  | 'active'
  | 'review'
  | 'ai-ready'
  | 'ai-scored'
  | 'complete'
  | 'critical';

export type ExpressionTone = 'oe' | 'wt' | 'null';

export interface ControlSet {
  OE: boolean;
  WT: boolean;
  NULL: boolean;
}

export interface SlideMeta {
  file: string;
  vendor: string;
  objective: string;
  dimensions: string;
  sizeBytes: number;
  levels: number;
  status: 'uploading' | 'ready';
}

export interface Annotation {
  id: string;
  microns: number;
  /** Region location in OpenSeadragon viewport coordinates (present for drawn ROIs). */
  rect?: { x: number; y: number; width: number; height: number };
}

export interface AiScore {
  /** Numeric percent when applicable (p53/PDL1/HER2); null for categorical results (MMR). */
  value: number | null;
  /** Display string used in tables and headlines, e.g. "87.4%" or "Intact". */
  display: string;
  pattern: string;
  patternTone: ExpressionTone;
  metric: string;
  positive: number;
  total: number;
  confidence: number;
  scoredAt: string;
}

export interface Case {
  accession: string;
  biomarker: Biomarker;
  site: string;
  specimen: string;
  block: string;
  submitted: string; // ISO date
  received: string; // ISO date
  status: CaseStatus;
  pathologist: string;
  slide: SlideMeta;
  controls: ControlSet;
  annotations: Annotation[];
  ai: AiScore | null;
}

export interface User {
  email: string;
  passwordHash: string; // bcrypt hash — never store plaintext
  name: string;
  role: string;
  initials: string;
}

export interface PublicUser {
  email: string;
  name: string;
  role: string;
  initials: string;
}
