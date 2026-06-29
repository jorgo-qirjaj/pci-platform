# 504 — Client data freshness

**Status:** Open · **Maps to:** M5 · **Band:** Frontend · **Effort:** M

**Context.** Dashboard fetches all and filters client-side; scoring/finalize don't invalidate the list.

**Acceptance.**
- [ ] React Query (or SWR) caching + invalidation so mutations refresh list/stats
- [ ] Server-side pagination on `GET /cases`

**Files.** `web/src/pages/Dashboard.tsx`, `web/src/lib/api.ts`, `server/src/routes/cases.ts`
