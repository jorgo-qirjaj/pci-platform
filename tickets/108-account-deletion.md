# 108 — Account & data deletion

**Status:** Open · **Band:** Security · **Effort:** M · **New** (litepen-inspired)

**Context.** No data-lifecycle/right-to-erasure path exists.

**Acceptance.**
- [ ] Authenticated user can request deletion of their account + owned data
- [ ] Deletion is logged (audit) and confirmed; reversible window or hard-delete documented
- [ ] Cross-tenant data untouched

**Files.** `server/src/routes/` (new), store
