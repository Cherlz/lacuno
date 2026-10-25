# Lacuno: team handoff

**Deadline: Sunday Oct 25, 9:00 AM PDT** on Devpost (hard deadline). Aim to submit by **8:00 AM**.

- Live app: https://lacuno-app.vercel.app
- Repo: https://github.com/Cherlz/lacuno
- What the app does, how Claude is used, safety design: `README.md`
- Devpost text to paste: `docs/devpost.md` · Submission checklist, demo script, judge Q&A: `docs/SUBMISSION.md`

## 1. Get set up (10 min)

```bash
git clone https://github.com/Cherlz/lacuno
cd lacuno
npm install
cp .env.example .env.local     # then add ANTHROPIC_API_KEY (ask Cheryl, or use your own key)
npm run dev                    # http://localhost:3000
```

- Without the `AUTH0_*` variables, login is simply switched off locally. That's fine for UI work.
- Try the flow with **My case → Ibu Sari sample** (fictional records).
- Before pushing: `npm run lint` and `npm run build` must both pass.

## 2. Rules (please read)

1. **Never commit secrets.** API keys go in `.env.local` (git-ignored) or Vercel settings, never in code.
2. **`main` deploys straight to the live site.** Work on a branch and open a pull request; Vercel builds a preview link for every PR so you can check it on a phone. Merge only when it builds.
3. **Pull before you start** (`git pull`) and push small changes often, to avoid conflicts.
4. **Never invent results.** Impact numbers and quotes in the README/Devpost must come from real testing (the Impact screen at `/impact`). Leave `_TODO_` if you don't have them yet.
5. **Safety wording stays.** The app never diagnoses, never ranks causes, and never tells anyone to stop a medicine. Don't remove the disclaimers.
6. **Sample data is fictional and labelled "Sample".** Real family records are used only with permission and never committed to the repo.

## 3. Where things live

| Area | File |
|---|---|
| Homepage (`/`) | `src/app/page.tsx` |
| Case dashboard (`/case`) | `src/app/case/page.tsx` |
| Records (upload + check) | `src/app/records/page.tsx` |
| Review (map, specialists, medicines) | `src/app/review/page.tsx` |
| Brief + PDF | `src/app/brief/page.tsx`, `src/components/BriefViews.tsx` |
| Symptom log + emergency screen | `src/app/episodes/page.tsx` |
| Help page | `src/app/help/page.tsx` |
| Header, menus, layout | `src/components/AppShell.tsx` |
| Buttons, cards, colors | `src/components/ui.tsx`, `src/app/globals.css` (color tokens at the top) |
| Claude prompts + safety rules | `src/lib/claude.ts`, `src/app/api/*/route.ts` |
| Agents | `src/lib/verify.ts` (fact-checker), `src/lib/medcheck.ts` (openFDA medicine check) |

## 4. To-do list

Put your name next to what you take, in the team chat.

### A. Must do before submitting (highest priority)
| Task | Owner | Notes |
|---|---|---|
| Test the full live flow once, signed in | | Ibu Sari → check 5 records → Review my case (all 3 tabs) → Write the brief → Save as PDF → Log a symptom → emergency test. Report anything broken. |
| Real-world testing | | 2–5 families + ideally 1 doctor, using the Impact screen (`/impact`). Export the results (Download button). |
| Fill every `_TODO_` | | `README.md` and `docs/devpost.md`, with real results only |
| Screenshots | | List in `docs/SUBMISSION.md` |
| Demo video (2–3 min) | | Script in `docs/SUBMISSION.md`; upload to YouTube (unlisted) |
| Devpost submission | | Add all teammates (team of 2–4), paste text, video, images, repo link, tick every track in `docs/devpost.md` |

### B. Product work (pick one, branch + PR)
| # | Task | Owner | Notes |
|---|---|---|---|
| 1 | **UI/UX polish**: Records, Review results, Brief, overall look | | Make it calmer and clearer: less text per screen, stronger hierarchy, consistent spacing. Check on a phone. |
| — | Real push notifications (optional) | | Calendar reminders are done. Push would need Upstash Redis (Vercel → Storage), VAPID keys, `web-push`, and a daily Vercel Cron. iPhone only after installing the app. |
| 8 | Health data import (stretch) | | Import an Apple Health / Google Fit export (sleep, heart rate) as questions for the doctor. Phone-as-camera is done. |
| 4 | Demo video on the Help page | | No code needed: after uploading to YouTube, add `NEXT_PUBLIC_DEMO_VIDEO_URL` (the YouTube link) in Vercel → Environment Variables and redeploy. It appears at the top of the Help page. |

### C. Setup tasks (no coding)
| # | Task | Owner | Notes |
|---|---|---|---|
| 2 | Help contact email | | Create a team inbox (e.g. a new Gmail), then add `NEXT_PUBLIC_SUPPORT_EMAIL` in Vercel → Environment Variables and redeploy. The Contact section appears by itself. |
| 6 | Final domain | | Agree on it first. For the MLH .Tech prize: get.tech/mlh (ask the MLH coach for the code). Then Vercel → Domains, and update Auth0 callback/logout URLs + `APP_BASE_URL`. |
| — | ElevenLabs read-aloud | | Get a key at elevenlabs.io (ask MLH about credits), add `ELEVENLABS_API_KEY` in Vercel, redeploy. Only then opt into the ElevenLabs prize. |
| 12 | Phone-number sign-in | | Code is done. Twilio trial (Account SID, Auth Token, phone number) → Auth0 → Authentication → Passwordless → SMS: switch on, paste the Twilio details, Applications tab → enable the app. Then Vercel → `NEXT_PUBLIC_PHONE_LOGIN` = `1` → redeploy. A "Use my phone number instead" button appears on the sign-in card. Twilio trial only texts verified numbers. |
| 7 | Install the app on a phone | | Home → "Get the Lacuno app" → Install. Check it opens full-screen. |
| — | Claude API credits | | Ask at the Anthropic booth / Cal Hacks Discord; redeem at console.anthropic.com → Billing |

### Already done (don't redo)
Claude reading of records (photos/PDFs, any language) · disagreement map · six specialist reviews · bilingual brief + PDF · symptom log with emergency screen and Call 911 · Auth0 accounts · fact-checker agent · openFDA medicine-check agent · security hardening (headers, validation, rate limits) · homepage + guided flow + Help page · installable app · rename to Lacuno · visit reminders (Add to calendar) · phone as camera (QR, peer-to-peer) · UI polish round 2.
