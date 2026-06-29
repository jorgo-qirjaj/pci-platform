# 107 — TOTP two-factor authentication

**Status:** Open · **Band:** Security · **Effort:** M · **New** (litepen-inspired)

**Context.** Clinical accounts should support a second factor.

**Acceptance.**
- [ ] Enrol: server issues a TOTP secret + QR; user confirms a code
- [ ] Login requires the TOTP code when 2FA is enabled
- [ ] Recovery codes issued and storable; rate-limited verification

**Files.** `server/src/auth.ts`, `server/src/routes/auth.ts`, web login flow
