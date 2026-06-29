# 403 — Slide de-identification gate

**Status:** Open · **Band:** Slide pipeline · **Effort:** M

**Context.** WSI `.svs` files embed `label`/`macro` images that can contain patient identifiers even
when filenames/metadata are clean (observed: `6021.svs` label shows a patient name).

**Acceptance.**
- [ ] Before any `.svs` reaches S3, strip/redact the `label` and `macro` associated images
- [ ] Reject or quarantine slides whose associated images can't be cleared
- [ ] Documented operator workflow

**Files.** `pci-viewer/backend/` (upload path)
