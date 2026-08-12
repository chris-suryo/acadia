"use client";

/**
 * The link that opens Venmo with the amount already in it.
 *
 * The mark is drawn inline rather than fetched: a strict offline story and a
 * campground with no signal both rule out loading a logo from anywhere, and the
 * service worker shouldn't have to cache one either.
 */

/** Venmo's blue, and the rounded-square "V" it puts on a button. */
const VENMO_BLUE = "#008CFF";

function VenmoMark({ size = 16 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      aria-hidden
      focusable="false"
      className="shrink-0"
    >
      <rect width="24" height="24" rx="5.5" fill="#fff" />
      <path
        d="M16.9 5.4c.44.73.64 1.48.64 2.43 0 3.03-2.59 6.97-4.69 9.73H8.05L6.13 6.06l4.19-.4.97 8.03c.94-1.54 2.1-3.96 2.1-5.6 0-.9-.15-1.52-.4-2.03l3.9-.66Z"
        fill={VENMO_BLUE}
      />
    </svg>
  );
}

export function VenmoButton({
  href,
  label,
  onOpen,
}: {
  href: string;
  /** "Pay" or "Request" — the verb changes with which side of the debt you're on. */
  label: string;
  onOpen?: () => void;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      onClick={onOpen}
      style={{ backgroundColor: VENMO_BLUE }}
      className="flex-1 flex items-center justify-center gap-1.5 rounded-full text-white no-underline font-semibold text-[13px] py-2 min-h-[40px] px-3"
    >
      <VenmoMark />
      {label}
    </a>
  );
}
