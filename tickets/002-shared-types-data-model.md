# 002 — Single source of truth for domain types

**Status:** Open · **Maps to:** M4 · **Band:** Foundation · **Effort:** M

**Context.** Domain types are duplicated in `server/src/types.ts` and `web/src/lib/types.ts`; they
can drift (e.g. new score-provenance fields had to be added in both places).

**Acceptance.**
- [ ] Domain types live in one shared package (or are generated from the API)
- [ ] `server`/`web` duplication removed
- [ ] A contract test catches drift

**Files.** `server/src/types.ts`, `web/src/lib/types.ts`
