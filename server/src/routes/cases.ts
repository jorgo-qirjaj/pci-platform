import { Router } from 'express';
import { randomUUID } from 'crypto';
import { AuthedRequest, requireAuth } from '../auth';
import { store } from '../store';
import { metricFor, runP53AI } from '../ai';
import { Annotation, Biomarker, Case, CaseStatus, ControlSet } from '../types';
import { CreateCaseSchema, ScoreBodySchema, parseBody } from '../validation';

export const casesRouter = Router();

/**
 * Fetch a case only if it belongs to the caller's lab. Returns null when the case
 * is absent OR owned by another tenant — handlers return 404 in both cases, so a
 * caller cannot tell "exists but not yours" from "doesn't exist" (no IDOR oracle).
 */
function findOwned(req: AuthedRequest, accession: string): Case | null {
  const c = store.get(accession);
  if (!c || c.labId !== req.user?.labId) return null;
  return c;
}

// Per-biomarker maximum capture magnification (clinical cap), enforced at scoring.
const MAX_MAGNIFICATION: Record<Biomarker, number> = { p53: 40, PDL1: 20, HER2: 40, MMR: 40 };

// On-slide TriControl™ cell lines each biomarker's QC requires to be present.
function requiredControls(b: Biomarker): (keyof ControlSet)[] {
  return b === 'p53' ? ['OE', 'WT', 'NULL'] : ['OE', 'WT'];
}

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

