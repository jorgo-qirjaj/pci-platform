# 505 — Reports module: make interactive + rethink

**Status:** ✅ Shipped — negatives-first triage worklist (2026-07-01) · **Band:** Frontend · **Effort:** M

**Context.** `web/src/pages/Reports.tsx` is a thin list of AI-scored cases — each row shows
accession / site / score and a single small **"Open report"** button. Two problems:
1. **Not interactive.** Only the "Open report" button is clickable; the report row/card itself has
   **no hover or click affordance**, and isn't keyboard-operable (unlike the dashboard rows after 503).
2. **Needs a rethink.** The module is thin — just a filtered case list. What should "Reports" actually
   *be*? (Needs product direction.)

**Acceptance — interactivity (near-term, concrete):** ✅ shipped
- [x] The whole report card is clickable (opens the report), with a **hover highlight** and an
      **active/pressed** effect.
- [x] Keyboard-operable + visible focus (`tabIndex`, Enter/Space) with an `aria-label`, consistent with
      the dashboard rows from ticket 503 (focus ring via the global `:focus-visible` rule).
- [x] Keep an explicit "Open report" affordance for clarity.

**Acceptance — rethink:** ✅ shipped (mocked up first, approved, then built)
- [x] Reports reframed from a flat list into a **negatives-first triage worklist**: three buckets —
      **Needs review** (positive/uncertain/QC-flagged) · **Cleared by AI** (negative + high confidence) ·
      **Signed off** (complete). Summary strip up top; collapsible buckets; severity stripe + reason chip +
      confidence meter per row.
- [x] Working **biomarker filter** + **search** (accession/site/specimen); **Export PDF** (print) that
      expands all buckets first and prints the `.report-print-root` surface.
- [x] Bucketing isolated in `web/src/lib/triage.ts` as a **provisional** rule (negative pattern +
      confidence ≥ 95%), clearly labelled in-UI as a placeholder — the single swap-point for John's real
      AI model. No case is auto-cleared clinically.

**Verified.** Typecheck (both workspaces) + 33 server tests pass; runtime checked in preview (buckets
2/3/2, colors/chips correct, responsive degradation, collapse/expand, no console errors).

**Notes.**
- Seed topped up with 3 cleared negatives (`PCI-2026-00143/44/45`, `ai-scored`, wild-type/intact) so the
  Cleared bucket demos populated. **These only surface on a fresh DB or after the reset endpoint** — a
  persisted `store.json`/`pci.db` keeps its existing cases (the store seeds only when empty).
- Confidence meter hides below 1040px viewport (`.rpt-conf`) so rows degrade cleanly on narrow screens.
- Still open for John: does he want an AI-cleared bucket *visible* pre-validation, and what's the real
  clearing threshold? (Prototype: https://claude.ai/code/artifact/e97bc5f8-5d11-4630-a5bb-953ebeeae6cd)

**Files.** `web/src/pages/Reports.tsx`, `web/src/lib/triage.ts`, `web/src/styles/styles.css`,
`server/src/seed.ts`.