# 601 — Test harness

**Status:** Done · **Maps to:** H9 (partial) · **Band:** Quality/Ops

**What.** Node `node:test` + Supertest via tsx (no vitest/vite → 0 audit findings). App exports
`app` and only listens outside tests; store path is env-overridable for throwaway test stores;
files run serially. Suites: authz (6) + scoring (7) = 13 passing.

**Files.** `server/src/__tests__/*.test.ts`, `server/src/index.ts`, `server/package.json`
