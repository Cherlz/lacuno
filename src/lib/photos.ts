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

export const PHOTOS: Record<"hero" | "papers" | "visit", Photo> = {
  hero: {
    src: "/images/hero.jpg",
    alt: "An adult daughter sitting with her older mother at home",
    focus: "65% 35%",
    credit: null,
  },
  papers: {
    src: "/images/papers.jpg",
    alt: "A family's medical papers and notes spread on a table",
    focus: "50% 50%",
    credit: null,
  },
  visit: {
    src: "/images/visit.jpg",
    alt: "A doctor talking with an older patient",
    focus: "50% 40%",
    credit: null,
  },
};
