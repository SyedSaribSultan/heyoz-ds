'use client';

import { Button } from '@/components/ui';
import { Composer } from './Composer';
import { HeartIcon } from './icons';

/* ---------------------------------------------------------------------------
 * The /static-ads hero.
 *
 * THE GLOW. Same argument StudioHero makes: the wash is the reason this screen needs no
 * invented colour. `gradient/mesh-*` already exists and already inverts —
 *
 *   mesh-base   #FFFFFF light   #151312 dark
 *   mesh-3      #FFD8CE light   #7F1900 dark
 *   halo        #FC66454D light  #FF3D0114 dark   (both carry alpha)
 *
 * — so a pale warm wash in light and the reference's deep burnt red in dark come out of
 * one ramp. mesh-3 is the whole wash here and mesh-1/mesh-4 are deliberately unused: in
 * dark they are #D53100 and #FF3D01, and the reference's hot spot is a muted brown-red,
 * not the brand fill spread across a third of the screen. That mistake is recorded twice
 * in StudioHero's header; this is the third place not to make it.
 *
 * Written as an inline `backgroundImage` naming the custom properties rather than as
 * Tailwind `from-*`/`to-*` utilities, for the two reasons StudioHero gives: the preset
 * emits colours as plain `var(--oz-…)` with no `<alpha-value>` slot, so a gradient utility
 * cannot fade one to transparent — and a top-anchored radial pair is not expressible in
 * the two-stop utility vocabulary at all.
 *
 * TWO STOP LISTS, ONE PER MODE, expressed as two layers switched by `dark:` rather than as
 * one layer with `dark:` on a style attribute — an inline style cannot carry a variant.
 * The mesh ramp is not perceptually parallel between the modes (mesh-3 is a pale pink in
 * light and a deep maroon in dark), so the same percentages read as too strong in one and
 * invisible in the other. The colours are still entirely the token layer's; only which
 * rung sits at which percentage differs, which is what a composition is.
 * ------------------------------------------------------------------------- */

/* THE CENTRES ARE FAR ABOVE THE SECTION AND THE RADII ARE HUGE, AND BOTH ARE THE POINT.
 * The first attempt put the mesh coat at `at 44% -8%` with a 52% ry, and it was wrong in a
 * way worth recording because it is the obvious thing to write.
 *
 * A radial-gradient paints its 0% stop — the FULL, opaque colour — at its centre. Put that
 * centre just above the top edge and the top edge sees very nearly 100% of the colour: in
 * dark that is `mesh-3` at #7F1900 undiluted, a saturated burnt orange in a hard band across
 * the top of the screen. The reference's warmest pixel is closer to 35% of that over black.
 *
 * `mesh-3` carries no alpha, so it cannot simply be faded — the dilution has to come from
 * geometry. Pushing the centre to -100% with a 200% ry puts the top edge at half the
 * radius, and with the transparent stop at 78% that lands the visible peak at
 * `1 − 0.5/0.78 ≈ 36%` of the colour, falling to nothing around 56% down the section. Same
 * ramp, same token, no hand-mixed value — the wash is dimmed by where the ellipse is
 * rather than by inventing a paler rung.
 *
 * `halo` is the opposite case and needs none of this: at #FF3D0114 it is already an 8% wash
 * of the brand fill, so it is stacked twice near the top to put a slightly hotter core
 * inside the mesh wash and keep it from reading as flat brown. */

/** Light: the same geometry, one coat. `mesh-3` is #FFD8CE here — a pale pink that needs
 *  less dilution than the dark rung, hence the shallower push and the nearer stop. */
const GLOW_LIGHT: React.CSSProperties = {
  backgroundImage: [
    'radial-gradient(70% 70% at 46% -22%, var(--oz-color-gradient-halo) 0%, transparent 74%)',
    'radial-gradient(120% 170% at 45% -86%, var(--oz-color-gradient-mesh-3) 0%, transparent 72%)',
  ].join(', '),
};

