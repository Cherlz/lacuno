# Devpost submission text

Paste each section into the matching Devpost field. Fill every `_TODO_` with real results before submitting; never estimate them.

---

**Project name:** Lacuno

**Tagline (elevator pitch):** The case conference they never got. Lacuno connects every doctor's records, shows where they disagree and what nobody checked, and hands the next doctor a one-page brief in their language.

**Try it out:**
- Live app: https://lacuno-app.vercel.app
- Code: https://github.com/Cherlz/lacuno

---

## Inspiration

My mother has had dizziness, fatigue and weakness for years. Different doctors suggested different causes: her inner ear, her bones. Each saw a few minutes of the story and started from zero. None of them saw the whole picture. My family carries folders of papers between clinics, in Indonesian, and does the coordinating ourselves.

We built Lacuno for **adult children coordinating care for a parent who has seen several doctors and still has no clear diagnosis**, often across clinics and languages. The name comes from *lacuna*, Latin for "the gap": the app finds the gaps nobody checked.

## What it does

1. **Collect.** Photograph or upload every record (doctor notes, lab results, scan reports, prescriptions), handwritten and in any language. Claude reads each one: date, doctor, specialty, what they suspected, tests, results, medicines, with the original wording under every item. Anything unreadable is flagged, never guessed. The family checks each record against the original with one tap: **Looks right** or **Fix something**.
2. **Review.** One button runs two things together:
   - **Where doctors differ:** every possibility a real doctor raised, who raised it and when, what in the records fits, what doesn't, and what was never checked, plus loose ends such as tests ordered with no result on file.
   - **Specialist views:** six specialty reviewers (balance and ear, nervous system, heart, hormones and metabolism, muscles and bones, and a pharmacist) each read the whole record and list only what matters to their area: what to check, and questions to ask. None of them names a cause.
3. **Brief.** One page the next doctor can read in about a minute, in the doctor's language, plus a plain version in the family's language. Save as PDF, or listen to the family version read aloud.
4. **Log symptoms** between visits by voice or text. Emergency warning signs override everything with "Seek emergency care now".

**Every claim links back to the page it came from.** The app is guided: a "Do this next" card and a three-step menu (Records → Review → Brief) mean a family never has to work out what to do. It installs on a phone like an app, with no app store.

## How we built it

- **Next.js 15 + TypeScript**, mobile-first and installable (web app manifest + service worker), Tailwind CSS.
- **Claude (`claude-opus-5-5`) through the Anthropic SDK**, always with **structured outputs** (Zod schemas):
  - **Vision and PDF input** to read messy, handwritten, multilingual records into fields with original quotes and an "unclear" list
  - **Cross-document reasoning** for the disagreement map
  - **Six parallel specialty calls** for the case conference, under shared safety rules
  - **Two-audience, two-language writing** for the brief, with translation notes
  - **Structuring spoken symptom logs**, plus a second-layer emergency check
- **Fact-checker agent:** after every analysis, a second, independent Claude pass audits each statement against the records it cites. Unsupported or diagnosis-like statements are removed, overstated ones are corrected, and the app shows "✓ Fact-checked: N points checked against the records".
- **Safety in code, not just prompts:** every finding must carry source record IDs; findings with missing or unknown sources are removed on the server and again on the device. An on-device keyword check catches emergency signs before anything is sent.
- **Auth0** for sign-up and sign-in. Each account's case files are stored **on the device** (IndexedDB); the server stores nothing, and the Claude-powered routes only answer signed-in users.
- Hosted on **Vercel**. Built with **Claude Code**.

## Where it could go wrong, and what we did

