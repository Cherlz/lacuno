// Class recipes shared by client and server components (no "use client", so server pages can call them).

export type Variant = "primary" | "secondary" | "ghost" | "danger";
export type Size = "sm" | "md" | "lg";
const variants: Record<Variant, string> = {
  primary: "bg-brand text-brand-ink hover:bg-brand-hover",
  secondary: "bg-surface text-ink border border-line-strong hover:bg-surface-2",
  ghost: "text-brand hover:bg-brand-soft",
  danger: "bg-danger text-white hover:opacity-90",
};
const sizes: Record<Size, string> = {
  sm: "h-9 px-3 text-sm",
  md: "min-h-11 px-4",
  lg: "min-h-12 px-6 text-[1.05rem]",
};
const base =
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:pointer-events-none";

export const buttonClass = (variant: Variant = "primary", size: Size = "md") => `${base} ${variants[variant]} ${sizes[size]}`;

/** Text inputs, selects and textareas share one look. */
export const field =
  "block w-full rounded-lg border border-line-strong bg-surface px-3 min-h-11 text-base text-ink placeholder:text-muted/70 transition-colors focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/15";

