import type { Metadata } from "next";
import Link from "next/link";
import { Icon } from "@/components/icons";
import { buttonClass } from "@/components/ui-classes";

export const metadata: Metadata = { title: "Sign in" };

// Lacuno's own sign-in choices, so the phone-number option is visible before
// handing over to Auth0's login page.
export default async function SignIn({ searchParams }: { searchParams: Promise<{ returnTo?: string }> }) {
  const { returnTo: raw } = await searchParams;
  // Only same-site paths, never another site.
  const returnTo = raw && raw.startsWith("/") && !raw.startsWith("//") ? raw : "/case";
  const to = (extra: string) => `/auth/login?${extra}${extra ? "&" : ""}returnTo=${encodeURIComponent(returnTo)}`;
  const phone = process.env.NEXT_PUBLIC_PHONE_LOGIN === "1";

  return (
    <div className="mx-auto max-w-sm py-10 sm:py-16">
      <Link href="/" className="mb-8 inline-flex items-center gap-1.5 text-sm font-semibold text-muted hover:text-ink">
        <Icon name="chevronRight" size={16} className="rotate-180" />Back to home
      </Link>
      <h1 className="font-display text-3xl font-semibold tracking-tight">Welcome to Lacuno</h1>
      <p className="mt-2 text-muted">Sign in or create a free account to keep your case files.</p>
      <div className="mt-8 space-y-3">
        <a href={to("screen_hint=signup")} className={`${buttonClass("primary", "lg")} w-full`}>Create a free account</a>
        <a href={to("")} className={`${buttonClass("secondary", "lg")} w-full`}>I already have an account</a>
        {phone && (
          // Auth0's login page accepts a phone number (identifier-first, verified by text code).
          <a href={to("")} className={`${buttonClass("secondary", "lg")} w-full`}>
            <Icon name="phone" size={18} />Use my phone number
          </a>
        )}
      </div>
      <p className="mt-6 text-sm text-muted">
        Email, Google{phone ? " or your phone number (type it with the country code, e.g. +1…)" : ""}. Your account keeps your case files separate; the records themselves stay on your device.
      </p>
    </div>
  );
}
