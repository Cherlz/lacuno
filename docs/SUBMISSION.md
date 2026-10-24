# Cal Hacks 13.0 submission checklist

**Hard deadline: Sunday, Oct 25, 2026, 9:00 AM PDT** on Devpost (cal-hacks-13-0.devpost.com). Aim to submit by **8:00 AM** and edit afterwards if allowed. Re-check the official rules on Devpost; the items below come from the event page and opening ceremony.

## Required
- [ ] **Team of 2–4**, every member accepted and checked in. Add all teammates to the Devpost project.
- [ ] **Project text**: paste from `docs/devpost.md`, with every `_TODO_` filled with real results.
- [ ] **Demo video** (clear and meaningful; sponsors judge asynchronously from it). Script below. Upload to YouTube (unlisted is fine) and paste the link.
- [ ] **Project image(s)**: screenshots from the real app (list below).
- [ ] **GitHub repository** link: https://github.com/Cherlz/lacuno (public, no secrets in it).
- [ ] **Live or recorded demo** at judging: the app open on a phone with a case loaded.
- [ ] **Opt in to every prize track** listed at the bottom of `docs/devpost.md`.
- [ ] **Sponsor extras**: Commit Fellowship supplemental form; check any sponsor-specific rules (Anthropic, Microsoft, MLH).

## Before recording and judging
- [ ] Run the full flow once on the live site, signed in: sample case → check 5 records → Review my case → Write the brief → Save as PDF → log a symptom → emergency test.
- [ ] Load the demo case fresh just before judging (samples reload from Home).
- [ ] Phone charged, app installed on the home screen ("Get the Lacuno app" on Home).
- [ ] Backup: the demo video downloaded on the laptop, in case the Wi-Fi fails.

## Screenshots to take (real app, real results)
1. Records: a record with the orange "couldn't read, so we didn't guess" box
2. Review → Where doctors differ
3. Review → Specialist views (the six reviewers)
4. Brief → doctor version (English) and family version (Indonesian)
5. A source page opened from a 📄 tag
6. The emergency screen

## Demo video script (about 2½ minutes)

| Time | Show | Say |
|---|---|---|
| 0:00–0:20 | Your face or a photo of the folder of papers | "My mom has had dizziness, fatigue and weakness for years. Different doctors, different ideas, no diagnosis. Each sees a few minutes of the story. My family carries the papers between them, in Indonesian." |
| 0:20–0:30 | Lacuno home screen | "Lacuno is for families like mine: it gives the case the review it never got." |
| 0:30–1:00 | Records: photo a page, the reading appears, tap **Looks right**; show a flagged unreadable line | "Claude reads every record, any language, even handwriting. When it can't read something, it says so instead of guessing, and the family checks every record." |
| 1:00–1:40 | **Review my case** → Where doctors differ → Specialist views | "One tap compares every doctor: what each one suspected, what fits, what doesn't, and what was never checked. Then six specialists each review the whole record and list what they'd check. None of them diagnoses." |
| 1:40–2:05 | Brief: English doctor version, switch to Indonesian family version, Save as PDF; tap a 📄 source | "The next doctor gets one page in English they can read in a minute. My family gets the same story in Indonesian. Every point links back to the page it came from." |
| 2:05–2:20 | Medicines tab (an FDA label match), then Log a symptom → emergency screen | "A second agent checks every medicine against official FDA labels and turns matches into questions for the doctor. Between visits we log symptoms by voice, and emergency signs override everything." |
| 2:20–2:35 | Impact numbers / a quote | "_TODO: your real test results, e.g. a doctor understood the case in X seconds instead of Y._ Lacuno: the case conference they never got." |

## Judge Q&A (short answers)
- **"Isn't this diagnosing?"** No. It never names a cause or ranks possibilities. It organises what real doctors wrote and turns gaps into questions for the next doctor.
- **"Why not just ask Claude?"** A case file that grows over months, records the family has checked, a source link on every claim, safety checks in code, and finished outputs (a PDF brief), in a flow families can use without writing prompts.
- **"Privacy?"** Records stay on the device, separately per account; the server stores nothing.
- **"Where could it go wrong?"** Misreading, looking like a diagnosis, hallucination, translation, missed emergencies, privacy. Each has a safeguard you can see in the app (README table).
- **"How do you know it helps?"** _TODO: your doctor and family test results from the Impact screen._
- **"What's next?"** Encrypted sync, native apps, hospital import via SMART on FHIR, and measuring visits that end with a clear next step.
