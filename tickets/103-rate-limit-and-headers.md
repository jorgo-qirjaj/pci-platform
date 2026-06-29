# 103 — Login rate-limit + security headers + CORS

**Status:** Done · **Maps to:** H7, H10, M3 · **Band:** Security

**What.** `express-rate-limit` on login (verified 401×8 → 429). `helmet` security headers.
Strict CORS origin allowlist (evil origin not echoed).

**Files.** `server/src/index.ts`, `server/src/routes/auth.ts`
