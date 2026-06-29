# 106 — Encryption at rest + TLS enforcement

**Status:** Open · **Maps to:** H11-b · **Band:** Security · **Effort:** M

**Context.** The datastore is plaintext and there is no transport hardening.

**Acceptance.**
- [ ] Datastore encrypted at rest (KMS-managed key once on a real DB — see 302)
- [ ] TLS enforced (HSTS, HTTP→HTTPS redirect)
- [ ] Secrets via a manager, not committed env files

**Files.** deploy config, `server/src/index.ts`
