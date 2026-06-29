# 102 — Tenant authorization (lab isolation)

**Status:** Done · **Maps to:** C4 · **Band:** Security

**What.** Users + cases carry a `labId`. Every `/cases/:accession*` route resolves via `findOwned()`
— missing and cross-tenant cases both return 404 (no enumeration oracle). Listings are lab-scoped;
each case carries an opaque UUID alongside the human accession.

**Tests.** `server/src/__tests__/authz.test.ts` (6).
**Files.** `server/src/routes/cases.ts`, `auth.ts`, `seed.ts`, `store.ts`, `types.ts`
