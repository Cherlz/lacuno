# Lacuno

_From **lacuna**, Latin for "the gap": Lacuno finds the gaps nobody checked._

**The case conference they never got.**
Other apps store your records. Lacuno connects the dots.

Live: **https://lacuno-app.vercel.app** · Hosted on Vercel

---

## The community

Adult children coordinating care for a parent who has seen several doctors and still has no clear diagnosis, often carrying records across clinics and languages.

This started with our own family. My mother has had dizziness, fatigue and weakness for years. Different doctors suggested different causes: her inner ear, her bones. Each saw a few minutes of the story and started from zero. None of them saw the whole picture. We carry the papers between visits.

## The problem

- Each specialist sees only their slice and rarely sees the others' notes.
- Short visits mean every new doctor starts from zero.
- Details between visits get forgotten.
- Records are handwritten, messy, spread across systems, or in a different language from the doctor's.
- Families without medical training end up doing the coordinating.

## What it does

<!-- Add screenshots: records with a flagged line, disagreement map, case conference, brief in two languages -->

1. **Collect.** Photograph or upload every record: notes, labs, scan reports, prescriptions, in any language. Claude reads each one and extracts the date, doctor, specialty, what they suspected, tests, results and medicines, quoting the original text under every item. Text it cannot read is flagged, not guessed. The family checks each record against the original and confirms it. Only confirmed records go any further.
2. **Disagreement map.** Every possibility a real doctor raised, who raised it and when, what in the records fits, what doesn't, and what was never checked. Also *loose ends*: tests ordered with no result on file, abnormal results nobody mentioned again.
3. **Case conference.** Six specialty reviewers sit around the case file (balance and ear, nervous system, heart, hormones and metabolism, muscles and bones, and a pharmacist). Each reads the *whole* record and reports only what matters to its area: what it would want checked or ruled out, and questions to ask. None of them names a cause.
4. **Doctor brief.** One page a doctor can read in about 60 seconds, in the doctor's language, plus a warm plain-language version in the family's language. Save as PDF; the family version can be read aloud.
5. **Accounts.** Sign up or sign in with Auth0 (Google or email). Each account gets its own case files on the device, so family members sharing a phone don't see each other's records, and only signed-in people can use the Claude-powered features.
6. **Guided flow.** A "Do this next" card and a Records → Review → Brief step bar on every screen, one record checked at a time, and a How-to-use page (`/help`).
7. **Phone as camera.** On a laptop, tap **Use my phone**, scan the QR code, and photograph pages with the phone; they arrive on the laptop as records. Photos travel device to device over an encrypted WebRTC connection (PeerJS only introduces the two devices) and are never stored on a server.
8. **Visit reminders.** Add the next doctor visit and tap **Add to my calendar**: the phone's own calendar reminds the family the day before and 2 hours before, with a link to the brief. Nothing is sent to a server.
9. **Episode log.** One button. Say or type what happened, in any language; Claude structures it. Emergency warning signs show **"Seek emergency care now"** and nothing else.

## How Claude is used

All calls use `claude-opus-5-5` through the Anthropic TypeScript SDK, with **structured outputs** (Zod schemas) so every response is typed and validated.

| Step | Where | What Claude does |
|---|---|---|
| Document reading | `src/app/api/extract` | Vision and PDF input. Reads handwritten, photographed and multilingual records; extracts structured fields with the original text quoted; flags unreadable text with an uncertainty level |
| Disagreement map | `src/app/api/map` | Reasons across conflicting records from different doctors; merges the same idea written differently; finds gaps and loose ends |
| Case conference | `src/app/api/lens` | Six independent calls, one per specialty lens, run in parallel, each with its own focus and the same safety rules |
| Brief | `src/app/api/brief` | Writes for two audiences in two languages; notes uncertain translations |
| Medicine-check agent | `src/lib/medcheck.ts` | Tool use: Claude looks up each medicine in the **openFDA drug label API** (translating local and brand names, retrying alternatives), then compares the official label with the patient's symptoms. Every quoted side effect is verified word-for-word against the label text openFDA returned; anything else is dropped. Results are framed as questions for the doctor, with a link to the full label |
| Fact-checker agent | `src/lib/verify.ts` | A second, independent Claude pass audits every statement in the map, specialist views and brief against the records it cites; removes unsupported or diagnosis-like statements and corrects overstated ones. The app shows "✓ Fact-checked: N points checked" |
| Episode log | `src/app/api/episode` | Structures messy spoken or typed descriptions; second-layer danger check |

