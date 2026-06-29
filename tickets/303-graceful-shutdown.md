# 303 — Graceful shutdown

**Status:** Done · **Maps to:** M11-a · **Band:** Backend/Data · **Effort:** S

**What.** SIGTERM/SIGINT stop accepting connections, drain in-flight requests (`server.close`),
flush the store, then exit; force-exit after 10s if draining stalls.

**Files.** `server/src/index.ts`, `server/src/store.ts` (`flush()`)
