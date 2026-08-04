/* Icons for /ai-ugc. Stroked 1.5px on a 16 viewBox in currentColor — the convention
 * Assembled.tsx set and the studio folder follows, so a glyph inherits the content role
 * around it and needs no colour of its own.
 *
 * The brief asks for "custom illustrated icons" over generic outline ones. These are
 * drawn for this page rather than pulled from a set, which is as far as that goes here:
 * illustration is an asset discipline, and twelve hand-drawn illustrations is a
 * commission, not a build step. Said plainly rather than pretending a 16px stroke glyph
 * is an illustration. */

function G({
  children,
  className = 'h-space-6 w-space-6',
  fill = 'none',
}: {
  children: React.ReactNode;
  className?: string;
  fill?: string;
}) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 16 16"
      className={`${className} shrink-0`}
      fill={fill}
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {children}
    </svg>
  );
}

/* ── Feature marks ───────────────────────────────────────────────────────── */

/** Waveform + mouth — lip-sync and voice. */
export const LipSyncIcon = ({ className }: { className?: string }) => (
  <G className={className}>
    <path d="M2 8h1.4M5 5.4v5.2M7.6 3.4v9.2M10.2 5.9v4.2M12.8 7.2v1.6M14.4 8H15" />
  </G>
);

/** Globe with a meridian — multi-language. */
export const LanguagesIcon = ({ className }: { className?: string }) => (
  <G className={className}>
    <circle cx="8" cy="8" r="5.6" />
    <path d="M2.4 8h11.2M8 2.4c1.6 1.7 2.4 3.6 2.4 5.6S9.6 11.9 8 13.6C6.4 11.9 5.6 10 5.6 8s.8-3.9 2.4-5.6Z" />
  </G>
);

/** Bust in frame — a creator on camera. */
export const CreatorIcon = ({ className }: { className?: string }) => (
  <G className={className}>
    <rect x="2.2" y="2.2" width="11.6" height="11.6" rx="2.6" />
    <circle cx="8" cy="6.6" r="1.9" />
    <path d="M4.8 12.4c0-1.7 1.4-2.6 3.2-2.6s3.2.9 3.2 2.6" />
  </G>
);

/** Sliders — custom styling. */
export const StylingIcon = ({ className }: { className?: string }) => (
  <G className={className}>
    <path d="M3.4 2.6v10.8M8 2.6v10.8M12.6 2.6v10.8" />
    <circle cx="3.4" cy="10.4" r="1.5" />
    <circle cx="8" cy="5.4" r="1.5" />
    <circle cx="12.6" cy="9" r="1.5" />
  </G>
);

/** Lightning in a frame — instant generation. */
export const InstantIcon = ({ className }: { className?: string }) => (
  <G className={className}>
    <rect x="2.2" y="2.2" width="11.6" height="11.6" rx="2.6" />
    <path d="M8.9 4.9 6.2 8.6h1.9l-.9 2.9 3-3.9H8.3z" />
  </G>
);

export const FEATURE_ICONS = [LipSyncIcon, LanguagesIcon, CreatorIcon, StylingIcon, InstantIcon];

/* ── Related-tool marks, keyed by content.ts ─────────────────────────────── */

const TOOL: Record<string, React.ReactNode> = {
  actor: (
    <>
      <circle cx="8" cy="5.6" r="2.6" />
      <path d="M3 13.4c0-2.1 2.2-3.4 5-3.4s5 1.3 5 3.4" />
    </>
  ),
  avatar: (
    <>
      <rect x="2.4" y="2.4" width="11.2" height="11.2" rx="3" />
      <circle cx="8" cy="6.8" r="1.8" />
      <path d="M5.2 12c0-1.5 1.3-2.4 2.8-2.4s2.8.9 2.8 2.4" />
    </>
  ),
  spark: <path d="M8 1.8l1.5 4 4 1.5-4 1.5-1.5 4-1.5-4-4-1.5 4-1.5z" />,
  text: (
    <>
      <path d="M3 4.2h10M5.4 7.4h5.2M3 10.6h10" />
      <path d="M11.6 13.4 14 11l-2.4-2.4" />
    </>
  ),
  present: (
    <>
      <rect x="2.2" y="3" width="11.6" height="7.6" rx="1.6" />
      <path d="M8 10.6v2.8M5.6 13.4h4.8" />
    </>
  ),
  head: (
    <>
      <circle cx="8" cy="6" r="3.2" />
      <path d="M4 13.4c0-1.9 1.8-3 4-3s4 1.1 4 3" />
      <path d="M6.6 6.6h2.8" />
    </>
  ),
  box: (
    <>
      <path d="M8 2.2l5.4 2.8v6L8 13.8 2.6 11V5z" />
      <path d="M2.6 5 8 7.8 13.4 5M8 7.8v6" />
    </>
  ),
  wave: <path d="M2 8h1.6M4.8 5.6v4.8M7.2 3.6v8.8M9.6 5.6v4.8M12 7v2M14 8h.4" />,
};