/** Dark. */
const GLOW_DARK: React.CSSProperties = {
  backgroundImage: [
    'radial-gradient(58% 62% at 47% -12%, var(--oz-color-gradient-halo) 0%, transparent 72%)',
    'radial-gradient(72% 74% at 47% -8%, var(--oz-color-gradient-halo) 0%, transparent 76%)',
    'radial-gradient(120% 200% at 47% -100%, var(--oz-color-gradient-mesh-3) 0%, transparent 78%)',
  ].join(', '),
};

export function StaticAdsHero() {
  return (
    <section
      aria-labelledby="static-ads-headline"
      /* isolate so the -z-10 glow layers stack against this section rather than escaping
         behind the page background and disappearing. Padding, not a height: the headline
         wraps to three lines on a narrow column, and a pinned height would push the
         composer out through the bottom edge. */
      className="relative isolate overflow-hidden pb-space-5"
    >
      {/* The glow is its own layer so the section keeps a solid base underneath it. One
          element carrying both would mean the transparent stops fade to nothing rather
          than to the page colour, and the seam shows. */}
      <div aria-hidden="true" className="absolute inset-0 -z-10 dark:hidden" style={GLOW_LIGHT} />
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 hidden dark:block"
        style={GLOW_DARK}
      />

      {/* Account actions. In the rail on /studio, up here on this screen, because this one
          is reachable before sign-in — which is also why "Start for free" is the only
          brand-filled control above the composer. */}
      <div className="flex justify-end gap-space-2 px-space-5 pt-space-4">
        <Button variant="tonal" size="xs" shape="pill" leadingIcon={<HeartIcon />}>
          Pricing
        </Button>
        <Button variant="primary" size="xs" shape="pill">
          Start for free
        </Button>
      </div>

      {/* Back on the scale. This was `lg:pt-[152px]`, measured off the first reference — but
          that reference was a short viewport where the block sat lower, and the second one
          puts the eyebrow around 14% down a tall window with two content sections below the
          fold. 96px is the step that lands there, so the arbitrary value is gone rather than
          re-measured: a number on the scale that is right beats a measured one that was only
          right for one window height. */}
      <div className="px-space-6 pt-space-12 text-center lg:pt-space-17">
        <p className="font-mono text-label-sm uppercase tracking-[0.18em] text-content-tertiary">
          Content Studio
        </p>

        {/* The break is explicit, not a max-width. A ch-based measure was the first
            attempt and it wrapped after "YOU", because where a clamp breaks depends on the
            rendered width of the words. The reference puts the accent line on its own row,
            which is a composition decision rather than a consequence of the measure — so
            it is stated.

            heading-xl (36px), and it is the third step tried here. display-md clamps to
            52px, which sets this line about 200px wider than the reference draws it —
            uppercase at the biggest step is not the same as the biggest step. display-sm
            (40px) was closer and still read large against the two card sections below it,
            which is the thing the first reference could not show: a headline is only as big
            as what sits under it, and nothing sat under it then.

            heading-xl rather than a display step is a deliberate role crossing on a hero
            headline. It is the only 36px step in the set, and the alternative was an
            arbitrary font-size, which loses the step's own leading and tracking. */}
        <h1
          id="static-ads-headline"
          className="mt-space-5 font-display text-heading-xl font-extrabold uppercase text-content-primary"
        >
          <span className="block">Everything you need for</span>
          {/* content/brand-HOVER rather than content/brand, per CLAUDE.md 4b: this line
              sits on a composited gradient ground the token layer cannot measure, and the
              -hover step of every accent role clears 4.5:1 on every rung of the surface
              ladder in both modes. It is also simply closer to the reference, which draws
              a lighter coral than brand/60. */}
          <span className="block text-content-brand-hover">Static advertising</span>
        </h1>

        <Composer />
      </div>
    </section>
  );
}
