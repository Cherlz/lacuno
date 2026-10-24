# Devpost draft

**Title:** Lacuno
**Name:** from *lacuna*, Latin for "the gap"
**Tagline:** The case conference they never got.

## Inspiration
My mother has had dizziness, fatigue and weakness for years. Four doctors, four different ideas: inner ear, bones, nerves, "just tiredness". Each saw a few minutes of the story. None saw the whole picture. My family carries the papers between them, in Indonesian, from clinic to clinic.

We built Lacuno for **adult children coordinating care for a parent who has seen several doctors without a diagnosis**, often across clinics and languages.

## What it does
Upload every record (photos or PDFs, handwritten, any language). Lacuno:
1. **Reads** each record and asks the family to check it next to the original. Unreadable text is flagged, never guessed.
2. **Maps the disagreement:** every possibility a doctor raised, what fits, what doesn't, and what nobody ever checked.
3. **Convenes a case conference:** six specialty reviewers each read the whole case and list what they'd check and what to ask. No one names a cause.
4. **Writes the brief:** one page the next doctor reads in about 60 seconds, in their language, plus a plain version for the family in theirs. PDF, and read-aloud.
5. **Logs episodes** by voice, with a danger-sign check that overrides everything.

Every claim links back to the page it came from.

## How we built it
Next.js 15 + TypeScript, mobile-first PWA, Tailwind. **Claude (claude-opus-5-5) via the Anthropic SDK** with structured outputs (Zod):
- **Vision and PDF reading** of messy, handwritten, multilingual records into structured fields with original quotes
- **Cross-document reasoning** for the disagreement map
- **Six parallel specialty calls** for the case conference, under shared safety rules
- **Two-audience, two-language writing** for the brief
- **Structuring** of spoken symptom logs, with a second-layer emergency check

Accounts with **Auth0** (Google or email sign-up); each account's case files stay on the device (IndexedDB), and the Claude-powered API routes only answer signed-in users. The server is stateless. Hosted on Vercel at https://lacuno-app.vercel.app. Read-aloud via ElevenLabs' multilingual voice (if built and demoed).

## Where it could go wrong (and what we did)
- **Misread handwriting:** family confirmation beside the original; unreadable text is flagged.
- **Looks like a diagnosis:** no ranking and no "most likely", enforced in every prompt; lenses give questions only.
- **Hallucination:** every finding must cite its source record; unsourced findings are deleted before display.
- **Translation:** the original wording is shown with each item; uncertain terms are listed.
- **Missed emergency:** an instant on-device check plus Claude's check; a full-screen "Seek emergency care now".
- **Privacy:** local-first, nothing stored on the server.

## Impact (this weekend)
_TODO: N families, confidence X → Y, Z/N said it helped them prepare; doctor time-to-understand A s (records) → B s (brief), usefulness C/5; extraction items kept unchanged D% on real records. Quotes with permission._

## Path to production
Native apps (widgets, voice and smartwatch logging, Apple Health / Health Connect), SMART on FHIR import with consent, national platforms (e.g. SATUSEHAT), expiring QR share links, and HIPAA / GDPR / UU PDP compliance. See the README for details.

## What's next
Talk to more families, run the doctor test with more clinicians, and open the waitlist through caregiver communities.

## Built with
nextjs, typescript, react, tailwindcss, anthropic-claude, claude-code, zod, indexeddb, web-speech-api, vercel

## Tracks to opt into
MLH Best Use of Auth0 · Anthropic (Claude for Public Benefit) · Microsoft Built for the Real World · Microsoft Customer Impact · Best People-First · Most Creative · Commit Fellowship (if team) · MLH Gen AI / ElevenLabs only if listed at mlh.link/calhacks13 · DEV Writing Challenge (after the event)
