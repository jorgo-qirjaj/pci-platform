# 101 — Auth foundation (JWT + password hashing)

**Status:** Done · **Maps to:** C3, H1 · **Band:** Security

**What.** JWT bearer auth (12h TTL); `JWT_SECRET` required in production (dev fallback warns).
Passwords are bcrypt-hashed; login uses a constant-time compare with a timing equalizer.

**Files.** `server/src/auth.ts`, `server/src/routes/auth.ts`, `server/src/seed.ts`
