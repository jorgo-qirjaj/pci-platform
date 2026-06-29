# Discovery call — Thomas DeLeon (clinical lab manager)

**Date:** 2026-06-29 · **Interviewee:** Thomas DeLeon — clinical lab analyst/manager, ex-Baylor pathology; starting an AI/ML PhD (Sep 2026) · **Interviewer:** Jorgo Qirjaj · **Purpose:** understand the real lab/pathology workflow end-to-end and where the platform fits.

## TL;DR
The strongest signal: the highest-value, most *sellable* job for the AI is **not** "score everything." It's to **reliably clear the negatives** (cases with no cancer) at near-100% confidence and **flag only the positives/uncertain cases for a pathologist**. That directly buys back pathologist time, which a high-volume lab can turn into money.

## How a lab runs, end to end
- Specimen → grossing/processing → staining → scanned to **whole-slide images (WSI)** → pathologist reads remotely via a secure cloud link → diagnosis → report → results to the LIS / ordering physician.
- **Turnaround time (TAT) target ≈ 72 hours**, specimen-in to result-out. Digital viewing already helps (read from anywhere); the bottleneck is the manual-review pile.
- Per case the pathologist assembles a "story": slide + patient history + prior cases + relevant labs/radiology → judgment call.

## Pain points & needs
1. **Negatives waste pathologist time.** Most screening cases are negative; reading thousands of normals is low-value. *Win:* auto-clear the sure-negatives, flag the rest. (Analogy: the clinical lab's Sysmex pre-sorts; a human validates the maybes.)
2. **Rescans** are a major time/cost leak — caused by debris (dust/wax) and **stain degradation** (old reagent lots). A **QC check** that grades stain quality and flags debris/degradation *before* the pathologist reads prevents them. (Baylor ran a vendor-agnostic QC AI overlaid on Sectra that tracked stain quality by lot.)
3. **Trust is the adoption gate.** Pathologists sign their name to a diagnosis; they won't adopt without high, reliable accuracy. "A negative is truly negative" must be rock-solid.
4. **Pathology is still very manual** — ~20 years behind radiology in digital adoption; lots still on microscope + handwriting. Big greenfield.

## Strategic signals
- **Integrate, don't rebuild ("software-agnostic").** Labs already run an **LIS** (Laboratory Information System — Cerner, Epic Beaker) and imaging platforms (**Sectra**). The winning play is to **overlay/interface on top of what they already have**, focused on the image — not build a whole new backend. ("Like Apple — it just works natively.")
- **Go-to-market: specialize, then land volume.** Labs are paid per case regardless of result, so clearing negatives is direct ROI. Pick one specialty (derm, prostate, bladder…), get it near-perfect, land a high-volume lab (he cited a derm-only lab doing ~60k cases), then expand.
- **Adoption is a network.** Pathology is a tight "good old boys" circle — win one respected (often older) pathologist and it becomes the local standard (his "Dragon dictation" analogy). Frame AI as removing grunt work so they do the art — not replacing them.
- **Validation & data.** Earn trust via **RUO** (research-use-only) first, validation studies, and **human-in-the-loop** learning (pathologists correct the model). Always **anonymize** data before it leaves the secure environment.

## Longer-term opportunities he raised
- **Slide archive / standardization** — no good system to catalog slides (Baylor: ~1.5M slides in storage lockers) or link physical ↔ digital.
- **Diagnosis-language standardization** — every pathologist writes their own comments; standardizing speeds sign-out *and* improves AI training data.
- **Multi-agent workflow** — agents that read the image, pull history/prior cases, and interpret labs/radiology → assemble the case "story" + probabilities for the pathologist to confirm.

## Open questions (need product direction — see email to John)
1. What does the current AI actually output — can it be framed as **"confidently clear negatives + flag the rest"** rather than score-everything?
2. Which **specialty / biomarker** do we make excellent first?
3. Do we aim to **overlay/integrate on existing WSI + LIS** (Sectra, Cerner/Epic Beaker), or stay standalone for now?
4. Is a **QC / stain-quality pre-check** worth scoping (a concrete, separable trust-builder)?
5. What's the **validation & regulatory path** (RUO first? validation partner? when can we access the AI code/model)?

## Follow-ups
- Interview an actual **pathologist** next — Thomas is ops/lab and repeatedly pointed to the pathologist as the real adoption decision-maker.
- Resources: the *Digital Pathology Podcast* (host Aleksandra) for domain trends; Thomas's ML professor; possibly more pathologists/engineers he can introduce.
- Thomas is open to **advising** as a side project (mindful of his current job + PhD starting September).

> Note: the raw call transcript is kept out of version control (it contains a named individual's candid remarks). This summary is the shareable artifact.
