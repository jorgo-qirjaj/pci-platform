# 104 — Move JWT out of localStorage

**Status:** Open · **Maps to:** H6 · **Band:** Security · **Effort:** M

**Context.** The token is stored in `localStorage` (`web/src/lib/api.ts`), so any XSS can exfiltrate it.

**Acceptance.**
- [ ] Token issued as an `httpOnly; Secure; SameSite=Strict` cookie
- [ ] CSRF token on state-changing routes
- [ ] `localStorage` no longer holds the token; auth flow re-tested

**Files.** `server/src/auth.ts`, `server/src/routes/auth.ts`, `web/src/lib/api.ts`
