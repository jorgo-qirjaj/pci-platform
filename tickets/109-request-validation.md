# 109 — Schema validation on every endpoint

**Status:** Open · **Maps to:** M1, M8 · **Band:** Security · **Effort:** S–M

**Context.** Most bodies/params are validated ad hoc; the JWT payload is cast without shape checks.

**Acceptance.**
- [ ] zod (or equivalent) validates body/params/query on all routes; invalid → 400 with field errors
- [ ] String fields length-bounded
- [ ] `requireAuth` rejects tokens missing required payload fields (M8)

**Files.** `server/src/routes/*`, `server/src/auth.ts`
