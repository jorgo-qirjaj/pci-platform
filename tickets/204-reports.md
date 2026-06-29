# 204 — Biomarker report

**Status:** Done · **Band:** Clinical

**What.** Structured report payload + generated interpretation prose (now naming the scored region,
magnification, model version), RUO disclaimer, and a provenance strip in the UI. Report blocked
(409) when a case has no AI score (C1).

**Files.** `server/src/routes/cases.ts`, `web/src/pages/Report.tsx`
