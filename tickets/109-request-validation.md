# 109 — Schema validation + JWT payload check

**Status:** Done · **Maps to:** M1, M8 · **Band:** Security · **Effort:** S–M

**What.** zod schemas validate the login, case-create, and score bodies (length-bounded;
invalid → 400 with per-field issues). `requireAuth` validates the decoded JWT payload shape and
rejects malformed tokens (M8). The annotation route keeps its existing field validation.

**Acceptance.**
- [x] zod validation on login / create / score; invalid → 400 with field errors
- [x] String fields length-bounded
- [x] `requireAuth` rejects tokens missing required payload fields (M8)
- [ ] *(follow-up)* migrate the annotation route to a zod schema too

**Tests.** `server/src/__tests__/validation.test.ts`
**Files.** `server/src/validation.ts`, `routes/auth.ts`, `routes/cases.ts`, `auth.ts`
