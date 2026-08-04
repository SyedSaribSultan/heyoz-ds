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

/** The HeyOz mark, from the Figma nav (node 4467:144891).
 *
 *  The one glyph in this file that is not drawn on the 16-square stroke grid above,
 *  because it is not an icon — it is the logo, and its outline is the brand's, so it
 *  ships as the two filled paths Figma exports rather than as an interpretation of them.
 *  `currentColor` on the fill is the only change: the mark sits on the brand plate in
 *  the header and would need a second copy for any other ground if it carried white. */
export const OzMark = ({ className = 'h-[18px] w-[16px]' }: { className?: string }) => (
  <svg
    aria-hidden="true"
    viewBox="0 0 16 18"
    fill="currentColor"
    className={`${className} shrink-0`}
  >
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M7.87416 0.0186349C8.04293 -0.035012 8.3084 0.0332596 8.42005 0.145649C8.69784 0.425391 8.88689 0.820374 9.08534 1.14043L10.5635 3.53187C10.7847 3.89168 11.0032 4.25314 11.2239 4.61318C11.2692 4.68717 11.317 4.75883 11.4128 4.79789L11.4278 4.8037C11.6279 4.88461 12.0551 4.96785 12.2924 5.03301C13.0752 5.25004 14.0536 5.62549 14.479 6.22679C15.175 7.21051 13.6863 7.93374 12.8098 8.31645C12.7421 7.84685 12.7051 7.46194 12.5147 7.01069C12.0889 6.38557 11.9324 6.26151 12.3745 7.11055C12.5984 7.78047 12.6014 8.48473 12.3833 9.15586C12.2741 9.49414 12.0965 9.93049 11.8806 10.2272C11.0646 11.3491 9.41999 12.1969 8.03979 12.8451C6.79594 12.3192 4.99546 11.3768 4.3043 10.3981C3.59479 9.39347 3.2725 7.98316 3.76974 6.89119C3.8248 6.77029 3.86819 6.63935 3.91394 6.51451C3.35548 7.09321 3.33745 7.62978 3.31815 8.31912C2.67396 8.12344 1.94552 7.78449 1.60149 7.28241C0.756572 6.04914 2.7387 5.30233 3.90323 4.96005C4.12669 4.89437 4.4799 4.82114 4.69037 4.73486L4.70568 4.72832C4.76349 4.70471 4.80031 4.68342 4.83151 4.63597C5.13014 4.18185 5.40796 3.70504 5.68724 3.24439C6.26075 2.29849 6.83542 1.35695 7.40175 0.408644C7.5021 0.240641 7.64809 0.0829966 7.87416 0.0186349ZM10.3694 5.93713C9.68894 5.57291 8.54781 5.35267 7.73639 5.41889C6.04843 5.53634 4.51368 6.20853 4.69068 7.73229C4.76249 8.35034 5.05703 8.8521 5.66213 9.24215C6.25617 9.65058 7.47141 9.92194 8.22564 9.86146C8.2595 9.85878 8.29345 9.85513 8.32698 9.85055C9.3743 9.70336 10.2514 9.48099 10.915 8.75882C11.2964 8.34368 11.4549 7.62616 11.3369 7.12606C11.2157 6.61285 10.9198 6.23176 10.3694 5.93713Z"
    />
    <path d="M12.3423 10.2451C12.4517 10.3149 12.7693 10.9418 12.8556 11.0934L14.1331 13.3854C14.6462 14.3118 15.1798 15.2396 15.685 16.1701C16.2184 17.1527 16.2177 17.9632 14.5378 17.9898C13.6829 18.0033 12.8145 17.9997 11.9582 17.9991L3.51329 17.998C2.74516 17.9978 1.96881 18.0073 1.20158 17.9845C0.615628 17.9687 0.00897285 17.718 0.000168824 17.1956C-0.0107395 16.5474 0.509472 15.8512 0.833576 15.2595L2.79755 11.7631C2.89432 11.6052 2.98885 11.4465 3.08109 11.2869C3.30243 11.5053 3.47461 11.7097 3.71721 11.9327C4.74143 12.8745 5.81148 13.3721 7.20169 13.8819L4.32435 16.2637C4.02368 16.5162 3.57068 16.8624 3.3083 17.1077C5.85209 17.0689 8.55901 17.0912 11.1081 17.1084C11.1809 16.8937 11.3895 16.5201 11.4971 16.3006C11.6763 15.9348 11.8578 15.5594 12.0548 15.2004L8.78586 15.1971C9.04197 14.7633 9.51858 14.2302 9.83951 13.8072C10.3015 13.1984 10.7903 12.5951 11.2521 11.9867C11.642 11.473 12.1973 10.8317 12.3423 10.2451Z" />
  </svg>
);

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

export const MenuIcon = ({ className = 'h-space-5 w-space-5' }: { className?: string }) => (
  <G className={className}>
    <path d="M2.4 4.4h11.2M2.4 8h11.2M2.4 11.6h11.2" />
  </G>
);

export const CloseIcon = ({ className = 'h-space-5 w-space-5' }: { className?: string }) => (
  <G className={className}>
    <path d="M4 4l8 8M12 4l-8 8" />
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
