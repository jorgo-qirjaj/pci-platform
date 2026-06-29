# 110 — Lock down the demo reset endpoint

**Status:** Done · **Maps to:** M2 · **Band:** Security · **Effort:** S

**Context.** `POST /api/admin/reset` wipes the store; it must never be reachable in production.

**Acceptance.**
- [x] Disabled in production (returns 403); still requires auth elsewhere
- [ ] *(future)* role-based gate once an admin role exists

**Tests.** `server/src/__tests__/validation.test.ts`
**Files.** `server/src/index.ts`
