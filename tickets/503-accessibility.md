# 503 — Accessibility

**Status:** Done (structural) · **Maps to:** M6 · **Band:** Frontend · **Effort:** M

**What shipped.**
- **Case rows** are keyboard-operable: `tabIndex`, Enter/Space activate, an `aria-label` per row ("View case PCI-… , biomarker, status …"), and a focus highlight.
- **New-case modal** is a real dialog: `role="dialog"` + `aria-modal` + `aria-labelledby`, focus moves into it on open, **Tab is trapped**, **Esc closes**, and focus returns to the trigger. Close control is a labelled `<button>`.
- **Account menu** is semantic: a `<button>` with `aria-haspopup="menu"` + `aria-expanded`, a `role="menu"` with `role="menuitem"` items, and Esc-to-close.

**Verified in-browser** (preview + DOM/accessibility checks): 8 focusable labelled rows; menu `aria-expanded` toggles + 2 menuitems; modal opens labelled, traps focus, closes on Esc.

**Remaining (smaller follow-up).** A formal **contrast audit** of small tertiary text against WCAG AA, and a full **axe-core** pass across all screens. Tracked here; lower priority than the structural fixes above.

**Files.** `web/src/pages/Dashboard.tsx`, `web/src/components/NewCaseModal.tsx`, `web/src/components/TopBar.tsx`
