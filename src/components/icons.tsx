import type { SVGProps } from "react";

// One small line-icon set (24px grid, 1.75 stroke) used everywhere instead of emoji,
// so icons share a weight and colour with the text next to them.
const paths = {
  camera: "M4 8h3l1.5-2h7L17 8h3v11H4z M12 16.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7z",
  upload: "M12 15V4 M7.5 8.5 12 4l4.5 4.5 M4 15v4h16v-4",
  phone: "M8 3h8a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1H8a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z M11 18h2",
  check: "M5 12.5 10 17l9-10",
  chevronRight: "m9.5 6 6 6-6 6",
  chevronDown: "m6 9.5 6 6 6-6",
  chevronUp: "m6 14.5 6-6 6 6",
  arrowRight: "M5 12h14 M13 6l6 6-6 6",
  plus: "M12 5v14 M5 12h14",
  x: "M6 6l12 12 M18 6 6 18",
  home: "M4 11 12 4l8 7 M6 9.5V20h12V9.5",
  files: "M7 3h7l4 4v11H7z M14 3v4h4 M4 7v14h11",
  review: "M4 5h16 M4 12h10 M4 19h7 M17 15l2 2 3-3.5",
  brief: "M7 3h10a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z M9 8h6 M9 12h6 M9 16h3",
  pulse: "M3 12h4l2-5 4 10 2-5h6",
  pencil: "M4 20h4L19 9l-4-4L4 16z M13.5 6.5l4 4",
  mic: "M12 15a3 3 0 0 0 3-3V6a3 3 0 0 0-6 0v6a3 3 0 0 0 3 3z M6 11a6 6 0 0 0 12 0 M12 17v3",
  speaker: "M4 9.5h3.5L12 6v12l-4.5-3.5H4z M15.5 9a4 4 0 0 1 0 6 M18 6.5a7.5 7.5 0 0 1 0 11",
  stop: "M7 7h10v10H7z",
  download: "M12 4v11 M7.5 10.5 12 15l4.5-4.5 M5 20h14",
  calendar: "M4 6h16v14H4z M4 10h16 M8 3v4 M16 3v4",
  alert: "M12 4 2.5 20h19z M12 10v4.5 M12 17.2v.3",
  user: "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8z M5 20a7 7 0 0 1 14 0",
  help: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .9-1 1.6v.6 M12 17v.3",
  mail: "M3.5 6h17v12h-17z M4 6.5l8 6 8-6",
  doc: "M7 3h7l4 4v14H7z M14 3v4h4",
  note: "M5 4h14v12l-4 4H5z M15 20v-4h4",
  external: "M14 5h5v5 M19 5l-8 8 M17 13.5V19H5V7h5.5",
  trash: "M5 7h14 M10 7V4.5h4V7 M7 7l1 13h8l1-13",
  menu: "M4 7h16 M4 12h16 M4 17h16",
  search: "M10.5 17a6.5 6.5 0 1 0 0-13 6.5 6.5 0 0 0 0 13z M15.5 15.5 20 20",
  shield: "M12 3 5 6v5.5c0 4.4 3 8 7 9.5 4-1.5 7-5.1 7-9.5V6z M9 12l2 2 4-4.5",
  lock: "M6.5 11h11v9h-11z M9 11V8a3 3 0 0 1 6 0v3",
  bell: "M6 16V11a6 6 0 0 1 12 0v5l1.5 2h-15z M10 20.5a2 2 0 0 0 4 0",
  bellOff: "M6 16V11a6 6 0 0 1 9.5-4.9 M18 11v5l1.5 2H8 M10 20.5a2 2 0 0 0 4 0 M4 4l16 16",
  watch: "M8 7h8a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1H8a1 1 0 0 1-1-1V8a1 1 0 0 1 1-1z M9 7l.5-3.5h5L15 7 M9 17l.5 3.5h5L15 17 M12 10v2.5l1.5 1",
  pin: "M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0 1 13 0c0 5.4-6.5 11-6.5 11z M12 12.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z",
  hospital: "M4 20V8h5V4h6v4h5v12z M12 7v4 M10 9h4 M10 20v-4h4v4",
  globe: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z M3 12h18 M12 3c2.5 2.6 3.5 5.6 3.5 9s-1 6.4-3.5 9c-2.5-2.6-3.5-5.6-3.5-9s1-6.4 3.5-9z",
  // Specialty lenses
  ear: "M8 9a4.5 4.5 0 1 1 9 0c0 2.5-1.5 3.5-2.5 4.5S13 15.5 13 17a3 3 0 0 1-5.5 1.5 M11 9.5a1.5 1.5 0 0 1 3 0",
  brain: "M12 5.5a3 3 0 0 0-5.5 1A3 3 0 0 0 5 11.5a3 3 0 0 0 1.5 4.5A3 3 0 0 0 12 18.5z M12 5.5a3 3 0 0 1 5.5 1 3 3 0 0 1 1.5 5 3 3 0 0 1-1.5 4.5A3 3 0 0 1 12 18.5z M12 5.5v13",
  heart: "M12 20s-7.5-4.6-7.5-10A4.2 4.2 0 0 1 12 7.5 4.2 4.2 0 0 1 19.5 10c0 5.4-7.5 10-7.5 10z",
  flask: "M9.5 3.5h5 M10.5 3.5v6L5 19.5h14l-5.5-10v-6 M7.5 15h9",
  bone: "M8 6.5a2.2 2.2 0 1 0-2.5 2.6L15 18.5a2.2 2.2 0 1 0 2.6-2.5 2.2 2.2 0 1 0-1.4-3.3L11.3 7.9A2.2 2.2 0 1 0 8 6.5z",
  pill: "M10.5 20.5a5 5 0 0 1-7-7l6-6a5 5 0 0 1 7 7z M7 10.5l6.5 6.5",
} as const;

export type IconName = keyof typeof paths;

export function Icon({ name, size = 18, className = "", ...props }: { name: IconName; size?: number } & SVGProps<SVGSVGElement>) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      className={`shrink-0 ${className}`}
      {...props}
    >
      <path d={paths[name]} />
    </svg>
  );
}

const LENS_ICONS: Record<string, IconName> = { ear: "ear", neuro: "brain", heart: "heart", hormones: "flask", msk: "bone", meds: "pill" };
export const lensIcon = (key: string): IconName => LENS_ICONS[key] ?? "doc";
