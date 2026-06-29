# 505 — Reports module: make interactive + rethink

**Status:** Open · **Band:** Frontend · **Effort:** M

**Context.** `web/src/pages/Reports.tsx` is a thin list of AI-scored cases — each row shows
accession / site / score and a single small **"Open report"** button. Two problems:
1. **Not interactive.** Only the "Open report" button is clickable; the report row/card itself has
   **no hover or click affordance**, and isn't keyboard-operable (unlike the dashboard rows after 503).
2. **Needs a rethink.** The module is thin — just a filtered case list. What should "Reports" actually
   *be*? (Needs product direction.)

**Acceptance — interactivity (near-term, concrete):**
- [ ] The whole report card is clickable (opens the report), with a **hover highlight** and an
      **active/pressed** effect.
- [ ] Keyboard-operable + visible focus (`tabIndex`, Enter/Space) with an `aria-label`, consistent with
      the dashboard rows from ticket 503.
- [ ] Keep an explicit "Open report" affordance for clarity.

**Acceptance — rethink (needs a design + product pass; dissect before building):**
- [ ] Decide what Reports offers beyond a list — e.g. search/filter (biomarker, date, status), PDF
      export/download, inline preview, grouping.
- [ ] Tie it to the **negatives-first** direction: a "needs pathologist review" vs "cleared/signed-off"
      split would make this module genuinely useful, not just a mirror of the case list.
- [ ] Align the redesign with product direction (John) before building the larger rework.

**Files.** `web/src/pages/Reports.tsx` (+ shared list/card components).
EOF