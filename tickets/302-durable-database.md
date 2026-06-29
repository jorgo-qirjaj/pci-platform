# 302 — Durable database

**Status:** Done · **Maps to:** H8 (fixed) · M10 (partial) · **Band:** Backend/Data · **Effort:** L

**What.** Replaced the in-memory + full-file JSON store with **SQLite** via **Drizzle ORM**
(`better-sqlite3`, synchronous — the store's public API is unchanged, so routes were untouched).
Cases are a JSON `data` document plus promoted columns (`accession` PK, `lab_id`, `status`,
`biomarker`, `site`) for filtering. Writes are **transactional** (`INSERT … ON CONFLICT`), which
removes the crash-corruption risk (H8). A legacy `store.json` is imported once on first run (with
field backfill), so existing data isn't lost.

**Still open (M10):** SQLite is single-node — true horizontal scaling needs a networked DB
(Postgres). Drizzle makes that switch cheap when scale demands it.

**Tests.** Full suite (21) runs against an in-memory SQLite DB; legacy JSON import + backfill verified.
**Files.** `server/src/schema.ts`, `server/src/store.ts`, `server/package.json`, `.gitignore`
