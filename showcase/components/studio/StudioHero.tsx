'use client';

import { Button, IconButton } from '@/components/ui';
import { ArrowUpIcon, AvatarIcon, PlusIcon, ProductIcon } from './icons';

/* ---------------------------------------------------------------------------
 * The hero.
 *
 * The gradient is the whole reason this screen can be built without inventing a
 * colour. `gradient-mesh-*` already exists in the token set and already inverts:
 *
 *   mesh-base   #FFFFFF light   #151312 dark    the panel it fades from
 *   mesh-3      #FFD8CE light   #7F1900 dark    the mid wash
 *   mesh-1      #FF8A6F light   #D53100 dark    the saturated floor
 *   mesh-4      #FFB3A0 light   #FF3D01 dark    the hot spot
 *
 * White-to-pink-to-coral in light and near-black-to-deep-red in dark, which is the
 * reference screenshot in both modes from one declaration. No `dark:` variant, no
 * second gradient, nothing hand-picked.
 *
 * The stops are written as an inline backgroundImage naming those custom properties
 * rather than as Tailwind `from-*`/`to-*` utilities. Two reasons: the preset emits
 * colours as plain `var(--oz-…)` with no `<alpha-value>` slot, so a gradient utility
 * cannot fade one to transparent — the same constraint that makes the showcase header
 * opaque instead of `bg-background/95` — and a four-stop mesh with a radial hot spot
 * is not expressible in the two-stop utility vocabulary at all.
 * ------------------------------------------------------------------------- */

/** Vertical wash plus the off-centre glow.
 *
 *  The stops are much lower and later than they look like they should be, and the first
 *  attempt got this wrong in a way worth recording: starting the wash at 22% and ending
 *  on mesh-1 filled the bottom half of the panel with saturated orange, which is not
 *  what the reference shows at all. In the reference the panel is *black* — or white —
 *  for its top two thirds, the wash only becomes visible around 55%, and full
 *  saturation is reached in the last few percent, at the very bottom edge.
 *
 *  mesh-3 is therefore the FLOOR, not a mid-stop. Putting mesh-1 at 100% was the second
 *  wrong version: in dark it is #D53100, and a full-width band of it across the bottom
 *  tenth of the panel reads as bright orange where the reference reads deep maroon.
 *  Likewise the radial used mesh-4 — #FF3D01, the brand fill itself — which is the most
 *  saturated colour in the set and has no business being the largest area of colour on
 *  the screen. Both are now one rung cooler.
 *
 *  The radial is what stops the floor reading as a flat band: it is centred below the
 *  panel, so only its upper arc shows and the heat falls off towards both bottom corners
 *  — the asymmetry in the reference, where the glow sits centre-left and the right-hand
 *  corner stays dark.
 *
 *  TWO STOP LISTS, ONE PER MODE, and this is the one thing on this screen that could not
 *  be done with a single declaration. The mesh ramp is not perceptually parallel between
 *  the modes: mesh-1 is `#D53100` in dark — nearly the brand fill, and far too hot for a
 *  large area — but `#FF8A6F` in light, a soft coral that is exactly the reference's
 *  floor. So the same stop list is simultaneously too strong in one mode and too weak in
 *  the other, which is not a fault in the tokens. It is what a *composition* is: the
 *  colours are still entirely the token layer's, and only which rung sits at which
 *  percentage differs.
 *
 *  Expressed as two layers switched by `dark:` rather than as one layer with `dark:`
 *  variants on a style attribute, because an inline style cannot carry a variant at all —
 *  and a comment claiming otherwise is the failure this file already had once. */
const MESH_LIGHT: React.CSSProperties = {
  backgroundImage: [
    'radial-gradient(62% 42% at 46% 112%, var(--oz-color-gradient-mesh-4) 0%, transparent 60%)',
    'linear-gradient(to bottom, transparent 26%, var(--oz-color-gradient-mesh-3) 58%, var(--oz-color-gradient-mesh-1) 100%)',
  ].join(', '),
};

const MESH_DARK: React.CSSProperties = {
  backgroundImage: [
    'radial-gradient(58% 34% at 40% 114%, var(--oz-color-gradient-mesh-1) 0%, transparent 56%)',
    'linear-gradient(to bottom, transparent 48%, var(--oz-color-gradient-mesh-3) 100%)',
  ].join(', '),
};

const QUICK_ACTIONS = ['Create ads', 'Make UGC ad', 'Brand insights', 'Research competitors'];

