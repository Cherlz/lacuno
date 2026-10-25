// Photography used on the public pages. Files live in public/images and are
// served through next/image (resized, WebP/AVIF). Every photo is listed with its
// source and license in docs/IMAGE_CREDITS.md; `credit` drives the footer line.

export type Photo = {
  src: string;
  alt: string;
  /** CSS object-position: keeps faces in frame when the crop changes. */
  focus: string;
  credit: { name: string; url: string; source: string } | null;
};

export const PHOTOS: Record<"hero" | "papers", Photo> = {
  hero: {
    src: "/images/hero.jpg",
    alt: "A doctor talking with an older patient on a couch",
    focus: "50% 40%",
    credit: {
      name: "Vitaly Gariev",
      url: "https://unsplash.com/photos/doctor-talks-with-an-elderly-patient-on-a-couch-BUNNEclz-yQ",
      source: "Unsplash",
    },
  },
  papers: {
    src: "/images/papers.jpg",
    alt: "A couple looking worried over bills and papers at their kitchen table",
    focus: "50% 50%",
    credit: {
      name: "Vitaly Gariev",
      url: "https://unsplash.com/photos/couple-looking-stressed-over-bills-at-kitchen-table-uwinmIQD8nU",
      source: "Unsplash",
    },
  },
};
