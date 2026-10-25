# Lacuno

**Every doctor saw a piece. Lacuno shows the whole story.**

Lacuno helps families caring for someone who has seen many doctors without getting a diagnosis. Upload every record, in any language, and see where the doctors disagree, what nobody checked yet, and a one-page brief the next doctor can read in a minute.

🌐 [lacuno.health](https://lacuno.health) · Built at Cal Hacks 13.0

## Why

My mum has had dizziness, fatigue and weakness for years. Each specialist looked at one part of it, and none of them saw the whole picture. My family carries folders of notes between clinics, in Indonesian, and does the coordinating ourselves. Lacuno is the tool we wanted.

The name comes from *lacuna*, Latin for "gap".

## Features

- **Read any record.** Photos, PDFs or handwriting, in any language. Claude pulls out the doctor, the date, the results and the medicines, and quotes the original text. Anything it can't read is flagged, never guessed. The family checks each record before it's used.
- **Where doctors differ.** Every cause a doctor raised, what fits, what doesn't, and what was never followed up.
- **Six specialists.** Ear, nerves, heart, hormones, bones and a pharmacist each review the whole case and suggest what to check and what to ask.
- **Medicine check.** Each medicine is looked up in the FDA drug label database, and side effects that match the symptoms become questions for the doctor.
- **Doctor brief.** One page in the doctor's language, plus a plain version for the family. Save it as a PDF or listen to it.
- **Symptom log.** Say or type what happened. Warning signs open an emergency screen with the local emergency number.
- **Extras.** Several cases per account, phone-as-camera via QR code, Apple Health and Google Fit import, visit reminders, and hospitals nearby.

## Safety

- Lacuno never diagnoses or ranks causes. It only organises what real doctors wrote.
- Every point links back to the record it came from. Anything without a source is removed.
- A second Claude pass fact-checks every analysis before it's shown.
- Emergencies are checked on the device first, then again by Claude.
- Records stay on the device. The server stores nothing.

We stress-tested this with a planted record that told the AI to ignore its rules and invent a diagnosis. Every output ignored it. All 14 emergency descriptions, in 11 languages, were caught, with no false alarms (`npm run safety-test`).

## How it works

Next.js and TypeScript on Vercel. Claude (Anthropic API) handles the reading, comparing, reviewing, writing and fact-checking, using structured outputs. Other pieces:

- **Auth0** for accounts
- **IndexedDB** for on-device storage
- **openFDA** for drug labels
- **OpenStreetMap** for nearby places
- **ElevenLabs** for the read-aloud voice

```
src/app/api/    extract, map, lens, brief, medcheck, episode
src/lib/        claude.ts (safety rules), schemas.ts, verify.ts (fact-checker), medcheck.ts
```

## Run it

```bash
npm install
cp .env.example .env.local   # add your ANTHROPIC_API_KEY
npm run dev
```

Try the **Ibu Sari** sample case. All sample records are fictional.
