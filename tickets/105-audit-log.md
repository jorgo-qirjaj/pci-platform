# 105 — Audit log for clinical actions

**Status:** Open · **Maps to:** H11-a · **Band:** Security · **Effort:** M

**Context.** No record of who viewed/scored/finalized which case (HIPAA §164.312(b)).
(Inspired by litepen's "security events" ticket.)

**Acceptance.**
- [ ] Append-only log records actor, action, case, timestamp
- [ ] Logs contain no PHI and are queryable
- [ ] Score / finalize / report / case-read are covered

**Files.** `server/src/` (new audit module), `routes/cases.ts`
