# 602 — Broaden test coverage + lint

**Status:** Tests done · lint = open decision · **Maps to:** H9 (remainder) · **Band:** Quality/Ops

**What shipped (tests).** Coverage now spans the clinical-safety + security surface — **33 tests** across:
authz (tenant isolation), scoring integrity (H2/H3/H5), request validation + JWT payload, audit log,
auth (`/me` + login rate-limit), annotations (add/delete/validation), and the upload proxy (auth +
fail-closed). All on Node `node:test` + Supertest, in-memory SQLite, run serially; gated by CI.

**Open decision (lint).** ESLint + CI wiring is deferred pending a quick call on strictness — a fresh
ESLint pass over existing code tends to be noisy. Lean: a minimal advisory config, or defer entirely
(strict TypeScript + tests + CI already cover the big risks).

**Files.** `server/src/__tests__/*.test.ts`