export function StudioHero() {
  return (
    <section
      aria-labelledby="studio-headline"
      /* Padding, not a height. The reference panel is 389px tall at a 1920px viewport
         and every one of those pixels is content plus these two paddings — pinning a
         height instead would mean the headline wrapping to three lines on a narrow
         column pushes the composer out through the bottom edge. */
      className="relative isolate overflow-hidden rounded-8 bg-gradient-mesh-base px-space-6 pb-space-8 pt-space-11"
    >
      {/* The mesh is its own layer so the panel keeps a solid base colour underneath.
          A single element carrying both would mean the transparent stops fade to
          nothing rather than to mesh-base, and on a page background one shade off it
          the seam shows. */}
      <div aria-hidden="true" className="absolute inset-0 -z-10 dark:hidden" style={MESH_LIGHT} />
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 hidden dark:block"
        style={MESH_DARK}
      />

      {/* The break is explicit, not a max-width.
          A measure was the first attempt and it broke in the wrong place — "Turn ideas
          into winning" / "campaigns" — because where a line wraps under a ch-based
          clamp depends on the rendered width of the words, and the highlighted word is
          wider than its text by two lots of horizontal padding. The reference puts the
          chip at the start of line two, which is a composition decision rather than a
          consequence of the measure, so it is stated. */}
      <h1
        id="studio-headline"
        className="text-center font-display text-display-md font-extrabold text-content-primary"
      >
        <span className="block">Turn ideas into</span>
        <span className="block">
          {/* fill/elevated is white in light and a lifted neutral in dark, so the tile
              itself reads as raised against the wash in both modes with one class — the
              same token the showcase header's two toggles use for "this one is picked
              out".

              The `dark:` on the TEXT is the only one in this folder, and it is here
              because the reference genuinely asks for two different roles: the accent on
              a white tile in light, near-white on a tinted tile in dark. No single
              semantic token is brand in one mode and near-white in the other — that is
              not an oversight in the token set, it is a pairing nobody has needed until
              a headline sat on a saturated gradient. The in-system fix is a new role
              declared `[light, dark]` in build/spec.mjs, which is a token change for one
              word on one screen; this is the honest small version, and it is marked so
              the next person knows which of the two they are choosing between. */}
          <span className="inline-block rounded-5 bg-fill-elevated px-space-3 text-content-brand dark:text-content-primary">
            winning
          </span>{' '}
          campaigns
        </span>
      </h1>

      <p className="mx-auto mt-space-5 max-w-[60ch] text-center text-body-md text-content-secondary">
        Create ads, plan campaigns, and research competitors — all in one place.
      </p>

      <Composer />

      <div className="mt-space-4 flex flex-wrap justify-center gap-space-3">
        {QUICK_ACTIONS.map((label) => (
          <Button key={label} variant="secondary" size="sm" shape="pill">
            {label}
          </Button>
        ))}
      </div>
    </section>
  );
}

/** The prompt composer.
 *
 *  A real textarea, not a styled div holding placeholder text. The mock shows a
 *  placeholder, and a div cannot have one — it also cannot be typed into, focused, or
 *  labelled, and this is the primary control on the screen. The frame is the card; the
 *  field inside it is deliberately chromeless, so the focus ring goes on the wrapper
 *  via focus-within rather than on the textarea, which is how the card reads as one
 *  control instead of two.
 */
function Composer() {
  return (
    <div className="mx-auto mt-space-7 max-w-[672px] rounded-8 border-2 border-border-secondary bg-surface-elevated p-space-4 shadow-small focus-within:outline focus-within:outline-ring focus-within:outline-offset-ring focus-within:outline-border-focus">
      <label className="sr-only" htmlFor="studio-prompt">
        Describe what to create
      </label>
      <textarea
        id="studio-prompt"
        rows={1}
        placeholder="Create a static ad for my new product…"
        className="block w-full resize-none bg-transparent px-space-2 pb-space-6 pt-space-1 text-body-md text-content-primary placeholder:text-content-placeholder focus:outline-none"
      />

      <div className="flex items-center gap-space-3">
        <IconButton variant="secondary" size="sm" label="Add an attachment" icon={<PlusIcon />} />
        <Button variant="secondary" size="sm" leadingIcon={<ProductIcon />}>
          Product
        </Button>
        <Button variant="secondary" size="sm" leadingIcon={<AvatarIcon />}>
          Avatar
        </Button>
        <span className="ml-auto">
          <IconButton
            variant="brand"
            size="md"
            shape="pill"
            label="Send prompt"
            icon={<ArrowUpIcon />}
          />
        </span>
      </div>
    </div>
  );
}
