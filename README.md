# Throughline

**Other apps store your records. Throughline connects the dots.**

For families coordinating care for someone who has seen several doctors without a clear diagnosis. Upload every record (photos or PDFs, any language, handwritten is fine); Throughline shows where the doctors disagree, gives the case the multi-specialist review it never got, and hands the next doctor a one-page brief in their own language.

## Core flow

1. **Collect** (`/records`): Claude reads each document and extracts date, doctor, specialty, suspected causes, tests, results and medicines, quoting the original text. Unreadable text is flagged, never guessed. The family confirms or corrects each record; only confirmed records are used downstream.
2. **Case review** (`/review`)
   - *Disagreement map*: every possibility a real doctor raised, who raised it and when, what fits, what doesn't, what was never checked, plus loose ends (tests ordered with no result, etc.).
   - *Case conference*: six specialty lenses (balance/ear, nervous system, heart, hormones, muscles/bones, pharmacist) each review the whole record and list only what is relevant, what they'd check, and questions to ask.
3. **Brief** (`/brief`): a 60-second doctor version in the doctor's language and a plain family version in the family's language. Save as PDF via print. Read-aloud uses the browser voice.
4. **Episode log** (`/episodes`): voice or text in any language, structured by Claude. Emergency signs show "Seek emergency care now" and nothing else.

## Safeguards

| Risk | Safeguard |
|---|---|
| Misread handwriting | Every extraction is confirmed by the family next to the original; unclear text is flagged with no guessing |
| Looks like a diagnosis | Safety rules in every prompt; no ranking; lenses give questions, not answers; disclaimer on analysis screens |
| Hallucinated details | Every finding carries `source_ids`; findings with missing or unknown sources are removed (server and client) and each one links to its source document |
| Translation errors | Original text shown beside each extracted item; uncertain terms listed in translation notes |
| Missed emergency | An instant offline keyword check (EN/ID/ES) runs first, with Claude's check as a second layer |
| Privacy | All case data lives in the browser (IndexedDB). API routes are stateless and store nothing |

## Run locally

```bash
cp .env.example .env.local   # add ANTHROPIC_API_KEY
npm install
npm run dev
```

Click "explore a sample case" on the home page to load a fictional, clearly labelled case (Indonesian → English, or Spanish → English).

## Stack

Next.js 15 (App Router, TypeScript), Tailwind CSS 4, the Anthropic TypeScript SDK (`claude-opus-5-5`, structured outputs with Zod, server-side refusal fallback), and IndexedDB via `idb`. Installable as a PWA (manifest). Deploy to DigitalOcean App Platform with `.do/app.yaml`.

## Layout

- `src/lib/schemas.ts`: Zod schemas for every Claude output
- `src/lib/claude.ts`: the shared safety rules and structured-output call
- `src/app/api/*`: extract, map, lens, brief and episode routes (stateless)
- `src/lib/db.ts`, `useCase.ts`, `actions.ts`: local-first storage and client actions
- `src/lib/samples.ts`: fictional sample cases
