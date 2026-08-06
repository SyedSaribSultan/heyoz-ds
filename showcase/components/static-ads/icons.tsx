/* Icons for /static-ads.
 *
 * Same two decisions as components/studio/icons.tsx and for the same reasons: inline
 * rather than an icon dependency, and stroked 1.5px on a 16 viewBox in `currentColor`
 * so every glyph inherits the content role around it and follows the modes without
 * naming a colour.
 *
 * The stroke weight is matched to the system's 2px border scale rather than to an icon
 * set's idea of weight — a 1px hairline beside a 2px control edge reads as a different
 * family.
 */

export type IconProps = {
  /** Tailwind size classes. Defaults to the 16px nav box. */
  className?: string;
};

function Glyph({
  children,
  className = 'h-space-5 w-space-5',
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

/* ── Sidebar: ungrouped ──────────────────────────────────────────────────── */

/** House — Home. */
export const HomeIcon = ({ className }: IconProps) => (
  <Glyph className={className}>
    <path d="M2.4 6.8 8 2.4l5.6 4.4v6.4a.8.8 0 0 1-.8.8H3.2a.8.8 0 0 1-.8-.8z" />
  </Glyph>
);

/** Folder — Assets. */
export const AssetsIcon = ({ className }: IconProps) => (
  <Glyph className={className}>
    <path d="M2.2 4.6a.9.9 0 0 1 .9-.9h2.6l1.3 1.6h5.1a.9.9 0 0 1 .9.9v6.1a.9.9 0 0 1-.9.9H3.1a.9.9 0 0 1-.9-.9z" />
  </Glyph>
);

/* ── Sidebar: Creation ───────────────────────────────────────────────────── */

/** Framed picture with a horizon — Image. */
export const ImageIcon = ({ className }: IconProps) => (
  <Glyph className={className}>
    <path d="M2.4 3.4h11.2v9.2H2.4zM2.4 10.4l3-2.8 2.4 2.2 2.6-2.6 3.2 3" />
    <circle cx="5.6" cy="6.1" r=".85" />
  </Glyph>
);

/** Camcorder — Video. */
export const VideoIcon = ({ className }: IconProps) => (
  <Glyph className={className}>
    <path d="M2.2 4.6h7.4v6.8H2.2zM9.6 8.2l4.2-2.4v4.4L9.6 7.8" />
  </Glyph>
);

/** Four-point spark — Agent. */
export const AgentIcon = ({ className }: IconProps) => (
  <Glyph className={className}>
    <path d="M6.4 2.6 7.5 5.9 10.8 7 7.5 8.1 6.4 11.4 5.3 8.1 2 7 5.3 5.9zM11.6 9.6l.55 1.55 1.55.55-1.55.55-.55 1.55-.55-1.55L10.5 11.7l1.55-.55z" />
  </Glyph>
);

/** Attaché case — Templates. */
export const TemplatesIcon = ({ className }: IconProps) => (
  <Glyph className={className}>
    <path d="M2.2 5.4h11.6v7.2H2.2zM5.8 5.4V4.2a1 1 0 0 1 1-1h2.4a1 1 0 0 1 1 1v1.2M2.2 8.8h11.6" />
  </Glyph>
);

/* ── Sidebar: Strategy ───────────────────────────────────────────────────── */

/** Twin helix — Brand DNA. */
export const BrandDnaIcon = ({ className }: IconProps) => (
  <Glyph className={className}>
    <path d="M5.4 2.4c0 3.7 5.2 6 5.2 9.7M10.6 2.4c0 3.7-5.2 6-5.2 9.7M5.9 5.2h4.2M4.9 8.5h6.2M5.9 11.5h4.2" />
  </Glyph>
);

/** Carton — Products. */
export const ProductsIcon = ({ className }: IconProps) => (
  <Glyph className={className}>
    <path d="M8 2.4l5.4 2.8v5.6L8 13.6 2.6 10.8V5.2zM2.6 5.2 8 8l5.4-2.8M8 8v5.6" />
  </Glyph>
);

/** Two figures — Audience. */
export const AudienceIcon = ({ className }: IconProps) => (
  <Glyph className={className}>
    <path d="M6.2 7.4a2.2 2.2 0 1 0 0-4.4 2.2 2.2 0 0 0 0 4.4ZM2.2 13c0-2 1.8-3.3 4-3.3s4 1.3 4 3.3M10.4 3.3a2.2 2.2 0 0 1 0 4.2M11.4 9.9c1.5.3 2.6 1.4 2.6 3.1" />
  </Glyph>
);

/** Interlocked quadrants — Playbook. */
export const PlaybookIcon = ({ className }: IconProps) => (
  <Glyph className={className}>
    <path d="M8 2.4 13.6 8 8 13.6 2.4 8zM8 5.6 10.4 8 8 10.4 5.6 8z" />
  </Glyph>
);

/** Bolt — Competitors. */
export const CompetitorsIcon = ({ className }: IconProps) => (
  <Glyph className={className}>
    <path d="M9.2 2 3.8 9.1h3.4L6.8 14l5.4-7.1H8.8z" />
  </Glyph>
);

/* ── Sidebar: Publish ────────────────────────────────────────────────────── */

/** Megaphone — Campaigns. */
export const CampaignsIcon = ({ className }: IconProps) => (
  <Glyph className={className}>
    <path d="M2 6.6 13.4 3v9L2 8.4zM2 6.6v1.8M5 7.5v4.3a1.2 1.2 0 0 0 2.4 0V8.3" />
  </Glyph>
);

/** Month grid — Calendar. */
export const CalendarIcon = ({ className }: IconProps) => (
  <Glyph className={className}>
    <path d="M2.4 4.4h11.2v9.2H2.4zM2.4 7.4h11.2M5.4 2.6v2.4M10.6 2.6v2.4" />
  </Glyph>
);

/* ── Chrome ──────────────────────────────────────────────────────────────── */

export const ChevronRightIcon = ({ className = 'h-space-4 w-space-4' }: IconProps) => (
  <Glyph className={className}>
    <path d="M6 3.5 10.5 8 6 12.5" />
  </Glyph>
);

export const ChevronDownIcon = ({ className = 'h-space-4 w-space-4' }: IconProps) => (
  <Glyph className={className}>
    <path d="M3.5 6 8 10.5 12.5 6" />
  </Glyph>
);

export const PlusIcon = ({ className }: IconProps) => (
  <Glyph className={className}>
    <path d="M8 3.2v9.6M3.2 8h9.6" />
  </Glyph>
);

export const MinusIcon = ({ className }: IconProps) => (
  <Glyph className={className}>
    <path d="M3.2 8h9.6" />
  </Glyph>
);

/** The HeyOz mark. Filled, because it sits in a solid 28px tile where a stroked glyph
 *  would disappear. */
export const OzMarkIcon = ({ className = 'h-space-5 w-space-5' }: IconProps) => (
  <svg
    aria-hidden="true"
    viewBox="0 0 16 16"
    className={`${className} shrink-0`}
    fill="currentColor"
  >
    <path d="M8 1.6a6.4 6.4 0 1 0 0 12.8A6.4 6.4 0 0 0 8 1.6Zm0 2.1a4.3 4.3 0 0 1 3.5 6.8L5.7 4.3A4.2 4.2 0 0 1 8 3.7Zm0 8.6a4.3 4.3 0 0 1-3.5-6.8l5.8 6.2a4.2 4.2 0 0 1-2.3.6Z" />
  </svg>
);

/* ── Composer controls ───────────────────────────────────────────────────── */

/** Four-point star, filled — the Pro tier chip and the Pricing button.
 *
 *  Filled rather than stroked, and the one exception in this file. At 14px a stroked
 *  four-point star is mostly counter and reads as a smudge; the two places it appears
 *  are both accent-coloured, where the fill is doing the signalling. */
export const SparkIcon = ({ className = 'h-space-4 w-space-4' }: IconProps) => (
  <svg
    aria-hidden="true"
    viewBox="0 0 16 16"
    className={`${className} shrink-0`}
    fill="currentColor"
  >
    <path d="M8 1.4 9.6 6.4 14.6 8 9.6 9.6 8 14.6 6.4 9.6 1.4 8 6.4 6.4z" />
  </svg>
);

/** Portrait frame — the aspect-ratio chip. */
export const AspectIcon = ({ className = 'h-space-4 w-space-4' }: IconProps) => (
  <Glyph className={className}>
    <path d="M4.4 2.6h7.2v10.8H4.4z" />
  </Glyph>
);

/** Faceted gem — the resolution chip. Higher resolution as more facets is arbitrary,
 *  but it is the mark the reference draws and a magnifier would read as zoom. */
export const GemIcon = ({ className = 'h-space-4 w-space-4' }: IconProps) => (
  <Glyph className={className}>
    <path d="M8 2.6 13.6 6.4 8 13.4 2.4 6.4zM2.4 6.4h11.2M6 6.4 8 13.4l2-7" />
  </Glyph>
);

/** Ragged lines — the CTA chip. Text, in the shape of a caption block. */
export const CtaIcon = ({ className = 'h-space-4 w-space-4' }: IconProps) => (
  <Glyph className={className}>
    <path d="M2.6 4.4h10.8M2.6 8h7.6M2.6 11.6h5.2" />
  </Glyph>
);
