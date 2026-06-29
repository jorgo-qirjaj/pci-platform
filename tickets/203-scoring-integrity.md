# 203 — Result-integrity contract for scoring

**Status:** Done · **Maps to:** H2, H3, H5 · **Band:** Clinical

**What.** Score is a pure function of (accession, region, modelVersion) — deterministic, versioned,
region-anchored; provenance stamped (model/region/magnification/operator); run history kept.
Hard QC gate (H2) on real controls and hard magnification gate (H3) per biomarker.

**Tests.** `server/src/__tests__/scoring.test.ts` (7).
**Files.** `server/src/ai.ts`, `server/src/routes/cases.ts`, `types.ts`, `seed.ts`
