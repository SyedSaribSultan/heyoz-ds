/* Icons for the Content Studio screen.
 *
 * Inline rather than an icon dependency, and stroked at 1.5px on a 16 viewBox — the
 * same two decisions Assembled.tsx made and for the same reasons: this folder has
 * three runtime dependencies and adding a fourth for a dozen glyphs is not a trade
 * worth making, and currentColor means every glyph inherits the content or sidebar
 * role around it, so they follow the modes without naming a colour.
 *
 * The stroke weight is matched to the 2px border scale the rest of the system draws
 * with rather than to an icon set's own idea of weight. A 1px hairline glyph beside a
 * 2px control edge reads as a different family.
 */

export type IconProps = {
  /** Tailwind size classes. Defaults to the 20px nav box. */
  className?: string;
};

function Glyph({
  children,
  className = 'h-space-5 w-space-5',
  /** Some glyphs read better filled — the send arrow inside a solid circle, for one. */
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

/* ── Sidebar nav ─────────────────────────────────────────────────────────── */

/** Clapperboard — Content Studio. */
export const ContentStudioIcon = ({ className }: IconProps) => (
  <Glyph className={className}>
    <path d="M2 6.2h12v7.3H2zM2 6.2l1.6-3.7 11 1.4-.6 2.3M6.2 5.4 5.3 2.7M9.9 5.8 9.2 3" />
  </Glyph>
);

/** Four panes — Creations. */
export const CreationsIcon = ({ className }: IconProps) => (
  <Glyph className={className}>
    <path d="M2.4 2.4h4.4v4.4H2.4zM9.2 2.4h4.4v4.4H9.2zM2.4 9.2h4.4v4.4H2.4zM9.2 9.2h4.4v4.4H9.2z" />
  </Glyph>
);

/** Rising bars — Templates. */
export const TemplatesIcon = ({ className }: IconProps) => (
  <Glyph className={className}>
    <path d="M3 13V7.4M6.3 13V3.2M9.7 13v-7M13 13V4.6" />
  </Glyph>
);

/** Megaphone — Campaigns. */
export const CampaignsIcon = ({ className }: IconProps) => (
  <Glyph className={className}>
    <path d="M2 6.6 13.4 3v9L2 8.4zM2 6.6v1.8M5 7.5v4.3a1.2 1.2 0 0 0 2.4 0V8.3" />
  </Glyph>
);

/** Mask — Characters. */
export const CharactersIcon = ({ className }: IconProps) => (
  <Glyph className={className}>
    <path d="M8 2.6c2.8 0 5 .7 5 1.6 0 3.9-2.2 9.2-5 9.2S3 8.1 3 4.2c0-.9 2.2-1.6 5-1.6ZM6.2 6.4h.01M9.8 6.4h.01" />
  </Glyph>
);

/** Colonnade — Brand. */
export const BrandIcon = ({ className }: IconProps) => (
  <Glyph className={className}>
    <path d="M2.2 6.2 8 2.8l5.8 3.4M3.4 6.4v6.2M8 6.4v6.2M12.6 6.4v6.2M2 13h12" />
  </Glyph>
);

/** Paper plane — Publish. */
export const PublishIcon = ({ className }: IconProps) => (
  <Glyph className={className}>
    <path d="M14 2.4 6.9 9.5M14 2.4 9.6 14 6.9 9.5 2.4 6.8z" />
  </Glyph>
);

/* ── Controls ────────────────────────────────────────────────────────────── */

export const ChevronRightIcon = ({ className = 'h-space-4 w-space-4' }: IconProps) => (
  <Glyph className={className}>
    <path d="M6 3.5 10.5 8 6 12.5" />
  </Glyph>
);

export const PlusIcon = ({ className }: IconProps) => (
  <Glyph className={className}>
    <path d="M8 3.2v9.6M3.2 8h9.6" />
  </Glyph>
);

export const ArrowUpIcon = ({ className }: IconProps) => (
  <Glyph className={className}>
    <path d="M8 13V3.4M3.8 7.6 8 3.4l4.2 4.2" />
  </Glyph>
);

export const ArrowRightIcon = ({ className = 'h-space-4 w-space-4' }: IconProps) => (
  <Glyph className={className}>
    <path d="M3 8h10M9.2 4.2 13 8l-3.8 3.8" />
  </Glyph>
);

/** Shopping bag — the composer's Product attachment. */
export const ProductIcon = ({ className = 'h-space-4 w-space-4' }: IconProps) => (
  <Glyph className={className}>
    <path d="M3.2 5.4h9.6l-.8 8H4zM5.8 5.4V4a2.2 2.2 0 0 1 4.4 0v1.4" />
  </Glyph>
);

/** Bust — the composer's Avatar attachment. */
export const AvatarIcon = ({ className = 'h-space-4 w-space-4' }: IconProps) => (
  <Glyph className={className}>
    <path d="M8 8.6a2.8 2.8 0 1 0 0-5.6 2.8 2.8 0 0 0 0 5.6ZM3 13.4c0-2.2 2.2-3.6 5-3.6s5 1.4 5 3.6" />
  </Glyph>
);

/** Speech bubble — the support control beside the account chip. */
export const SupportIcon = ({ className = 'h-space-4 w-space-4' }: IconProps) => (
  <Glyph className={className}>
    <path d="M13.4 7.6c0 2.9-2.4 5.2-5.4 5.2a6 6 0 0 1-1.9-.3L2.6 13.6l1-2.9a5 5 0 0 1-1-3.1C2.6 4.7 5 2.4 8 2.4s5.4 2.3 5.4 5.2Z" />
  </Glyph>
);

/** The HeyOz mark. Filled, because it sits in a solid tile at 26px where a stroked
 *  glyph would disappear. */
export const OzMarkIcon = ({ className = 'h-space-5 w-space-5' }: IconProps) => (
  <svg aria-hidden="true" viewBox="0 0 16 16" className={`${className} shrink-0`} fill="currentColor">
    <path d="M8 1.6a6.4 6.4 0 1 0 0 12.8A6.4 6.4 0 0 0 8 1.6Zm0 2.1a4.3 4.3 0 0 1 3.5 6.8L5.7 4.3A4.2 4.2 0 0 1 8 3.7Zm0 8.6a4.3 4.3 0 0 1-3.5-6.8l5.8 6.2a4.2 4.2 0 0 1-2.3.6Z" />
  </svg>
);
