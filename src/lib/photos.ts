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
    alt: "A doctor talking with an older patient on a couch",
    focus: "45% 25%",
    credit: {
      name: "Vitaly Gariev",
      url: "https://unsplash.com/photos/doctor-talks-with-an-elderly-patient-on-a-couch-BUNNEclz-yQ",
      source: "Unsplash",
    },
  },
  papers: {
    src: "/images/paper.jpg",
    alt: "A woman smiling as she reads a letter at her kitchen table",
    focus: "48% 50%",
    credit: {
      name: "Vitaly Gariev",
      url: "https://unsplash.com/photos/RNUNbvIXUbg",
      source: "Unsplash",
    },
  },
  visit: {
    src: "/images/visit.jpg",
    alt: "A doctor talking with a patient during a clinic appointment",
    focus: "30% 25%",
    credit: {
      name: "Vitaly Gariev",
      url: "https://unsplash.com/photos/doctor-talking-to-patient-in-an-office-IDM3n0LfNCY",
      source: "Unsplash",
    },
  },
};
