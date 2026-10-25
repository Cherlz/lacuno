# Lacuno design system

Lacuno should look like a well-made healthcare website, not a software template. Visual references: Teladoc Health, UCSF Health and Natural Health Research. We borrow their design principles (photography, confident type, open layouts), never their branding, images or layouts. Lacuno is a tool for families, not a hospital or care provider, so nothing in the design may suggest clinical services, partnerships or certifications it doesn't have.

## Principles

1. **People first.** Use real photography of real moments of care where it helps the section's message. Never decorate.
2. **Editorial, not cards.** Use text-and-image sections, full-width photo bands, open lists with dividers and alternating backgrounds. Cards are only for things that really are cards: a record, a product preview, a form.
3. **Confident hierarchy.** Big, bold headlines, short supporting text and one clear action per section. Not every heading should be the same size.
4. **Calm.** No gradient text, glow effects, floating mockups, decorative icon grids or animation for its own sake.
5. **Honest.** No invented testimonials, statistics, partners or stories. Sample data is labelled as sample.

## Typography

| Role | Font | Use |
|---|---|---|
| Headings | **Plus Jakarta Sans** 600–800 (`font-display`) | Page and section titles, the wordmark, numbers |
| Body and interface | **Source Sans 3** 400–700 (default) | Everything else |

- Hero headline: 800 weight, about 64px on desktop and 42px on phones, with tight tracking (-0.025em).
- Section headings: 700 weight, about 44px on desktop and 32px on phones.
- Eyebrows (small labels above headings): 14px, semibold, uppercase, letter-spaced, brand teal (white on photos).
- Body: 17px base and 18–20px for lead paragraphs, with a line height of about 1.6.
- Both fonts cover Vietnamese, and Source Sans 3 also covers Cyrillic. Briefs are written in many languages, so keep that coverage if the fonts change.

## Colour

Use the tokens in `src/app/globals.css`. There is one accent, brand teal `#0b6b66`. Deep teal `#0d3533` is for dark bands and photo fallbacks. Amber, red and green only carry meaning (unclear, emergency, done). Backgrounds alternate between `bg`, `surface` (white) and `surface-2`.

## Photography

- **Subjects:** families at home, an adult child with an older parent, real paperwork, a doctor and patient in conversation. Natural light, candid, realistic rooms.
- **Avoid:** doctors holding tablets, staged handshakes, futuristic medical imagery, AI-generated people, anything that implies Lacuno provides care.
- **Sources:** freely licensed only (the Unsplash License, the Pexels License, or Wikimedia Commons with its stated license). Check each image's own license page. Never use images from the reference sites. Record every photo in `docs/IMAGE_CREDITS.md`.
- **Files:** self-hosted in `public/images` (no hotlinking), at least 2000px wide for full-bleed images, and served through `next/image` via `src/components/Photo.tsx` (responsive sizes, WebP/AVIF). Photo data, alt text, focal points and credits live in `src/lib/photos.ts`.
- **Text on photos:** always over a dark overlay (`#06201e` at 55–85%, as a gradient toward the text side). Check contrast at phone and desktop crops. Set `focus` so faces stay in frame.
- **Fallback:** if a photo file is missing, its section shows the deep teal background, never a broken image.

## Layout

- Max content width 72rem (`max-w-6xl`), with 16px side padding on phones and 24px on larger screens.
- Section padding: 64px on phones, 96px on desktop.
- Vary compositions: a full-bleed photo hero, image-and-text splits, numbered rows, a full-width photo statement, a dark band. Avoid repeating three-column grids.
- Corners: small (4–8px). Pills and avatars stay round.

## Navigation

- **Public pages:** a white sticky header 72px tall, with the logo and wordmark on the left, centred links, then "Sign in" and the primary button. On phones it collapses to the logo, the primary button and a menu button. The footer is shared by all public pages.
- **Inside the app:** the step menu (Records → Review → Brief), "Log symptom" as the filled primary action, the person menu at the top right, and help as the round **?** at the bottom right.

## Checks before shipping front-end changes

- Look at it at 390px (phone) and 1440px (desktop) widths.
- Make sure text on photos is readable and the crops keep faces.
- Confirm both fonts load (inspect `font-family` on the body and an `h1`).
- Every image has alt text and an entry in `IMAGE_CREDITS.md`.
- Run `npm run lint` and `npm run build`.