| Risk | Who it hurts | Safeguard |
|---|---|---|
| Misread handwriting or scan | Patient gets a wrong summary | Every record is checked by the family next to the original; unreadable text is flagged, never guessed |
| Analysis that looks like a diagnosis | Patient trusts the app over doctors | No diagnosis and no ranking, enforced in every prompt; specialists give checks and questions only; disclaimer on every analysis screen |
| Hallucinated details | Doctor is misled | An independent fact-checker agent audits every statement against its sources; unsourced findings are deleted before display; tap any point to see the original page |
| Translation errors | Doctor or family misunderstands | Original wording shown with each item; uncertain terms listed in translation notes |
| Missing an emergency | Patient waits instead of getting care | Instant on-device check plus Claude's check; full-screen "Seek emergency care now" |
| Privacy breach | Patient | Records stay on the device; the server keeps nothing; separate case files per account |
| Relying on the app instead of care | Patient | Every output points back to the doctor; the goal is better appointments |

## Challenges we ran into

- **Being useful without diagnosing.** The value is in connecting dots, but connecting dots can easily turn into "you probably have X". We split the work so the map only organises what real doctors wrote, and the specialists only list checks and questions, never conclusions.
- **Honest uncertainty without noise.** Our first version flagged every ambiguity, so families saw five warnings on a readable note. We narrowed "unclear" to text that is physically unreadable, which made the flags meaningful.
- **Privacy with accounts.** We wanted sign-in without putting health records on a server, so each account gets its own on-device case file and the server stays stateless.

## Accomplishments that we're proud of

- The full flow works end to end on a phone: photo → checked record → disagreement map → six specialist views → bilingual PDF brief.
- Every claim is traceable to its source page, enforced in code.
- It reads records written in Indonesian and hands an English-speaking doctor a one-page brief.

## What we learned

_TODO: one or two honest lessons, ideally from testing with families or a doctor._

## Impact (measured this weekend)

Measured with the app's built-in Impact screen (family before/after check-ins, a timed doctor test, and extraction accuracy calculated from family corrections).

- Families tested: _TODO_
- Family confidence before → after (1–10): _TODO_
- "Did this help you prepare for your next visit?": _TODO_
- Doctor time to understand, records only → with the brief: _TODO_
- Doctor usefulness (1–5) / would want it from patients: _TODO_
- Extraction items kept unchanged after family check, on real records: _TODO_

> _TODO: quotes from testers or a doctor, with permission._

## What's next for Lacuno

- **Production:** end-to-end encrypted sync across a family's devices; native iOS and Android apps (widgets, voice and smartwatch symptom logging, Apple Health / Health Connect).
- **Integrations:** consent-based import from hospital portals via SMART on FHIR and national platforms (e.g. Indonesia's SATUSEHAT); a read-only, expiring QR link to the brief for the doctor's device.
- **Compliance:** HIPAA (US), GDPR (EU) and Indonesia's personal data protection law (UU PDP No. 27/2022).
- **Measure what matters:** visits that end with a clear next step, repeat tests avoided, time to diagnosis, and families still using it after 1 and 3 months.

## What's real vs. sample data

Every Claude call in the app is real. The "Ibu Sari" and "Rosa" cases are fictional sample documents written for the demo and are labelled **Sample** everywhere they appear. _TODO: if you demo real family records, say they are used with permission and personal details are blurred._

---

**Built with:** nextjs, typescript, react, tailwindcss, anthropic-claude, claude-code, zod, auth0, indexeddb, pwa, web-speech-api, vercel

**Prize tracks to opt into:**
- Anthropic: Claude for Public Benefit
- Microsoft: Built for the Real World (Grand Prize)
- Microsoft Customer Impact Award
- Cal Hacks: Best People-First Hack
- Cal Hacks: Most Creative Hack
- Cal Hacks: Most Technically Complex Hack
- MLH: Best Use of Gen AI
- MLH: Best Use of Auth0
- MLH: Best .Tech Domain Name (only if you registered lacuno.tech)
- MLH: Best Use of ElevenLabs (only if an ElevenLabs key is set and it works in the demo)
- MLH: Commit Fellowship (fill in their supplemental form too)
- After the event: DEV Writing Challenge (dev.to/mlh-hackathon)
