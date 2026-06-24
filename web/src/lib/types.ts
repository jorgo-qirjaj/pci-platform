// Mirror of the server domain model (the API is the source of truth).

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
}

export interface AiScore {
  value: number | null;
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
  submitted: string;
  received: string;
  status: CaseStatus;
  pathologist: string;
  slide: SlideMeta;
  controls: ControlSet;
  annotations: Annotation[];
  ai: AiScore | null;
}

export interface User {
  email: string;
  name: string;
  role: string;
  initials: string;
}

export interface Stats {
  activeCases: number;
  pendingReview: number;
  aiScored: number;
  avgTurnaroundHours: number;
}

export interface ReportPayload {
  case: Case;
  ai: AiScore;
  metric: string;
  interpretation: string;
  disclaimer: string;
  lab: { name: string; address: string; accreditation: string };
}
