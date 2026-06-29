# Plan & roadmap

The platform is a working full-stack prototype. Active work is tracked as **tickets**
(`/tickets`), numbered in bands by layer; security & quality findings are detailed in
[`REMEDIATION.md`](REMEDIATION.md).

## Ticket numbering

| Band | Layer |
|---|---|
| `0xx` | Foundation (monorepo, shared types, CI) |
| `1xx` | Security & access (auth, tenancy, audit, 2FA, deletion, validation) |
| `2xx` | Clinical domain (case model, annotations, scoring, reports) |
| `3xx` | Backend & data (cases API, database, lifecycle) |
| `4xx` | Slide pipeline (tile server, upload, de-identification) |
| `5xx` | Frontend (shell, screens, viewer, accessibility) |
| `6xx` | Quality & ops (tests, observability, deployment) |

A ticket is `Done` (documents shipped work) or `Open` (actionable backlog). Each maps to a
REMEDIATION finding where relevant.

## Milestones

- **M0 — Security quick wins** ✅ — C1/C2/C3/H1/H4/H7/H10/M3 (commit `59615bb`).
- **M1 — Access control & request safety** 🟡 — C4 ✅ (tenant isolation), H12 ✅ (upload auth);
  open: H6 (cookies), M1 (validation), M2 (admin reset), M8 (JWT payload).
- **M2 — Result integrity** ✅ — H2/H3/H5 (QC gate, magnification, deterministic ROI-anchored scoring).
- **M3 — Durable, scalable data layer** ⬜ — H8/M10 (real DB), M4 (shared types), M11-a (graceful shutdown).
- **M4 — Compliance & operations** ⬜ — H11 (audit log, encryption at rest, TLS), M7 (labeling), M11-b (observability).
- **M5 — Quality, a11y, UX** 🟡 — H9 (tests + CI: harness ✅, coverage open), M6 (accessibility), M5 (caching).
- **M6 — The real product** ⬜ — real p53AI serving, RBAC/SSO, server-side PDF, 2FA.

## Suggested next anchor

**Ticket 302 — durable database (H8/M10).** It removes the file-corruption risk and unblocks the
audit log (105) and encryption-at-rest (106). Tackle M3 + the M1 remainder together as a hardening epic.
