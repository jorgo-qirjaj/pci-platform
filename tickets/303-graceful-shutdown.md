# 303 — Graceful shutdown

**Status:** Open · **Maps to:** M11-a · **Band:** Backend/Data · **Effort:** S

**Acceptance.**
- [ ] SIGTERM/SIGINT drains in-flight requests and flushes/closes the store before exit

**Files.** `server/src/index.ts`, `server/src/store.ts`