export const ToolIcon = ({ name, className }: { name: string; className?: string }) => (
  <G className={className}>{TOOL[name] ?? TOOL.spark}</G>
);

/* ── Chrome ──────────────────────────────────────────────────────────────── */

export const CheckIcon = ({ className }: { className?: string }) => (
  <G className={className}>
    <path d="M3.2 8.6l3.2 3.2 6.4-7" />
  </G>
);

export const ArrowRightIcon = ({ className = 'h-space-5 w-space-5' }: { className?: string }) => (
  <G className={className}>
    <path d="M3 8h10M9.2 4.2 13 8l-3.8 3.8" />
  </G>
);

export const ChevronLeftIcon = ({ className = 'h-space-5 w-space-5' }: { className?: string }) => (
  <G className={className}>
    <path d="M10 3.4 5.5 8 10 12.6" />
  </G>
);

export const ChevronRightIcon = ({ className = 'h-space-5 w-space-5' }: { className?: string }) => (
  <G className={className}>
    <path d="M6 3.4 10.5 8 6 12.6" />
  </G>
);

export const ChevronDownIcon = ({ className = 'h-space-5 w-space-5' }: { className?: string }) => (
  <G className={className}>
    <path d="M3.4 6 8 10.5 12.6 6" />
  </G>
);

export const PlayIcon = ({ className = 'h-space-5 w-space-5' }: { className?: string }) => (
  <G className={className}>
    <circle cx="8" cy="8" r="5.8" />
    <path d="M6.6 5.6l4 2.4-4 2.4z" />
  </G>
);

export const StarIcon = ({ className = 'h-space-5 w-space-5' }: { className?: string }) => (
  <G className={className} fill="currentColor">
    <path d="M8 2.2l1.8 3.7 4.1.6-3 2.9.7 4-3.6-1.9-3.6 1.9.7-4-3-2.9 4.1-.6z" stroke="none" />
  </G>
);

/* Socials. Simplified marks in currentColor for the same reason the referral dialog's
 * are: brand colours for other companies are not values this palette has. */
const SOCIAL: Record<string, React.ReactNode> = {
  Twitter: <path d="M3.2 3.2l9.6 9.6M12.8 3.2 3.2 12.8" />,
  LinkedIn: (
    <>
      <rect x="2.4" y="2.4" width="11.2" height="11.2" rx="2" />
      <path d="M5.3 6.9v4M5.3 5.1h.01M8 11V8.7a1.4 1.4 0 0 1 2.8 0V11" />
    </>
  ),
  Instagram: (
    <>
      <rect x="2.6" y="2.6" width="10.8" height="10.8" rx="3.4" />
      <circle cx="8" cy="8" r="2.6" />
      <path d="M11.2 4.8h.01" />
    </>
  ),
  TikTok: (
    <>
      <path d="M9.6 2.6v7.2a2.6 2.6 0 1 1-2.6-2.6" />
      <path d="M9.6 2.6c.3 1.6 1.4 2.6 3 2.7" />
    </>
  ),
};

export const SocialIcon = ({ name, className }: { name: string; className?: string }) => (
  <G className={className}>{SOCIAL[name] ?? SOCIAL.Twitter}</G>
);
