# 110 — Lock down the demo reset endpoint

**Status:** Open · **Maps to:** M2 · **Band:** Security · **Effort:** S

**Context.** `POST /api/admin/reset` wipes the store with only auth — no role, no env guard.

**Acceptance.**
- [ ] Gated behind an admin role AND disabled unless `NODE_ENV !== 'production'`
- [ ] Non-admin → 403

**Files.** `server/src/index.ts`
