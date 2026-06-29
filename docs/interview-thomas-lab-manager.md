# Interview script — Thomas (clinical lab manager)

**Who:** clinical lab manager; deep on lab operations, not AI/technical. **Goal of this call:**
understand the **end-to-end lab workflow** (specimen → reported, billed result) and **how a backend
like ours would integrate into a real, functioning business** without creating extra work.
**Relationship:** potential future consultant/advisor — so this is also rapport-building, not just extraction.

## How to run it (with a non-technical ops expert)
- **Speak his language:** "the scoring tool / the system," never "AI / model / inference / algorithm / ROI."
- **He's the expert** — let him walk you through *his* world; you're learning, not pitching.
- **Anchor in reality:** "walk me through what actually happens when…" beats any hypothetical.
- **Listen for the gold:** how results get into the LIS, how tools get *bought and validated*, where turnaround time is lost, and what counts as "extra work" on the bench. That's what informs the backend/integration roadmap.
- ~30–40 min. Warm, curious, unhurried.

---

## 1. Open & rapport (2–3 min)
- Thanks for the time — I'm trying to understand how a lab actually *runs*, end to end, before we build more. You know this far better than I do, so mostly I want to listen.
- Quick version of your role and the lab — type (hospital / reference / specialty), size, team, rough monthly volume?

## 2. The end-to-end workflow (the core — 10–12 min)
- **Walk me through what happens to a biopsy from the moment it arrives at the lab until the result reaches the ordering physician.** (Let him narrate; don't interrupt — note every handoff and system.)
- Where does accessioning happen, and how does a case get its number/identity?
- For an IHC stain specifically — grossing → processing → staining → (scanning?) → pathologist → sign-out → report. Where does each step happen and who owns it?
- Which steps are still manual or paper? Where does information get re-typed from one place to another?
- What's your target turnaround time, and where does time *actually* get lost?

## 3. Systems & integration (the backend-fit core — 8 min)
- What systems run the lab day to day? (LIS — which one? Epic Beaker, Cerner, Sunquest…? Plus scanners, any middleware, billing system.)
- How does a result get *into* the LIS and back *out* to the ordering physician? Manually entered, or interfaced?
- When a new instrument or software comes into the lab, **how does it get connected** — who does that, how long does it take, what's the interface (e.g., HL7) and who maintains it?
- If a new scoring system produced a result, **how would it need to land in your workflow so it's not extra work** for the techs or pathologists? What would make it "just another screen to babysit" vs. genuinely useful?
- Where do you see double-entry or swivel-chair work today that drives you crazy?

## 4. QC, controls & compliance (5 min)
- How are controls handled operationally — who preps them, how is QC logged and reviewed?
- When CAP/CLIA inspectors come, what do they look at for IHC — and would they care about software or an instrument that contributes to a result?
- When you bring on a new test or instrument, what's the **validation process** before it's allowed in clinical use? Who signs off?
- What records / audit trail do you have to keep, and for how long?

## 5. Business mechanics — customer → business (5–7 min)
- Who are the lab's "customers" — ordering physicians, hospital service lines, oncology, outside clients, pharma?
- How does the lab actually **get paid** for IHC work — per test, reimbursement, send-out economics? Who handles billing/coding?
- When something is too complex or low-volume, how do you decide to **do it in-house vs. send it out**?
- If the lab wanted a new tool like this, **who has to say yes** — lab director, pathology chair, finance, IT, procurement? Walk me through how that decision actually gets made, and the budget cycle.

## 6. Pain & opportunity (operational lens — 3 min)
- Across that whole workflow, where does it cost you the most — time, money, rework, staffing, stress?
- When did something last go wrong operationally (a re-stain, a delayed sign-out, a billing kickback)? What happened?
- If you could fix one operational thing about how IHC results get produced and delivered, what would it be?

## 7. Advisor soft-close (2–3 min)
- You clearly know this inside-out — honestly, the workflow-and-integration piece is exactly where we're weakest. As we go, we may look for someone to advise on getting this to fit a real lab. **Would that be something you'd be open to exploring down the line?**
- What did I not ask that I should have?
- Who else — a pathologist, an LIS person, a billing lead — would be worth me talking to?

---

## What to capture afterwards (feeds the roadmap)
- **Integration reality** → likely a new ticket (LIS / HL7 result interface); informs `604` deployment and the data layer `302`.
- **Validation / inspection needs** → reinforces `105` audit log, `106` encryption/TLS, `109` validation.
- **Buying process & economics** → the go-to-market / who-signs-off picture (H5).
- **"Extra work" triggers** → product guardrails: results must flow *into* existing systems, not add a screen.
- Note his advisor interest + any referrals.
