# Customer interview guide

A plan and question bank for validating the PCI Pathology Platform with real pathologists and labs.
The platform's bet: **AI-assisted IHC biomarker scoring (p53, PDL1, HER2, MMR) made trustworthy by
anchoring every score to on-slide TriControl™ OE/WT/NULL cell-line controls.** These interviews exist
to find out whether that bet is real *before* we build further on it.

> Method note — **The Mom Test.** Ask about their *past behavior and specifics*, not hypotheticals.
> Don't pitch, don't ask "would you use…", don't fish for compliments. Dig into the last real case,
> the last disagreement, the last failed control, the last tool they abandoned. Talk ~20%, listen ~80%.

---

## 1. What we're validating (hypotheses)

| # | Hypothesis | If false, we should know early |
|---|---|---|
| H1 · Problem | IHC scoring (esp. p53/PDL1) has inter-observer variability and QC/turnaround pain that pathologists and labs actively feel | The whole premise weakens |
| H2 · Controls wedge | On-slide cell-line controls + AI calibrated to them is a credible, differentiated path to *trustworthy/reproducible* scores | TriControl™ isn't the differentiator we think |
| H3 · Workflow fit | The flow (WSI → draw ROI → AI score gated on controls + magnification → report) matches how they actually work | We're building the wrong shape |
| H4 · Trust & adoption | Pathologists will use AI-assisted scoring given the right evidence (reproducibility, validation, human-in-the-loop, audit trail) | Adoption barrier is higher than features can fix |
| H5 · Buyer & integration | There's a real buyer, budget, and integration path (LIS / scanner) that makes adoption feasible | Even a loved product won't sell |

Each question below maps to one or more of these.

## 2. Who to interview

Prioritize the people who *do the scoring* and the people who *buy*.

| Segment | Why they matter | Priority |
|---|---|---|
| **Anatomic / surgical pathologists** (academic + community) | Primary users — they read and score IHC daily | ⭐ Start here |
| **Pathology / medical lab directors** | Clinical authority + budget; own validation & QC policy | ⭐ Start here |
| **Lab managers / operations leads** | Turnaround, throughput, staffing, workflow reality | High |
| **Histotechnologists / IHC lab staff** | Prepare stains & controls — the TriControl™ reality check | Medium |
| **Pharma / CRO pathology teams** | Heavy, protocolized p53/PDL1 use (companion Dx, trials); often earlier adopters of quantification | Medium–High |
| **Oncologists** (report consumers) | Validate downstream value, not buyers | Low (later) |

Aim for **8–12 problem interviews** before drawing conclusions; ≥5 within a single segment before trusting a pattern. Recruit via: existing PCI contacts, LinkedIn (pathology groups), pathology Twitter/X, USCAP/CAP networks, and "who else should I talk to?" referrals at the end of every call.

## 3. Interview design

- **Length:** 30–45 min. **People:** 1 interviewer + 1 notetaker if possible. **Record** (with consent).
- **Two types — keep them separate:**
  - **Problem interviews (do these first):** no demo, no pitch. Understand their world, workflow, and pain.
  - **Solution interviews (later):** show the platform and watch them react. Only after the problem is validated.
- **Leading vs. honest** — examples:
  - ❌ "Wouldn't it be useful if the AI were calibrated to controls?" → ✅ "How do you decide whether to trust a stain run? Walk me through the last time you didn't."
  - ❌ "Do you struggle with scoring consistency?" → ✅ "When did you last disagree with a colleague on a score? What happened next?"
- **Always close the loop:** ask for a commitment or referral (intro, a follow-up with real slides, a pilot) — talk is cheap; advancement is signal.

---

## 4. Question bank

Use as a menu, not a script. Follow the energy; chase specifics ("tell me more about that last time…").

### A. Warm-up & context
1. Tell me about your role and your lab — setting, team size, case mix.
2. Roughly how many IHC cases cross your bench in a week? Which biomarkers most often?
3. Which of p53, PDL1, HER2, MMR do you read most, and for which tumor types?

### B. Current workflow (the spine of the interview)
4. Walk me through the **last p53 (or PDL1) case** you scored — from slide ready to sign-out.
5. Where do you actually look at the slide today — glass at the scope, or digital/WSI? Which scanner?
6. At what magnification do you score, and how do you decide the region you're scoring?
7. How does the score get into the report? How long does that whole loop take?
8. Where do other people touch the case (histotech, second pathologist, transcription)?

### C. Pain, cost & frequency
9. Which part of that workflow is most annoying or slowest? When did it last go wrong?
10. When was the last time two pathologists disagreed on a score? How was it resolved, and what did it cost in time?
11. How often do you re-stain or re-score? What triggers it?
12. If you could wave a wand and fix one thing about IHC scoring, what would it be — and why that?

