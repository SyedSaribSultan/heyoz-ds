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

/* The circle-and-slash `OzMarkIcon` used to live here, and it is gone rather than kept
 * around unused: the wordmark tile now takes SparkIcon, per the reference. It is still in
 * components/studio/icons.tsx if the old mark is ever wanted back. */

/* ── Composer controls ───────────────────────────────────────────────────── */

/** Heart, filled — the Pricing pill.
 *
 *  Filled for the same reason SparkIcon is: at 14px a stroked heart is mostly counter, and
 *  this one is accent-coloured on a tinted pill where the fill is what reads. */
export const HeartIcon = ({ className = 'h-space-4 w-space-4' }: IconProps) => (
  <svg
    aria-hidden="true"
    viewBox="0 0 16 16"
    className={`${className} shrink-0`}
    fill="currentColor"
  >
    <path d="M8 13.8 2.9 8.9a3.35 3.35 0 0 1 0-4.8 3.5 3.5 0 0 1 4.85 0L8 4.35l.25-.25a3.5 3.5 0 0 1 4.85 0 3.35 3.35 0 0 1 0 4.8z" />
  </svg>
);

/** Four-point star, filled — the Pro tier chip and the wordmark tile.
 *
 *  Filled rather than stroked, and one of the two exceptions in this file. At 14px a
 *  stroked four-point star is mostly counter and reads as a smudge; in the wordmark tile it
 *  is white on near-black at 16px, where a 1.5px stroke would read as an outline of a star
 *  rather than a star. */
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

/** Droplet — the resolution chip and each row of the quality popover.
 *
 *  This replaced a faceted gem, which was a guess made before the component sheet arrived.
 *  The sheet draws a droplet on both the chip and its three rows, so the chip and the
 *  popover it opens now carry the same mark — which is the point of the change rather than
 *  a coat of paint: a trigger whose glyph disagrees with its own panel reads as two
 *  controls. */
export const DropletIcon = ({ className = 'h-space-4 w-space-4' }: IconProps) => (
  <Glyph className={className}>
    <path d="M8 2.2c2 2.5 4 4.7 4 7.1A4 4 0 0 1 8 13.4a4 4 0 0 1-4-4.1c0-2.4 2-4.6 4-7.1Z" />
  </Glyph>
);

/** Pencil — the edit badge on a filled Touchpoint. */
export const PencilIcon = ({ className = 'h-space-3 w-space-3' }: IconProps) => (
  <Glyph className={className}>
    <path d="M11.1 2.6l2.3 2.3-8 8H3.1v-2.3zM9.6 4.1l2.3 2.3" />
  </Glyph>
);

/** Magnifier — every search field in the pickers. */
export const SearchIcon = ({ className = 'h-space-5 w-space-5' }: IconProps) => (
  <Glyph className={className}>
    <path d="M7.2 11.6a4.4 4.4 0 1 0 0-8.8 4.4 4.4 0 0 0 0 8.8ZM10.4 10.4l3 3" />
  </Glyph>
);

/** Circling arrow — Recreate, on a result card's hover overlay. */
export const RecreateIcon = ({ className = 'h-space-4 w-space-4' }: IconProps) => (
  <Glyph className={className}>
    <path d="M13.2 8a5.2 5.2 0 1 1-1.7-3.85M13.4 2.2v2.9h-2.9" />
  </Glyph>
);

/** Two offset sheets — Copy Prompt. */
export const CopyIcon = ({ className = 'h-space-4 w-space-4' }: IconProps) => (
  <Glyph className={className}>
    <path d="M6 6h7.2v7.4H6zM10.2 6V2.6H2.8v7.3h3.2" />
  </Glyph>
);

/** A cross. Every modal's close control, and the remove control on a reference thumb. */
export const CloseIcon = ({ className = 'h-space-4 w-space-4' }: IconProps) => (
  <Glyph className={className}>
    <path d="M4 4l8 8M12 4l-8 8" />
  </Glyph>
);

/** A small diamond — the credit-cost badge on a model row. */
export const CreditIcon = ({ className = 'h-space-3 w-space-3' }: IconProps) => (
  <svg
    aria-hidden="true"
    viewBox="0 0 16 16"
    className={`${className} shrink-0`}
    fill="currentColor"
  >
    <path d="M8 2 13 8l-5 6-5-6z" />
  </svg>
);

/** Pushpin — the Pinned filter. */
export const PinIcon = ({ className = 'h-space-4 w-space-4' }: IconProps) => (
  <Glyph className={className}>
    <path d="M6 2.6h4l-.6 4 2.2 2H4.4l2.2-2zM8 8.6v4.8" />
  </Glyph>
);

/** Heart, stroked — the Favourites filter. The filled twin above is the Pricing pill's;
 *  a filter that is not currently on should not be painted as though it were. */
export const HeartOutlineIcon = ({ className = 'h-space-4 w-space-4' }: IconProps) => (
  <Glyph className={className}>
    <path d="M8 13.4 3.2 8.8a3.1 3.1 0 0 1 0-4.5 3.25 3.25 0 0 1 4.5 0l.3.3.3-.3a3.25 3.25 0 0 1 4.5 0 3.1 3.1 0 0 1 0 4.5z" />
  </Glyph>
);

/** A frame whose proportions state the ratio it labels.
 *
 *  Every row of the aspect-ratio popover carries one, and the shape is COMPUTED from the
 *  ratio rather than picked from a set of three. That is the whole reason this is not
 *  `PortraitIcon`/`LandscapeIcon`/`SquareIcon`: the popover lists eleven ratios, and three
 *  glyphs would mean 5:4 and 21:9 shared a mark while reading as very different crops. The
 *  longer edge is pinned to 11px and the shorter one is derived, so the glyphs sit on a
 *  common optical size the way a real icon set would. */
export const RatioIcon = ({
  w,
  h,
  className = 'h-space-4 w-space-4',
}: IconProps & { w: number; h: number }) => {
  const long = 11;
  const [rw, rh] = w >= h ? [long, (long * h) / w] : [(long * w) / h, long];
  return (
    <Glyph className={className}>
      <rect x={8 - rw / 2} y={8 - rh / 2} width={rw} height={rh} rx="1.4" />
    </Glyph>
  );
};

/** Ragged lines — the CTA chip. Text, in the shape of a caption block. */
export const CtaIcon = ({ className = 'h-space-4 w-space-4' }: IconProps) => (
  <Glyph className={className}>
    <path d="M2.6 4.4h10.8M2.6 8h7.6M2.6 11.6h5.2" />
  </Glyph>
);
