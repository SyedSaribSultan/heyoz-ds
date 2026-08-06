/* ---------------------------------------------------------------------------
 * The stand-in for an image, painted from tokens.
 *
 * WHY EVERY IMAGE ON THIS ROUTE IS DRAWN. Three facts, and none of them is a preference:
 *
 *   1. `showcase/public/` is empty. Its only contents were the nine `/ai-ugc` files, deleted
 *      with that route. There is no photograph in this repo to point an <img> at.
 *   2. There is no endpoint. HANDOFF.md §3 lists the generation flow as the repo's one
 *      substantive gap — no backend, no auth, no AI. Nothing fetches an asset.
 *   3. The component sheet's imagery is other people's. Nike product photography and
 *      campaign art in the result cards, and photographs of real people in the avatar
 *      picker. Redrawing a company's campaign art into a committed repo is not the same act
 *      as dropping it into a Figma frame, and generating stand-ins for identifiable people
 *      is worse — those are faces, attached in the sheet to an ethnicity filter.
 *
 * So this paints a deterministic composition per seed and every consumer uses it: the picker
 * grids, the filled Touchpoint slots, the template row, the result cards. ONE component
 * rather than four inline copies, which is the same argument the brief makes about the
 * Touchpoint — the third copy is where they start to disagree.
 *
 * IT IS DELIBERATELY NOT PHOTOREALISTIC. A convincing fake in a design system is the thing
 * somebody screenshots into a deck, so these read as artwork at thumbnail size and as
 * obviously-drawn at full size. Every consumer also renders an `sr-only` line saying so.
 *
 * CHART TOKENS PAINT THE GROUNDS, which is a role crossing worth naming. `chart/1..5` are
 * declared for data series. They are used here because a ground standing in for an uploaded
 * photograph has no role in the set, and the alternative was five hand-typed hexes, which
 * rule 2 forbids outright. A borrowed token beats an invented colour. When real uploads land
 * this file goes away and the crossing goes with it.
 * ------------------------------------------------------------------------- */

export type ArtSeed = 1 | 2 | 3 | 4 | 5;

/** Which composition to draw. The shapes differ per kind because the things they stand in
 *  for differ in silhouette — a garment is a centred mass, a person is a head-and-shoulders
 *  higher in the frame, and a template is a full-bleed layout. Drawing one shape for all
 *  three made the pickers look like they held the same twelve items. */
export type ArtKind = 'product' | 'avatar' | 'template';

export function PlaceholderArt({
  seed,
  kind,
  className = '',
}: {
  seed: ArtSeed;
  kind: ArtKind;
  className?: string;
}) {
  return (
    <span
      aria-hidden="true"
      className={`relative block h-full w-full overflow-hidden ${className}`}
      style={{
        /* The third stop keeps the rung flat for the top half and only then falls towards
           mesh-base. Two stops put the fade across the whole frame, which read as every
           thumbnail dissolving into the page — a photograph does not fade out at the
           bottom. Inline because the preset emits colours with no `<alpha-value>` slot, so
           a gradient utility cannot fade one. */
        backgroundImage: `linear-gradient(158deg, var(--oz-color-chart-${seed}) 0%, var(--oz-color-chart-${seed}) 52%, var(--oz-color-gradient-mesh-base) 205%)`,
      }}
    >
      {kind === 'avatar' ? <AvatarForm /> : kind === 'product' ? <ProductForm /> : <TemplateForm />}
    </span>
  );
}

/* Every shape below is a tinted overlay rather than a token in its own right:
 * `content/fixed-primary` darkens and `content/on-brand` lightens, both are the same value
 * in either mode, so a composition cannot invert into illegibility when the theme flips.
 * That is the fix for the first version, whose shapes used brand rungs and vanished on any
 * ground painted from the same rung. */

/** Head and shoulders, high in the frame. */
function AvatarForm() {
  return (
    <>
      <span className="absolute left-1/2 top-[16%] h-[30%] w-[30%] -translate-x-1/2 rounded-full bg-content-fixed-primary opacity-[0.26]" />
      <span className="absolute left-1/2 top-[48%] h-[58%] w-[62%] -translate-x-1/2 rounded-t-[999px] bg-content-fixed-primary opacity-[0.22]" />
      <span className="absolute left-[38%] top-[22%] h-[8%] w-[8%] rounded-full bg-content-on-brand opacity-[0.20]" />
    </>
  );
}

/** A centred mass with a shoulder line — a folded garment on a flat ground. */
function ProductForm() {
  return (
    <>
      <span className="absolute left-1/2 top-[24%] h-[56%] w-[64%] -translate-x-1/2 rounded-4 bg-content-fixed-primary opacity-[0.24]" />
      <span className="absolute left-1/2 top-[24%] h-[12%] w-[30%] -translate-x-1/2 rounded-b-full bg-content-on-brand opacity-[0.18]" />
      <span className="absolute bottom-[18%] left-1/2 h-[2px] w-[44%] -translate-x-1/2 bg-content-on-brand opacity-[0.16]" />
    </>
  );
}

/** A cropped arc, a disc and a bottom-anchored product form — a full-bleed layout. */
function TemplateForm() {
  return (
    <>
      <span className="absolute -right-[20%] top-[7%] h-[58%] w-[84%] rounded-full border-[16px] border-content-on-brand opacity-[0.26]" />
      <span className="absolute -left-[14%] top-[30%] h-[34%] w-[48%] rounded-full bg-content-on-brand opacity-[0.16]" />
      <span className="absolute bottom-0 left-1/2 h-[40%] w-[36%] -translate-x-1/2 rounded-t-full bg-content-fixed-primary opacity-[0.24]" />
      <span className="absolute bottom-0 left-[46%] h-[36%] w-[12%] -translate-x-1/2 rounded-t-full bg-content-on-brand opacity-[0.22]" />
    </>
  );
}
