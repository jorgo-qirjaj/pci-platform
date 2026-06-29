# 302 — Durable database

**Status:** Open · **Maps to:** H8, M10 · **Band:** Backend/Data · **Effort:** L

**Context.** Store is in-memory + full-file `writeFileSync` per mutation — no atomicity/locking;
a crash mid-write can corrupt `store.json`, and it can't scale horizontally.

**Acceptance.**
- [ ] Postgres + a typed ORM (e.g. Prisma); transactional writes; versioned migrations
- [ ] Concurrent updates safe; multiple API instances share state
- [ ] Backup/restore documented
- [ ] Unblocks audit log (105) and encryption at rest (106)

**Files.** `server/src/store.ts` (→ data layer), schema/migrations
