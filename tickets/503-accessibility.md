# 503 — Accessibility

**Status:** Open · **Maps to:** M6 · **Band:** Frontend · **Effort:** M

**Context.** Clickable table rows lack keyboard/roles; the new-case modal lacks focus trap/Esc/
`role="dialog"`; the account menu is a non-semantic toggled div.

**Acceptance.**
- [ ] Case rows keyboard-activatable with proper roles
- [ ] Modal: focus trap, Esc, `role="dialog"`
- [ ] Semantic account menu; contrast audit
- [ ] axe-core passes (no serious violations); full keyboard walkthrough

**Files.** `web/src/pages/Dashboard.tsx`, modal + TopBar components