### D. QC & controls (the TriControl™ wedge)
13. How do you handle controls today — on-slide, separate control slides, tissue vs. cell-line?
14. Walk me through the last time a control failed or looked off. What did you do?
15. How do you know a given stain run is calibrated enough to trust the intensity/percentage?
16. Who owns control quality in your lab, and how is it documented?

### E. Existing tools & alternatives
17. What do you use today for any quantification or image analysis (HALO, Visiopharm, Aperio/Indica, QuPath, eyeballing)? When did you last use it?
18. What do you like about it? What makes you stop using it or distrust it?
19. Have you tried an AI scoring tool? What happened — did it stick? Why / why not?
20. What did adopting (or rejecting) that tool involve — who decided, how long, what killed or closed it?

### F. Trust, validation & regulatory
21. The last time an automated result disagreed with your read — what did you do, and what would you *need* to override your own eyes?
22. What evidence would you need before trusting an AI score on a real case (validation studies, concordance data, reproducibility, transparency)?
23. How much does it matter that the same slide + region always produces the same score? Has variability ever burned you?
24. What's your lab's stance on AI tools re: CLIA / CAP / FDA / RUO-vs-clinical? Who decides what's allowed?
25. Would an audit trail (who scored what, which model version, which controls) matter for your sign-out or inspections? How so?

### G. Solution reactions — *only in a solution interview, after a demo*
26. Show the case → ROI → score flow. *"Talk me through what you think is happening. What's confusing?"*
27. The score is **blocked** unless the required controls passed and magnification is within the cap. *Reaction?* Too strict, about right, or reassuring?
28. The report shows model version, the exact region scored, magnification, and operator. *Does that change your trust? What's missing?*
29. Where would this break or annoy you in your real lab? What would stop you piloting it next month?
30. What's the single most valuable thing here — and the single biggest dealbreaker?

### H. Buying, integration & rollout
31. If your lab wanted this, who has to say yes? Walk me through how a tool like this actually gets bought.
32. What would it have to connect to — LIS (Epic Beaker, Cerner, etc.), scanner, PACS? What integration is non-negotiable?
33. What's the realistic budget envelope for something like this, and is it cap-ex, per-test, or subscription in your world?
34. What would a low-risk first step look like for you (retrospective slides, a single biomarker, a shadow pilot)?

### I. Wrap-up
35. What did I not ask about that I should have?
36. Who else should I talk to — and may I use your name?
37. Would you be open to a follow-up where we run a few of *your* (de-identified) slides through it?

---

## 5. Per-segment emphasis

- **Pathologist** → B, C, D, F, G. The read, the disagreements, the trust bar.
- **Lab / medical director** → C (cost/turnaround), D (QC policy), F (validation/regulatory), H (buying).
- **Lab manager** → B (workflow), C (throughput/turnaround), H (integration/ops).
- **Histotech** → D (controls reality), B (where they touch the case). They'll tell you if TriControl™ is practical.
- **Pharma/CRO** → C (protocol burden), E (existing quantification), F (reproducibility for trials), H (volume contracts).

## 6. Signals — what validation actually looks like

**Green (lean in):**
- Unprompted, vivid stories of scoring variability, re-stains, disagreements, or control headaches.
- They already spend money/time fighting this (existing tools, extra reads, manual QC logs).
- They volunteer slides, a referral, or a pilot without being pushed.
- "Reproducibility" / "trust" / "defensible sign-out" come up *in their words*.

**Red (rethink):**
- Polite interest but no concrete past pain ("sounds cool," "we might…").
- Scoring is "fine, I just eyeball it" with no felt cost — across multiple interviews.
- The controls/calibration angle gets shrugs; they care about something else entirely.
- No one can name who would buy it or how.

Distinguish *compliments* (ignore) from *commitments & specifics* (count).

## 7. After each interview

- Within an hour, write up: the 3 best verbatim quotes, the concrete past behaviors, which hypotheses moved (H1–H5), and the next commitment obtained.
- Log to a shared sheet: segment · biggest pain (their words) · current tool · would-pilot? · referral. Tag against H1–H5.
- After every ~5: review patterns. Update `docs/plan.md` / tickets if findings change priorities (e.g., if integration is the dealbreaker, the LIS path jumps up the roadmap).

## 8. Recruiting outreach (template)

> Subject: 20 minutes on how you score IHC?
>
> Hi Dr. ___ — I'm working on tooling for IHC biomarker scoring (p53/PDL1 and friends), and before
> building further I'm trying to learn how pathologists actually handle scoring and controls today.
> I'm **not selling anything** — I'd just love 20–30 minutes to hear how it works in your lab and
> where it's painful. Would [two time options] work? Happy to share what I learn.

Keep it about *them and their work*, never about the product. The product comes up only if they ask.
