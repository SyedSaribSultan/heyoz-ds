/* The twelve referral marks.
 *
 * Drawn at one stroke weight on a 24 viewBox and painted with currentColor, so each
 * follows the content role of the tile it sits in and picks up the selected state for
 * free. Deliberately NOT the twelve companies' own palettes: a grid of full-colour
 * logos would carry more saturation than the whole rest of the screen, and it would
 * mean twelve hard-coded brand hexes in a repo whose first rule is that no colour is
 * hand-typed above tier 1. Recognition here comes from silhouette, which is what these
 * marks are actually recognised by at 20px.
 *
 * Simplified on purpose — these are UI affordances at 20px, not trademark
 * reproductions, and a faithful OpenAI knot or Google wordmark is illegible at this
 * size anyway.
 */

function Mark({
  children,
  filled = false,
}: {
  children: React.ReactNode;
  filled?: boolean;
}) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-space-6 w-space-6"
      fill={filled ? 'currentColor' : 'none'}
      stroke={filled ? 'none' : 'currentColor'}
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {children}
    </svg>
  );
}

/** Rounded square, lens, flash. */
export const InstagramGlyph = () => (
  <Mark>
    <rect x="3.2" y="3.2" width="17.6" height="17.6" rx="5" />
    <circle cx="12" cy="12" r="4.1" />
    <circle cx="16.9" cy="7.1" r="0.5" fill="currentColor" stroke="none" />
  </Mark>
);

/** The X wordmark: two tapered diagonals. */
export const XGlyph = () => (
  <Mark filled>
    <path d="M3.6 3.2h4.9l4.2 5.6 4.9-5.6h2.8l-6.3 7.2 7.3 10.4h-4.9l-4.5-6-5.2 6H4l6.7-7.7z" />
  </Mark>
);

/** Eighth note with the offset stem. */
export const TikTokGlyph = () => (
  <Mark filled>
    <path d="M15.9 2.6h-3.2v12.1a2.4 2.4 0 1 1-2.4-2.4c.25 0 .49.04.72.11V9.1a5.6 5.6 0 1 0 4.88 5.55V8.3a6.2 6.2 0 0 0 3.72 1.24V6.34A3.75 3.75 0 0 1 15.9 2.6Z" />
  </Mark>
);

/** Rounded screen, play triangle. */
export const YouTubeGlyph = () => (
  <Mark>
    <rect x="2.4" y="5.4" width="19.2" height="13.2" rx="4.2" />
    <path d="M10.6 9.6l4.8 2.4-4.8 2.4z" fill="currentColor" stroke="none" />
  </Mark>
);

/** The G: an open ring closed by the crossbar. */
export const GoogleGlyph = () => (
  <Mark>
    <path d="M20.4 12a8.4 8.4 0 1 1-2.46-5.94" />
    <path d="M20.4 12h-7.5" />
  </Mark>
);

/** Rounded tile with the lower-case in. */
export const LinkedInGlyph = () => (
  <Mark>
    <rect x="3.2" y="3.2" width="17.6" height="17.6" rx="4" />
    <path d="M7.9 10.5v6.2" />
    <circle cx="7.9" cy="7.6" r="0.6" fill="currentColor" stroke="none" />
    <path d="M11.6 16.7v-6.2M11.6 13.1a2.5 2.5 0 0 1 5 0v3.6" />
  </Mark>
);

/** A knot, reduced to the interlocking hexagonal loop it reads as. */
export const ChatGptGlyph = () => (
  <Mark>
    <path d="M12 3.2 19.6 7.6v8.8L12 20.8 4.4 16.4V7.6z" />
    <path d="M12 8.1v7.8M8.2 10.1l7.6 3.8M15.8 10.1l-7.6 3.8" />
  </Mark>
);

/** Alien head: dome, antenna, two eyes. */
export const RedditGlyph = () => (
  <Mark>
    <path d="M3.4 14.2c0-3.4 3.85-6.1 8.6-6.1s8.6 2.7 8.6 6.1-3.85 6.1-8.6 6.1-8.6-2.7-8.6-6.1Z" />
    <path d="M12 8.1 13.3 3.6" />
    <circle cx="14.9" cy="3.2" r="1.2" />
    <circle cx="9.1" cy="13.6" r="0.75" fill="currentColor" stroke="none" />
    <circle cx="14.9" cy="13.6" r="0.75" fill="currentColor" stroke="none" />
  </Mark>
);

/** Circle with the descending f. */
export const FacebookGlyph = () => (
  <Mark>
    <circle cx="12" cy="12" r="8.8" />
    <path d="M14.5 8.1h-1.4a2 2 0 0 0-2 2v10.6M9.6 13.2h4.4" />
  </Mark>
);

/** Newspaper: folded sheet with a column. */
export const NewsGlyph = () => (
  <Mark>
    <path d="M4 5.6h11.6v13.2H6.2A2.2 2.2 0 0 1 4 16.6z" />
    <path d="M15.6 8.6H20v8a2.2 2.2 0 0 1-2.2 2.2h0" />
    <path d="M6.8 8.8h6M6.8 11.8h6M6.8 14.8h3.4" />
  </Mark>
);

/** Two figures, the second behind. */
export const FriendsGlyph = () => (
  <Mark>
    <circle cx="9.4" cy="8.6" r="3.2" />
    <path d="M3.8 19.6c0-2.8 2.5-4.6 5.6-4.6s5.6 1.8 5.6 4.6" />
    <path d="M16.2 6.2a3.1 3.1 0 0 1 0 6M17.4 15.3c1.7.5 2.8 1.7 2.8 3.4" />
  </Mark>
);

/** Ellipsis — the catch-all, and the only one that is not a likeness. */
export const OtherGlyph = () => (
  <Mark filled>
    <circle cx="6.2" cy="12" r="1.6" />
    <circle cx="12" cy="12" r="1.6" />
    <circle cx="17.8" cy="12" r="1.6" />
  </Mark>
);