It is a multi-step pipeline with human confirmation points: **read → family confirms → cross-check → specialty reviews → compose the brief → independent fact-check**. Shared safety rules live in `src/lib/claude.ts`; output schemas live in `src/lib/schemas.ts`. Server-side refusal fallback is enabled, so if a safety classifier declines a medical document, the request is retried on a fallback model.

**Why not just ask Claude in a chat?** A case file that grows over months, data the family has checked, a source link on every claim, built-in safety checks, finished outputs (a PDF brief), and a flow for families who would never write a good prompt.

## Where it could go wrong

| Risk | Who it hurts | Safeguard (in the product) |
|---|---|---|
| Misreading handwriting or a scan | Patient gets a wrong summary | Every extraction is checked by the family next to the original. Unreadable text is flagged in amber, never guessed, and the family can type what it says |
| Analysis that looks like a diagnosis | Patient trusts the app over doctors | Rules in every prompt: no diagnosis, no ranking, no "most likely". Lenses give checks and questions only. Disclaimer on every analysis screen |
| Hallucinated details | Doctor is misled | A separate fact-checker agent audits every statement against its cited records and removes or corrects anything unsupported. Every finding must cite source record IDs. Findings with missing or unknown sources are **removed** (on the server and again on the device). Each one links to the original page |
| Translation errors | Doctor or family misunderstands | Original wording is shown under every extracted item; uncertain terms are listed in "translation notes" on the brief |
| Missing an emergency | Patient waits instead of getting care | An instant on-device keyword check (English, Indonesian, Spanish) runs before anything is sent, and Claude runs a second check. Either one triggers a full-screen emergency message |
| Privacy breach | Patient | Case data lives only on the device. Our server stores nothing |
| Families relying on the app instead of care | Patient | Every output points back to the doctor. The goal is better appointments, not replacing them |

Known limits today: the on-device danger check covers three languages (Claude covers the rest); the app's own menus are English only (all generated content follows the chosen languages); the emergency call button dials 112.

## Privacy and responsible design

- **Local-first.** Patient profile, documents, extractions, analyses and episodes are stored in the browser (IndexedDB), in a separate store for each signed-in account. Accounts (Auth0) only identify who is using the app; no medical data is stored with them. Account separation keeps case files apart in the app; it is not encryption of the device's storage.
- **Protected AI routes.** When accounts are on, every API route requires a signed-in session, so the Claude key can't be used anonymously.
- **What leaves the device.** To read and analyse records, the document (or the confirmed text) is sent to Anthropic's API through our server, which keeps nothing. If ElevenLabs read-aloud is enabled, the family summary text is sent to ElevenLabs to generate audio.
- **Secrets.** API keys live in server environment variables only, never in the browser or the repo.
- **Deleting.** "Delete case file from this device" on the profile screen removes everything.

## Impact

Measured with the built-in **Impact** screen (`/impact`): family before/after check-ins, a timed doctor test (original records vs. the brief), and extraction accuracy calculated automatically from what the family kept or corrected. Results export as JSON.

| Metric | Result |
|---|---|
| Families tested | _TODO_ |
| Family confidence before → after (1–10) | _TODO_ |
| "Did this help you prepare for your next visit?" | _TODO_ |
| Doctor time to understand: records only → brief | _TODO_ |
| Doctor usefulness (1–5) / would want it from patients | _TODO_ |
| Extraction items kept unchanged after family check (real records) | _TODO_ |

> _Tester and doctor quotes go here, with permission._

## Path to production

**Product.** End-to-end encrypted sync of case files across a family's devices (the account system is already in place). Native iOS and Android apps (home-screen widget and voice-assistant logging, smartwatch episode logging, Apple Health / Health Connect data for sleep and heart rate). App-store releases allow for TestFlight and Play testing tracks plus review periods.

