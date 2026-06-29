# 105 — Audit log for clinical actions

**Status:** Done · **Maps to:** H11-a · **Band:** Security · **Effort:** M

**What.** Append-only SQLite `audit_log`: who (operator email + lab) did what (view / create /
score / finalize / report / annotate / delete-annotation) to which case (accession), when, with a
PHI-free `detail`. `store.appendAudit` (append-only, best-effort) + `store.listAudit` (lab-scoped).
Lab-scoped `GET /api/audit` (`?accession`, `?limit`). No patient PHI — de-identified accession +
operator identity only.

**Verified.** `audit.test.ts` (5) + a 3-lens adversarial review (PHI-leakage · coverage ·
append-only/lab-scoping) — all PASS, no actionable findings.

**Follow-up (low-sev).** `appendAudit` swallows failures, so a *systemic* logging outage is silent —
surface via observability (ticket `603`); consider fail-closed audit for production compliance.

**Files.** `server/src/schema.ts`, `store.ts`, `routes/cases.ts`, `routes/audit.ts`, `index.ts`,
`types.ts`; tests `audit.test.ts`
