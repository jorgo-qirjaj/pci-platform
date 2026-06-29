# PCI Pathology Platform — Security & Quality Remediation Plan

> **Status:** living document. Recovered from the audit session and committed so the backlog is tracked, not lost in chat.
> **Original review:** a single static pass over the codebase — every finding cited to `file:line`, no automated scanners.
> **Six fixes shipped** in commit `59615bb` (see Milestone 0 and the Appendix).
> **Last reconciled:** 2026-06-26 — see [§0 Updates since the audit](#0-updates-since-the-audit).

---

## 0. Updates since the audit

Work landed after this plan was first written. Reconciled against the current tree:

| Item | Status now | Notes |
|---|---|---|
| **C1, C2, C3, H1, H4, H7, H10, M3** | ✅ **Fixed** | The six quick wins — shipped in `59615bb`, runtime-verified (Appendix A). |
| **M6 — Real WSI viewer** (was roadmap) | ✅ **Done early** | The CSS mock (`Tissue.tsx`) is replaced by a real OpenSeadragon viewer backed by a FastAPI/OpenSlide tile server. This was a Milestone-6 roadmap item. |
| **Annotations / ROI data** | 🟡 **Partial** | Real annotations (rect, freehand, line, polygon, pin) now persist as `Regions`. This supplies the ROI data **H5** needs, but scoring (`ai.ts`) still isn't anchored to a region. |
| **H12 — Unauthenticated slide upload** | ✅ **Fixed** | `POST /slides/upload` now requires `X-Upload-Key` (fails closed if unset) and is reached only via the authenticated platform proxy `POST /api/slides/upload`. Verified end-to-end (no JWT → 401; valid slide → 200; bad file → 400). |
| **C4 — Object-level authorization (IDOR)** | ✅ **Fixed** | Users + cases carry a `labId`; every `/cases/:accession` route resolves via `findOwned()` (missing and cross-tenant both → 404). Listings are lab-scoped; cases carry an opaque UUID. Proven by an automated suite (`server/src/__tests__/authz.test.ts`, 6 tests). |
| **H9 — Tests + CI** | 🟡 **Partial** | Test harness now exists (Node `node:test` + supertest via tsx) with the C4 authorization suite; a CI workflow gating typecheck + tests is prepared. Broader coverage (other endpoints, React screens, ≥90% on clinical-safety paths) still open. |
| **Slide de-identification** | ⚠️ **Process gap** | Real-case `.svs` files carry patient names in their embedded `label`/`macro` images (e.g. `6021.svs` → "GREEN, R"). Anything uploaded to S3 must be de-identified including those associated images. |

Everything else below remains **open** as written.

---

## 1. Executive summary

The platform is a clean, well-structured prototype with a faithful design-system port, strict TypeScript, and a correctly **de-identified** data model (accession numbers, no patient names) — a genuinely good foundation. But it is **not safe for clinical or production use as written**, and several issues are serious *regardless* of the intentional mocks.

The single most important problem: the report endpoint **fabricated an authoritative AI score and interpretation for cases that were never scored** (`cases.ts`), and **finalized reports were mutable** — a re-score silently overwrote a "complete" case with a new random value. *(Both fixed — C1/C2.)* On security, a **hardcoded fallback JWT secret**, **plaintext passwords**, and **no object-level authorization** over predictable sequential accessions meant any token could read or alter every clinical case. *(JWT secret + passwords fixed — C3/H1; IDOR closed — C4, with lab tenancy + a regression test.)* The "TriControl™ QC verified" claim is **manufactured by the act of scoring** rather than measured, and the PDL1 magnification cap is **UI-only**. A **test harness + CI now exist** (H9, partial), but **HIPAA-grade controls** (audit log, encryption at rest, TLS enforcement) are still missing.

Fix the score-integrity and auth issues first; they are cheap and high-impact. The clinical-domain modeling and UX are the strengths to build on.

## 2. Risk scorecard (1 = critical risk, 5 = excellent)

| # | Dimension | Score | One-line justification |
|---|-----------|:---:|---|
| 1 | Clinical & domain safety | **2** | Fabricated/mutable scores, faked QC, unenforced mag cap, no in-app disclaimer |
| 2 | Security (HIPAA lens) | **1** | Default JWT secret, plaintext passwords, IDOR, token in localStorage, no rate-limit |
| 3 | Data integrity & persistence | **2** | Non-atomic full-file writes, write races, crash-corruption risk |
| 4 | API design & contracts | **2** | Non-idempotent scoring, mutable finalized reports, no validation, no pagination |
| 5 | Architecture & maintainability | **3** | Sensible separation; duplicated types; logic in route handlers |
| 6 | Frontend quality & UX | **3** | Works well; no caching/invalidation, stale data after mutations |
| 7 | Accessibility | **2** | Non-keyboard table rows, modal without focus trap, non-semantic menu |
| 8 | Type safety & code quality | **4** | `strict` on both sides; a couple of unchecked casts |
| 9 | Performance & scalability | **3** | Fine now; single bundle, unmemoized gradients, in-memory store can't scale |
| 10 | Testing, tooling & CI | **1** | No tests, no CI, no lint config in repo |
| 11 | Compliance & regulatory | **1** | No audit log, no encryption/TLS, mutable e-sign, "clinical use" mislabel |
| 12 | Observability & operations | **2** | console-only logging, no monitoring, no graceful shutdown |

*Scores reflect the state at audit time; C1/C2/C3/H1/H4/H7/H10/M3 fixes since then improve dimensions 1, 2, and 4 but do not fully clear them.*

## 3. Findings (severity-ordered; clinical & security first)

Legend: ✅ fixed · 🟡 partially addressed · ⬜ open · 🆕 found after the original audit.

### Critical

- ✅ **C1 · Report fabricates scores for unscored cases** · Clinical/Correctness · `cases.ts` — a `GET /cases/:id/report` on a never-scored case synthesized a score + interpretation + signature and presented it as a real report. **Fix shipped:** returns `409` if `c.ai == null`; read path no longer generates scores. **Effort: S**
- ✅ **C2 · Finalized reports are mutable** · Clinical/Regulatory · `cases.ts` — `/score` overwrote a signed-off result with a new random score even when `status === 'complete'`. **Fix shipped:** scoring a `complete` case returns `409`. *(Immutable versioned snapshot on finalize still recommended — see H5.)* **Effort: S**
- ✅ **C3 · Hardcoded fallback JWT secret** · Security · `auth.ts` — `process.env.JWT_SECRET || 'pci-dev-secret-change-me'`. **Fix shipped:** required in `NODE_ENV=production` (refuses to boot without it); dev fallback warns. **Effort: S**
- ✅ **C4 · No object-level authorization (IDOR) + enumerable IDs** · Security/Privacy · `cases.ts`, `store.ts` — any authenticated user could read/score/finalize **any** case, and accessions are sequential. **Fix shipped:** users + cases carry a `labId`; every `/cases/:accession` route resolves via `findOwned()` so missing **and** cross-tenant cases both return 404 (no enumeration oracle); listings are lab-scoped; create stamps the lab; each case carries an opaque UUID `id`. Pre-C4 persisted cases are backfilled on load. **Verified** by `server/src/__tests__/authz.test.ts` (6 tests). **Effort: L**

### High

- ✅ **H1 · Plaintext passwords, no hashing** · Security · `auth.ts`, `seed.ts` — direct `u.password !== password` compare (timing-leaky). **Fix shipped:** bcrypt hashing + compare. **Effort: S–M**
- ⬜ **H2 · TriControl™ QC is fabricated, not measured** · Clinical · `cases.ts` — scoring sets `controls` to `true` regardless of actual cell-line detection; the report then asserts "TriControl™ QC verified." **Fix:** derive QC from real control detection; block scoring if controls fail. **Effort: M**
- ⬜ **H3 · Magnification cap is UI-only** · Clinical · `pathology.tsx`; no `mag` reference in `server/src`. The PDL1 ≤20× "clinical limit" is cosmetic. **Fix:** record and enforce capture magnification server-side. **Effort: M**
- ✅ **H4 · No investigational/RUO disclaimer in the working view** · Clinical · `pathology.tsx` `ScoreDisplay` — the headline score appeared with no caveat. **Fix shipped:** RUO caveat surfaced wherever a score is shown. **Effort: S**
- 🟡 **H5 · Scoring is non-deterministic, unversioned, unanchored** · Clinical/API · `ai.ts` — `Math.random()` jitter every call; no `modelVersion`, no ROI/region linkage. **Progress:** real ROI/annotation data now exists (Regions). **Still open:** scoring isn't deterministic, versioned, or tied to a region. **Fix:** deterministic, versioned scoring tied to a specific region; persist run history. **Effort: M–L**
- ⬜ **H6 · JWT stored in localStorage** · Security · `web/src/lib/api.ts` — any XSS exfiltrates the token. **Fix:** httpOnly, Secure, SameSite cookie + CSRF token. **Effort: M**
- ✅ **H7 · No brute-force protection on login** · Security · `routes/auth.ts` — unlimited attempts. **Fix shipped:** `express-rate-limit` on login (`401×8 → 429` verified). **Effort: S**
- ⬜ **H8 · Non-atomic persistence, write races** · Data integrity · `store.ts` — full-file `writeFileSync` on every mutation, no lock, no temp-file+rename; a crash mid-write corrupts `store.json`. **Fix:** real DB, or at minimum atomic write + serialization. **Effort: M**
- 🟡 **H9 · No tests, no CI, no lint** · Quality/Safety net · repo-wide. **Progress:** a test harness now exists — Node `node:test` + Supertest run via tsx (deliberately no vitest/vite/esbuild, keeping `npm audit` at 0), with the C4 authorization suite as the first coverage. A CI workflow gating typecheck + tests is prepared (`.github/workflows/ci.yml`; needs a workflow-scoped push). **Still open:** broader endpoint coverage, React-screen tests, ≥90% on clinical-safety paths, and lint config. **Effort: M–L**
- ✅ **H10 · CORS fully open** · Security · `index.ts` — `app.use(cors())` allowed all origins. **Fix shipped:** strict origin allowlist (evil origin not echoed — verified). **Effort: S**
- ⬜ **H11 · HIPAA technical-safeguard gaps** · Compliance · repo-wide — no audit logging, no encryption at rest (plaintext `store.json`), no TLS enforcement. **Fix:** audit trail, encryption, HTTPS-only. **Effort: L**
- 🆕✅ **H12 · Unauthenticated slide-upload endpoint (tile server)** · Security · `pci-viewer` FastAPI `POST /slides/upload` — previously accepted multipart uploads with **no authentication** and wrote them to the S3 bucket. **Fixed:** the route now requires `X-Upload-Key == UPLOAD_API_KEY` and fails closed (503) when the key is unset; the browser reaches it only through the authenticated platform proxy `POST /api/slides/upload` (JWT-gated), which adds the key server-side. Uploads are also validated as real WSIs (400 otherwise) and size-capped (413 >2 GB). **Deploy note:** set `UPLOAD_API_KEY` on both the Railway tile server and the platform API. **Effort: S–M**

### Medium

- ⬜ **M1 · No request validation / unbounded inputs** · `cases.ts` — body fields stored unchecked. **Fix:** `zod` schemas + length limits. *(Annotation routes added some validation; coverage is still incomplete.)* **Effort: S–M**
- ⬜ **M2 · Destructive reset open to any user** · `index.ts` — `/api/admin/reset` wipes data with only auth, no role. **Fix:** restrict to admin/dev env. **Effort: S**
- ✅ **M3 · No security headers** · `index.ts` — **Fix shipped:** `helmet` added (`X-Content-Type-Options`, `X-Frame-Options`, `X-Powered-By` removed — verified). **Effort: S**
- ⬜ **M4 · Duplicated domain types** · `server/src/types.ts` vs `web/src/lib/types.ts` — drift risk. **Fix:** shared package. **Effort: M**
- ⬜ **M5 · Stale client data, no caching/pagination** · `Dashboard.tsx` fetches all and filters client-side; scoring doesn't invalidate the list. **Fix:** React Query + server pagination. **Effort: M**
- ⬜ **M6 · Accessibility gaps** · clickable `<tr onClick>` with no keyboard/role (`Dashboard.tsx`); `NewCaseModal` lacks focus trap/Esc/`role="dialog"`; `TopBar` account menu is a non-semantic toggled div. *(Interactivity pass added hover/focus states; structural a11y still open.)* **Effort: M**
- ⬜ **M7 · "CLIA pending · clinical use" labeling** · Regulatory · `cases.ts` — labels an investigational-AI report "clinical use" while CLIA is pending. **Fix:** legal/labeling review. **Effort: S**
- ⬜ **M8 · `jwt.verify` cast without shape validation** · `auth.ts`. **Fix:** validate payload. **Effort: S**
- ⬜ **M9 · Unmemoized tissue gradients** · Perf · `Tissue.tsx` — ~200 gradient strings rebuilt per render. *(Now largely superseded by the real OSD viewer; applies only where `Tissue.tsx` still renders.)* **Effort: S**
- ⬜ **M10 · In-memory store blocks horizontal scaling** · Scalability · `store.ts`. **Fix:** DB. **Effort: L**
- ⬜ **M11 · Thin observability, no graceful shutdown** · `index.ts`, `store.ts` — console logging only; SIGTERM mid-write risks corruption. **Effort: M**

**Done well (balance):** de-identified model holds (no patient names anywhere in the app data); generic login error avoids user enumeration; JWT expiry set; `encodeURIComponent` on client paths; strict TS; persistence has a safe seed fallback; clear routes/store/ai separation.

---

## 4. Prioritized remediation plan

**Legend:** Effort S (<½ day) · M (1–3 days) · L (1–2 weeks) · XL (multi-sprint). Priority P0 (gate any real-data pilot) → P3 (roadmap).

### ✅ Milestone 0 — Shipped this session (`59615bb`)
`C1` report no longer fabricates scores · `C2` finalized cases immutable · `C3` JWT secret required in prod · `H1` bcrypt password hashing · `H7` login rate-limit · `H10/M3` helmet + CORS allowlist · `H4` in-app RUO disclaimer.

### Milestone 1 — Access control & request safety · P0
*Goal: no authenticated user can reach data that isn't theirs; no malformed input reaches handlers.*

- **[C4] Object-level authorization + non-enumerable IDs** · *Effort L*
  - Why: any token can read/score/finalize **any** case and accessions are sequential.
  - Acceptance: every `/cases/:id*` handler checks the case belongs to the caller's lab/tenant; cross-tenant access returns 404 (not 403, to avoid existence leak); resources carry an opaque UUID alongside the human accession; an automated test proves user A cannot read user B's case.
- ✅ **[H12] Authenticate the tile-server upload route** · *Effort S–M* 🆕 — **Done.** Upload now requires `X-Upload-Key` (fail-closed), is proxied behind JWT auth, validates WSI format, and caps size at 2 GB. Set `UPLOAD_API_KEY` on Railway + the API to activate in prod.
- **[M2] Lock down the demo reset endpoint** · *Effort S*
  - Acceptance: `/api/admin/reset` is gated behind an admin role **and** disabled unless `NODE_ENV !== 'production'`; non-admin → 403.
- **[H6] Move JWT out of localStorage** · *Effort M*
  - Acceptance: token issued as `httpOnly; Secure; SameSite=Strict` cookie; CSRF token on state-changing routes; localStorage no longer holds the token; auth flow re-tested.
- **[M1] Schema validation on every endpoint** · *Effort M*
  - Acceptance: `zod` (or equivalent) validates body/params/query for all routes; invalid input → 400 with field errors; string fields length-bounded; a fuzz/negative test suite passes.
- **[M8] Validate JWT payload shape** · *Effort S*
  - Acceptance: `requireAuth` rejects tokens whose decoded payload is missing required fields rather than trusting the cast.

### Milestone 2 — Result integrity & clinical correctness · P0
*Goal: a score on a report is real, reproducible, traceable, and QC-gated.*

- **[H2] QC derived from real control detection** · *Effort M*
  - Acceptance: TriControl™ status comes from actual OE/WT/NULL detection inputs; if any required control fails, scoring is blocked and the case cannot be finalized; report QC reflects measured state.
- **[H3] Enforce & record magnification server-side** · *Effort M*
  - Acceptance: capture magnification is persisted on the score; requests above the per-biomarker cap are rejected; the report shows the actual magnification used.
- **[H5] Deterministic, versioned, ROI-anchored scoring** · *Effort L*
  - Acceptance: a score records `modelVersion`, the exact region/annotation it was computed on, operator, and timestamp; re-running the same model+region is reproducible; prior runs are retained as history, not overwritten. *(Region data now exists via Regions — the anchor target is available.)*
- **[H11-a] Audit trail for clinical actions** · *Effort M* (HIPAA §164.312(b))
  - Acceptance: an append-only audit log records who viewed/scored/finalized which case and when; logs contain no PHI; logs are queryable.

### Milestone 3 — Durable, scalable data layer · P1
- **[H8 / M10] Real database** · *Effort L*
  - Acceptance: Postgres + a typed ORM (e.g., Prisma); writes are transactional; migrations versioned; concurrent updates safe; multiple API instances share state; automated backup/restore documented.
- **[M4] Single source of truth for types** · *Effort M*
  - Acceptance: domain types live in one shared package (or generated from the DB schema); `server`/`web` duplication removed; a contract test catches drift.
- **[M11-a] Graceful shutdown** · *Effort S*
  - Acceptance: SIGTERM/SIGINT drains in-flight requests and flushes/closes the store before exit.

### Milestone 4 — Compliance & operations · P1
- **[H11-b] Encryption & transport** · *Effort M* — at-rest encryption for the datastore; TLS enforced (HSTS, redirect HTTP→HTTPS); secrets via a manager, not env files in the repo.
- **[M7] Labeling & regulatory review** · *Effort M (mostly non-eng)* — resolve the "CLIA pending · clinical use" wording; obtain a SaMD determination (FDA / IEC 62304); decide whether finalize needs a 21 CFR Part 11 e-signature with an immutable signed manifest. *Output: a decision doc.*
- **[M11-b] Observability** · *Effort M* — structured request logging (PHI-scrubbed), error tracking (e.g., Sentry), metrics + health/readiness probes.
- **[Slide de-id] De-identification gate for uploads** · *Effort M* 🆕 — before any `.svs` reaches S3, strip/redact the `label` and `macro` associated images; reject or quarantine slides whose associated images can't be cleared. (Text metadata alone is insufficient — `6021.svs` had a patient name in the label image while its properties were clean.)

### Milestone 5 — Quality, accessibility, performance, UX · P2
- **[H9] Test suite + CI** · *Effort L* — Vitest + Supertest covering Milestone-2 clinical-safety paths first; React Testing Library for the four screens; GitHub Actions gating typecheck + tests + lint. *Acceptance: CI blocks merges on failure; clinical-safety endpoints ≥90% covered.*
- **[M6] Accessibility** · *Effort M* — keyboard-activatable case rows with proper roles; focus trap/Esc/`role="dialog"` on `NewCaseModal`; semantic menu for the TopBar account dropdown; contrast audit. *Acceptance: axe-core passes with no serious violations; full keyboard walkthrough.*
- **[M5] Client data freshness** · *Effort M* — React Query (or SWR) for caching + invalidation; server-side pagination on `GET /cases`. *Acceptance: scoring a case updates the dashboard without a manual reload.*
- **[M9] Frontend perf** · *Effort S* — `useMemo` the tissue gradient computation; route-level code splitting.

### Milestone 6 — The real product · P3 / roadmap
- ✅ Real **OpenSeadragon/WSI viewer** replacing the CSS mock — **done** (OSD + FastAPI/OpenSlide tile server).
- Real **p53AI** model serving with versioning, drift monitoring, and a human-in-the-loop review step.
- **RBAC + multi-tenant lab isolation + SSO** (e.g., AWS Cognito); org/role management (the `Team`/`Settings` pages become real).
- **Server-side PDF report generation** with the e-signature manifest from M4.

---

**Suggested sequencing:** Milestones 1 & 2 are the gate for touching any real patient data — do them together (they share data-model work with M3, so consider pulling the DB forward and doing 1+2+3 as one hardening epic). 4 runs in parallel (much of it is legal/ops, not code). 5 is continuous. 6 is the product roadmap.

**Fastest path to a safe internal pilot:** C4 + H12 + H2 + H3 + H5 + the audit log (with M1·M2·M8 alongside). That's the smallest set that makes a displayed score trustworthy and access controlled.

## 5. Clinical-safety call-out

Four issues directly threaten result trustworthiness and must gate any clinical pilot: **C1** (reports invented for unscored cases — *fixed*), **C2** (finalized results silently rewritten — *fixed*), **H2** (QC "verified" without measuring controls — the platform's entire calibration claim — *open*), and **H3** (the PDL1 magnification rule isn't actually enforced — *open*). **H4** (*fixed*) and **M7** (*open*) compound the risk by presenting investigational output without a caveat in-app and labeling it "clinical use." De-identification of the app data is sound, but **predictable accessions + missing authorization (C4)** still allow broad access to the clinical record set, and the **unauthenticated upload path (H12)** plus the **slide-label PHI gap** are new must-close items before any real data.

## 6. What needs human input

- **Deploy-layer controls** — whether prod sets `JWT_SECRET`, enforces TLS, or encrypts the volume is outside the repo.
- **Regulatory determinations** — SaMD classification, CLIA labeling, and 21 CFR Part 11 obligations need qualified counsel, not a code reviewer.
- **Domain truth** — the real rules for TriControl™ pass/fail and per-biomarker magnification limits must come from the lab; the audit assessed *enforcement*, not clinical correctness.
- **Repo exposure** — C3's residual severity depends on whether the pushed repos are private (they should be).

---

## Appendix A — Verification of the shipped fixes (Milestone 0)

| Fix | Test | Result |
|---|---|---|
| **H1** hashed passwords | correct login / wrong password | token issued / **401** ✓ |
| **C2** finalized immutable | score `complete` case / score active case | **409** / **200** ✓ |
| **C1** no fabricated reports | report on unscored case / on scored case | **409** / **200** ✓ |
| **H10/M3** helmet + CORS | response headers | `X-Content-Type-Options: nosniff`, `X-Frame-Options`, `X-Powered-By` removed, evil origin not echoed ✓ |
| **H7** login rate-limit | 12 rapid attempts | `401×8 → 429×4` ✓ |
| **C3** secret required | boot log | dev warning shown; throws in `NODE_ENV=production` ✓ (code-verified) |