**Integrations.** Import from hospital portals through SMART on FHIR with patient consent; consent-based links to national platforms (e.g. Indonesia's SATUSEHAT); a read-only, expiring share link (QR) to the brief for the doctor's device; doctors adding notes back through that link.

**Compliance.** Data minimisation by design (local-first, stateless server). For a production launch: HIPAA (US) with a BAA-covered model provider and hosting, GDPR (EU), and Indonesia's Personal Data Protection Law (UU PDP No. 27/2022). Medical-device positioning stays clearly outside diagnosis: organising and summarising records, with clinical decisions left to clinicians.

**Cost.** Roughly one extraction call per page, plus one map, six lens calls and one brief per review. _TODO: measure the average cost per case from real runs._

**Go-to-market.** Patient advocacy groups for undiagnosed conditions, caregiver communities, and clinics that receive referrals with long histories.

**Quality.** An evaluation set of anonymised, labelled records to track extraction accuracy and safety-rule adherence on every prompt change.

## Accessibility

- 17 languages for summaries, briefs and voice logging, with right-to-left support for Arabic.
- Mobile-first: large touch targets (at least 44 px), bottom navigation, camera capture, photos downscaled before upload for slow connections and low-cost phones.
- Read-aloud of the family brief (ElevenLabs multilingual voice when configured, otherwise the browser voice) for relatives who struggle with reading or have low vision.
- Voice episode logging in the family's language; typing always works.
- Plain-language family version, written for someone with no medical training.
- Dark mode, and a print layout for the PDF.

## Tech stack and hosting

Next.js 15 (App Router, TypeScript) · Tailwind CSS 4 · Anthropic TypeScript SDK · Zod · Auth0 (`@auth0/nextjs-auth0`) · IndexedDB (`idb`) · Web Speech API · ElevenLabs (optional) · installable PWA.

Hosting: **Vercel** at https://lacuno-app.vercel.app (deploys from `main` on every push; secrets set as environment variables). A Docker image with Caddy HTTPS is also included for self-hosting on any server (`deploy/setup.sh`).

## What's real vs. simulated

- **Real:** every Claude call, the extraction, map, case conference, brief and episode structuring. Nothing in the app is pre-written output.
- **Sample data:** the "Ibu Sari" and "Rosa" cases are fictional documents written for demonstration and are labelled **Sample** everywhere they appear, including on the brief and the PDF.
- **Demo patient 1:** _TODO: the builder's mother's records, used with permission, names blurred._

## Run locally

```bash
cp .env.example .env.local
npm install
npm run dev
```

Environment variables (names only):

- `ANTHROPIC_API_KEY` (required)
- `ELEVENLABS_API_KEY`, `ELEVENLABS_VOICE_ID`, `ELEVENLABS_MODEL_ID` (optional)
- `AUTH0_DOMAIN`, `AUTH0_CLIENT_ID`, `AUTH0_CLIENT_SECRET`, `AUTH0_SECRET`, `APP_BASE_URL` (optional; turns on accounts)

On the home page, choose a sample case to try the full flow without real records.

## Built with Claude Code

The app was built with Claude Code: scaffolding, the API routes and schemas, the local-first data layer, and the UI. Claude Code also drove a headless-browser walkthrough of the whole flow on a phone-sized screen to catch layout and state bugs. Claude was used to write the fictional sample records. _TODO: describe the safety-rule stress test once run (e.g. adversarial records asking for a diagnosis, emergency phrasings in several languages)._

## Project layout

- `src/lib/schemas.ts`: output schemas for every Claude call
- `src/lib/claude.ts`: shared safety rules, the structured-output call and error handling
- `src/app/api/*`: stateless routes (`extract`, `map`, `lens`, `brief`, `episode`, `speak`)
- `src/lib/db.ts`, `useCase.ts`, `actions.ts`: on-device storage and client actions
- `src/lib/danger.ts`: on-device emergency check
- `src/lib/sources.ts`: removes any finding without a valid source
- `src/lib/metrics.ts`, `src/app/impact`: impact measurement
- `src/lib/samples.ts`: fictional sample cases
