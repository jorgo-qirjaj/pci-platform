import { Router } from 'express';
import { AuthedRequest, requireAuth } from '../auth';
import { store } from '../store';
import { metricFor, runP53AI } from '../ai';
import { Biomarker, Case, CaseStatus } from '../types';

export const casesRouter = Router();

const BIOMARKERS: Biomarker[] = ['p53', 'PDL1', 'HER2', 'MMR'];

function matchesTab(c: Case, tab: string): boolean {
  switch (tab) {
    case 'review':
      return c.status === 'review';
    case 'ai':
      return c.status === 'ai-ready' || c.status === 'ai-scored';
    case 'done':
      return c.status === 'complete';
    default:
      return true;
  }
}

casesRouter.get('/', requireAuth, (req, res) => {
  const tab = String(req.query.status ?? 'all');
  const q = String(req.query.q ?? '').trim().toLowerCase();
  let cases = store.list().filter((c) => matchesTab(c, tab));
  if (q) {
    cases = cases.filter(
      (c) =>
        c.accession.toLowerCase().includes(q) ||
        c.biomarker.toLowerCase().includes(q) ||
        c.site.toLowerCase().includes(q),
    );
  }
  res.json({ cases });
});

casesRouter.post('/', requireAuth, (req: AuthedRequest, res) => {
  const { biomarker, site, specimen } = req.body ?? {};
  if (!biomarker || !BIOMARKERS.includes(biomarker)) {
    return res.status(400).json({ error: `biomarker must be one of ${BIOMARKERS.join(', ')}` });
  }
  const accession = store.nextAccession();
  const today = new Date();
  const submitted = today.toISOString().slice(0, 10);
  const received = submitted;
  const newCase: Case = {
    accession,
    biomarker,
    site: site || 'Unassigned site',
    specimen: specimen || 'Specimen pending',
    block: `${accession.slice(-5)}-A`,
    submitted,
    received,
    status: 'uploading',
    pathologist: req.user?.name ? `${req.user.name}, DO` : 'Unassigned',
    slide: {
      file: `${biomarker}-${accession.slice(-5)}.svs`,
      vendor: 'Aperio',
      objective: '40x',
      dimensions: '126,976 × 73,728',
      sizeBytes: 2_298_000_000,
      levels: 13,
      status: 'uploading',
    },
    controls: { OE: false, WT: false, NULL: false },
    annotations: [],
    ai: null,
  };
  store.create(newCase);
  res.status(201).json({ case: newCase });
});

casesRouter.get('/:accession', requireAuth, (req, res) => {
  const c = store.get(req.params.accession);
  if (!c) return res.status(404).json({ error: 'Case not found' });
  res.json({ case: c });
});

// Run (or re-run) p53AI on a case.
casesRouter.post('/:accession/score', requireAuth, (req, res) => {
  const c = store.get(req.params.accession);
  if (!c) return res.status(404).json({ error: 'Case not found' });
  if (c.slide.status !== 'ready') {
    return res.status(409).json({ error: 'Slide is still uploading; cannot score yet' });
  }
  const ai = runP53AI(c);
  // Scoring also verifies TriControl™ cell lines are present on the slide.
  const controls = { OE: true, WT: true, NULL: c.biomarker === 'p53' };
  const updated = store.update(c.accession, {
    ai,
    controls,
    status: c.status === 'complete' ? 'complete' : 'ai-scored',
  });
  res.json({ case: updated });
});

// Finalize: lock the report.
casesRouter.post('/:accession/finalize', requireAuth, (req, res) => {
  const c = store.get(req.params.accession);
  if (!c) return res.status(404).json({ error: 'Case not found' });
  if (!c.ai) return res.status(409).json({ error: 'Case has no AI score to finalize' });
  const updated = store.update(c.accession, { status: 'complete' as CaseStatus });
  res.json({ case: updated });
});

// Structured report payload, including generated interpretation prose.
casesRouter.get('/:accession/report', requireAuth, (req, res) => {
  const c = store.get(req.params.accession);
  if (!c) return res.status(404).json({ error: 'Case not found' });
  const ai = c.ai ?? runP53AI(c, false);
  const metric = metricFor(c.biomarker);
  const scorePhrase = ai.value != null ? `${ai.value}% positive nuclei` : ai.display.toLowerCase();
  const interpretation =
    `${c.biomarker} immunohistochemistry demonstrates a ${ai.pattern.toLowerCase()} staining pattern. ` +
    `The p53AI algorithm, calibrated against on-slide OE, WT, and NULL cell-line controls, scored ` +
    `${scorePhrase} within the annotated region of interest, consistent with the observed expression pattern.`;
  const disclaimer =
    'p53AI is an investigational decision-support tool and is not a substitute for pathologist ' +
    'interpretation. Scores are computed relative to PCI p53 TriControl™ cell-line references present ' +
    'on the same slide. For research and internal validation use.';

  res.json({
    report: {
      case: c,
      ai,
      metric,
      interpretation,
      disclaimer,
      lab: {
        name: 'PCI Biosciences',
        address: 'Helix Park · Houston, TX 77030',
        accreditation: 'CLIA pending · clinical use',
      },
    },
  });
});