casesRouter.get('/', requireAuth, (req: AuthedRequest, res) => {
  const tab = String(req.query.status ?? 'all');
  const q = String(req.query.q ?? '').trim().toLowerCase();
  // Scope every listing to the caller's lab before any other filtering.
  let cases = store.list().filter((c) => c.labId === req.user?.labId && matchesTab(c, tab));
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
  const body = parseBody(CreateCaseSchema, req.body, res);
  if (!body) return;
  const { biomarker, site, specimen } = body;
  const accession = store.nextAccession();
  const today = new Date();
  const submitted = today.toISOString().slice(0, 10);
  const received = submitted;
  const newCase: Case = {
    id: randomUUID(),
    labId: req.user!.labId,
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
      objective: `${biomarker === 'PDL1' ? 20 : 40}x`,
      magnification: biomarker === 'PDL1' ? 20 : 40,
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

casesRouter.get('/:accession', requireAuth, (req: AuthedRequest, res) => {
  const c = findOwned(req, req.params.accession);
  if (!c) return res.status(404).json({ error: 'Case not found' });
  res.json({ case: c });
});

// Run (or re-run) p53AI on a case.
casesRouter.post('/:accession/score', requireAuth, (req: AuthedRequest, res) => {
  const c = findOwned(req, req.params.accession);
  if (!c) return res.status(404).json({ error: 'Case not found' });
  if (c.status === 'complete') {
    return res.status(409).json({ error: 'Case is finalized and locked; its report is immutable' });
  }
  if (c.slide.status !== 'ready') {
    return res.status(409).json({ error: 'Slide is still uploading; cannot score yet' });
  }

  // H5: a score must be anchored to a region of interest.
  if (c.annotations.length === 0) {
    return res.status(409).json({ error: 'Draw a region of interest first; a score must be anchored to a region.' });
  }
  const scoreBody = parseBody(ScoreBodySchema, req.body ?? {}, res);
  if (!scoreBody) return;
  const regionId = scoreBody.regionId ?? c.annotations[0].id;
  if (!c.annotations.some((a) => a.id === regionId)) {
    return res.status(404).json({ error: `Region ${regionId} not found on this case` });
  }

  // H2: QC hard gate — the required TriControl™ cell lines must actually be present.
  const missing = requiredControls(c.biomarker).filter((k) => !c.controls[k]);
  if (missing.length > 0) {
    return res.status(409).json({
      error: `QC failed: required TriControl™ cell line(s) not detected (${missing.join(', ')}). Scoring is blocked until controls pass.`,
    });
  }

  // H3: magnification hard gate — must not exceed the biomarker's clinical cap.
  const cap = MAX_MAGNIFICATION[c.biomarker];
  if (c.slide.magnification > cap) {
    return res.status(409).json({
      error: `Capture magnification ${c.slide.magnification}× exceeds the ${cap}× limit for ${c.biomarker}; scoring is blocked.`,
    });
  }

  // Deterministic, versioned, region-anchored score; prior runs are retained (not overwritten).
  const ai = runP53AI(c, {
    regionId,
    magnification: c.slide.magnification,
    operator: req.user?.name ?? 'Unknown',
    scoredAt: new Date().toISOString(),
  });
  const scoreHistory = [...(c.scoreHistory ?? []), ai];
  const updated = store.update(c.accession, { ai, scoreHistory, status: 'ai-scored' });
  res.json({ case: updated });
});

// Finalize: lock the report.
casesRouter.post('/:accession/finalize', requireAuth, (req: AuthedRequest, res) => {
  const c = findOwned(req, req.params.accession);
  if (!c) return res.status(404).json({ error: 'Case not found' });
  if (!c.ai) return res.status(409).json({ error: 'Case has no AI score to finalize' });
  const updated = store.update(c.accession, { status: 'complete' as CaseStatus });
  res.json({ case: updated });
});

// Append an annotation (region of interest) to a case.
casesRouter.post('/:accession/annotations', requireAuth, (req: AuthedRequest, res) => {
  const c = findOwned(req, req.params.accession);
  if (!c) return res.status(404).json({ error: 'Case not found' });
  const { microns, rect, type, points, text } = req.body ?? {};
  const micronsNum = Number(microns);
  if (!Number.isFinite(micronsNum) || micronsNum <= 0) {
    return res.status(400).json({ error: 'microns must be a positive number' });
  }
  const validRect =
    rect && typeof rect === 'object' && ['x', 'y', 'width', 'height'].every((k) => Number.isFinite(Number(rect[k])));
  const validPoints =
    Array.isArray(points) &&
    points.length > 0 &&
    points.every((p) => p && Number.isFinite(Number(p.x)) && Number.isFinite(Number(p.y)));
  const validType = ['rect', 'line', 'freehand', 'polygon', 'point'].includes(type)
    ? (type as Annotation['type'])
    : undefined;
  const annotation: Annotation = {
    id: `ROI-${c.annotations.length + 1}`,
    microns: Math.round(micronsNum),
    ...(validType ? { type: validType } : {}),
    ...(validRect
      ? { rect: { x: Number(rect.x), y: Number(rect.y), width: Number(rect.width), height: Number(rect.height) } }
      : {}),
    ...(validPoints ? { points: points.map((p: { x: number; y: number }) => ({ x: Number(p.x), y: Number(p.y) })) } : {}),
    ...(typeof text === 'string' && text.trim() ? { text: text.trim() } : {}),
  };
  const updated = store.update(c.accession, { annotations: [...c.annotations, annotation] });
  res.status(201).json({ case: updated });
});

// Delete an annotation from a case.
casesRouter.delete('/:accession/annotations/:annotationId', requireAuth, (req: AuthedRequest, res) => {
  const c = findOwned(req, req.params.accession);
  if (!c) return res.status(404).json({ error: 'Case not found' });
  const next = c.annotations.filter((a) => a.id !== req.params.annotationId);
  if (next.length === c.annotations.length) {
    return res.status(404).json({ error: 'Annotation not found' });
  }
  const updated = store.update(c.accession, { annotations: next });
  res.json({ case: updated });
});

// Structured report payload, including generated interpretation prose.
casesRouter.get('/:accession/report', requireAuth, (req: AuthedRequest, res) => {
  const c = findOwned(req, req.params.accession);
  if (!c) return res.status(404).json({ error: 'Case not found' });
  if (!c.ai) {
    return res.status(409).json({ error: 'Case has no AI score yet; run p53AI before generating a report' });
  }
  const ai = c.ai;
  const metric = metricFor(c.biomarker);
  const scorePhrase = ai.value != null ? `${ai.value}% positive nuclei` : ai.display.toLowerCase();
  const region = ai.regionId ? `region ${ai.regionId}` : 'the annotated region of interest';
  const magPhrase = ai.magnification ? ` at ${ai.magnification}×` : '';
  const modelPhrase = ai.modelVersion ? ` (${ai.modelVersion})` : '';
  const interpretation =
    `${c.biomarker} immunohistochemistry demonstrates a ${ai.pattern.toLowerCase()} staining pattern. ` +
    `The p53AI algorithm${modelPhrase}, calibrated against on-slide OE, WT, and NULL cell-line controls, scored ` +
    `${scorePhrase} within ${region}${magPhrase}, consistent with the observed expression pattern.`;
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
