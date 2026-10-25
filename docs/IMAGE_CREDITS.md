# Image credits

Every photo on the site, where it came from and its license. Files live in `public/images`, and alt text and focal points are in `src/lib/photos.ts`.

| File | Where it's used | Photographer | Source | License | Attribution required? |
|---|---|---|---|---|---|
| `hero.jpg` | Homepage hero | Vitaly Gariev | [Doctor talks with an elderly patient on a couch](https://unsplash.com/photos/doctor-talks-with-an-elderly-patient-on-a-couch-BUNNEclz-yQ) | [Unsplash License](https://unsplash.com/license) | No (credited anyway) |
| `papers.jpg` | "Nobody holds the whole case" | Vitaly Gariev | [Couple looking stressed over bills at kitchen table](https://unsplash.com/photos/couple-looking-stressed-over-bills-at-kitchen-table-uwinmIQD8nU) | [Unsplash License](https://unsplash.com/license) | No (credited anyway) |

The files aren't committed. `scripts/fetch-photos.mjs` downloads them from Unsplash's official download link into `public/images` before each build (`npm run build` and `npm run dev`), so they're served from our own domain. If a download fails, the section shows a plain deep-teal background and the build carries on.

The "Walk into the next appointment prepared" band has no photo for now.

To add or swap a photo: add its Unsplash ID to `scripts/fetch-photos.mjs`, its alt text, focal point and credit to `src/lib/photos.ts`, and a row here.

## Rules

- Only freely licensed photos: the [Unsplash License](https://unsplash.com/license) (not Unsplash+), the [Pexels License](https://www.pexels.com/license/), or Wikimedia Commons with the license stated on the file page. Check the license on the photo's own page.
- Download the file and self-host it. Don't hotlink.
- Even when attribution isn't required, credit the photographer here and in `src/lib/photos.ts` (the footer shows it).
- Never use images from other healthcare websites.
