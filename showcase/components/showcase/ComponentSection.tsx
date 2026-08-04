'use client';

import { useEffect, useState } from 'react';
import type { RegistryEntry } from '@/lib/core/Registry';
import { content } from '@/lib/content';
import { ContentSections } from './ContentSections';
import { Section, Notes, Stage, SubHead } from './Section';
import { Snippet, TokenStrip } from './Snippet';
import { VariantMatrix } from './VariantMatrix';

/* One layout, applied to every registered component.
 *
 * The page never writes a component section by hand. It maps the registry through
 * this, which means a new component gets a nav entry, a live row, a state grid, a
 * binding table, a token inventory and a usage snippet from the act of being
 * registered. Consistency here is structural rather than a thing to remember. */

/** The settle time of a spring, as the running stylesheet resolves it.
 *
 *  This block used to render the literal string `var(--oz-spring-<name>-ms)` — the
 *  name of the place a value lives, on a page whose whole thesis is that every figure
 *  it shows was measured. The comment below it already claimed the settle times were
 *  "read from the CSS custom properties the token build emitted"; that was true of the
 *  mechanism and false of the rendering, which is the more embarrassing half.
 *
 *  It is the only number in this folder that cannot come out of `reports/audit.json`:
 *  the audit carries colour, contrast, typography and the bridge, and no motion at
 *  all, so there is nothing to join against. Swatch.tsx makes the case for preferring
 *  the audit to a computed style wherever both exist — it would "agree most of the
 *  time and disagree exactly when something was wrong" — and here only the second
 *  exists. It is not a parallel figure either: `duration-<spring>` in
 *  `recipe.motionClasses` resolves to this same custom property, so what is printed is
 *  what the bar beside it is running on.
 *
 *  Returns '' for a property that is not there, which is what a renamed token or an
 *  unbuilt `dist/` looks like from in here. The caller has to cope with that rather
 *  than render "settles in ms".
 *
 *  Nothing is read while rendering. getComputedStyle does not exist on the server, and
 *  a value present on the first client render and absent from the server's HTML is a
 *  hydration mismatch — the discipline ThemeProvider documents at length. One read is
 *  enough: the reduced-motion block repoints the spring *curves* and deliberately
 *  leaves the `-ms` twins alone (movement goes, speed stays), and no mode changes a
 *  duration, so there is nothing here for a theme switch to invalidate. */
function useSettleTime(spring: string): string {
  const [settle, setSettle] = useState('');

  useEffect(() => {
    /* Trimmed. A custom property comes back carrying whatever whitespace followed the
     * colon in the declaration, so the string arrives with a leading space and would be
     * rendered with it — mono type, so it shows. */
    setSettle(
      getComputedStyle(document.documentElement)
        .getPropertyValue(`--oz-spring-${spring}-ms`)
        .trim(),
    );
  }, [spring]);

  return settle;
}

/** The component's motion, rendered from `recipe.motion`.
 *
 *  Same contract as the binding table above it: this is not a description of how the
 *  component moves, it is the object the component's transition classes are compiled
 *  from. The spring names shown are the ones in the className, and the settle times
 *  are read from the CSS custom properties the token build emitted — so a spring
 *  retuned in spec.mjs changes this table on the next reload without anyone editing
 *  it. Motion documentation that is written by hand goes stale the first time
 *  somebody adjusts a duration, which is the whole argument this folder is built on,
 *  applied to time rather than to colour. */
function MotionSummary({ recipe }: { recipe: RegistryEntry['recipe'] }) {
  const m = recipe.motion;
  const settle = useSettleTime(m.transition);

  /* Whether the demonstrated state is being held. Client state only — it starts false
   * on the server and on the first client render, so there is nothing to hydrate
   * wrongly, and nothing about it is persisted: it is a thing you do to a bar, not a
   * preference. */
  const [held, setHeld] = useState(false);

  const facts: Array<[string, string]> = [
    ['transition', m.transition],
    ['properties', m.properties],
    ['enter', m.enter === 'none' ? '— none' : `oz-enter-${m.enter}`],
    ['press', m.press ?? '— none'],
  ];
  if (m.ambient) facts.push(['ambient', 'oz-ambient · duration/ambient']);

  return (
    <div className="oz-stack oz-stack-5">
      <dl className="flex flex-wrap gap-x-space-9 gap-y-space-4">
        {facts.map(([k, v]) => (
          <div key={k}>
            <dt className="font-mono text-label-sm uppercase text-content-tertiary">{k}</dt>
            <dd className="mt-space-1 font-mono text-label-md text-content-primary">{v}</dd>
          </div>
        ))}
      </dl>

      <p className="max-w-[68ch] text-body-md text-content-secondary">{m.intent}</p>

      {/* The live proof, and until now the one piece of live evidence on this page that
          needed a mouse.

          It was an `aria-hidden` div whose only trigger was `hover:bg-fill-brand`, so on
          a phone and from a keyboard the single demonstration of how this system moves
          did nothing whatsoever. Snippet.tsx opens with exactly this argument about its
          copy button — hover is not an affordance on a touch screen and is not reachable
          from a keyboard — and this bar is the place it was not applied. It is a toggle
          button now: a click or Enter latches the transitioned state and a second one
          releases it, a pointer still gets the hover preview it always had, and
          `aria-pressed` is what tells a reader which way it currently is.

          It cannot stay `aria-hidden` once it is a control — a focusable element hidden
          from the accessibility tree is a tab stop a screen reader cannot describe — so
          it needs a name, and "feel it" beside it is not one: it says nothing about what
          pressing the thing does. The name leads with that visible text all the same,
          because WCAG 2.5.3 asks that a control's visible label appear inside its
          accessible name; a speech-input user saying "click feel it" has to hit
          something.

          The motion is untouched, which is the entire claim the bar makes: those are the
          component's own `duration-<spring> ease-<spring>` classes, not an imitation of
          them. The inline transition-property narrows the compiled set to the one
          property this bar actually changes, and that stays honest only while every
          declared set contains colour — `colors` and `colors-and-transform` both list
          background-color, `oz-transition-depth` (`properties: 'shadow'`) does not, and
          the first recipe to declare `shadow` would have the bar transitioning on a
          property its component never transitions.

          No min-h-target, for the reason Section.tsx gives about its anchor link: the bar
          is space-8 tall, which clears WCAG 2.5.8's 24px floor, and it is the only
          control in this row so the spacing exception applies — while a 44px box would
          push the row apart to say nothing new. */}
      <div className="oz-cluster oz-cluster-4">
        <span className="font-mono text-label-sm text-content-tertiary">feel it</span>
        <button
          type="button"
          aria-pressed={held}
          aria-label={`Feel it: hold the ${m.transition} transition`}
          onClick={() => setHeld((h) => !h)}
          className={`h-space-8 w-space-14 rounded-4 focus-visible:outline focus-visible:outline-ring focus-visible:outline-offset-ring focus-visible:outline-border-focus ${
            held ? 'bg-fill-brand' : 'bg-fill-secondary hover:bg-fill-brand'
          } ${m.properties === 'none' ? '' : recipe.motionClasses}`}
          style={{ transitionProperty: 'background-color' }}
        />
        {/* The measured number, with the property it came from kept behind it. Dropping
            the name to print the value would trade one kind of missing provenance for
            another — the number is the fact, the name is where to go and change it — so
            the value takes content/secondary and the name stays at the tertiary of the
            sentence around it.

            The middle clause drops out in three cases and the row still reads true
            without it — `effects-fast · --oz-spring-effects-fast-ms`, a spring and where
            its value lives. Before the effect has read the document; when the property is
            not there at all; and when the component declares `properties: 'none'`, which
            is the interesting one. Skeleton declares a spring on the record while
            transitioning nothing, so its bar snaps — and a settle time printed beside a bar
            that snaps is a measured number describing something that is not happening,
            which is this fix's own complaint pointing the other way. (No figure quoted
            here on purpose: the value is the build's and quoting it is how a comment goes
            stale.) */}
        <span className="font-mono text-label-sm text-content-tertiary">
          {m.transition} ·{' '}
          {m.properties !== 'none' && settle && (
            <>
              settles in <span className="text-content-secondary">{settle}</span> ·{' '}
            </>
          )}
          --oz-spring-{m.transition}-ms
        </span>
      </div>
    </div>
  );
}

export function ComponentSection({ entry, index }: { entry: RegistryEntry; index: string }) {
  const { recipe, Live, gridSuppressed } = entry;
  const { meta } = recipe;

  const variantCount = recipe.variants.length;
  const stateCount = recipe.allStates.length;
  const tag = recipe.isStatic
    ? `${variantCount} variants · static`
    : `${variantCount} variants × ${stateCount} states`;

  /* The written guidance, if this component has any. Keyed off the recipe id, so a
   * component without a page still renders its specimen and its generated blocks —
   * a visible gap rather than a silent one. */
  const guidance = content[meta.id];

  return (
    <Section
      id={meta.id}
      index={index}
      title={meta.title}
      tag={tag}
      /* The written definition supersedes the recipe blurb where one exists. Both
       * say what the component is; the definition was written to survive being read
       * alone, as a search result or a Figma description, and the blurb was not. */
      blurb={guidance?.definition ?? meta.blurb}
    >
      <div className="oz-stack oz-stack-9">
        <div>
          <SubHead tag="hover, press and tab through these — the states are real">
            Live
          </SubHead>
          <Stage>
            <Live />
          </Stage>
        </div>

        {guidance && <ContentSections content={guidance} />}

        <div>
          <SubHead
            tag={
              /* The evidence is one click away rather than inline. The full binding
                 table — every state, every role, resolved to a hex and back to its
                 tier-1 primitive — used to sit here, between the specimen and the
                 usage snippet, on the page someone opens to look at a button. It is
                 the auditor's artifact and it lives on the auditor's page now. */
              <a
                href="/verify#bindings"
                className="text-content-tertiary underline decoration-border-tertiary underline-offset-2 transition-colors duration-effects-fast ease-effects-fast hover:text-content-primary"
              >
                resolved values on Verification →
              </a>
            }
          >
            Tokens named by this recipe
          </SubHead>
          <TokenStrip tokens={recipe.tokensUsed} />
        </div>

        {!recipe.isStatic && !gridSuppressed && (
          <div>
            <SubHead>State matrix</SubHead>
            <VariantMatrix entry={entry} />
          </div>
        )}

        {gridSuppressed && (
          <p className="max-w-[74ch] text-body-sm text-content-tertiary">
            No state grid for this one. Its interesting states are structural rather than
            colour-only — a moving thumb, a placeholder, a tick appearing — and a grid of forced
            classes would show the colours while quietly misrepresenting the behaviour. The live
            row above is the honest version.
          </p>
        )}

        <div>
          <SubHead tag={`${recipe.transitionFamily} family`}>Motion</SubHead>
          <MotionSummary recipe={recipe} />
        </div>

        {meta.notes && meta.notes.length > 0 && (
          <div>
            <SubHead>Decisions worth knowing</SubHead>
            <Notes items={meta.notes} />
          </div>
        )}

        <div className="max-w-[68ch]">
          <SubHead>Usage</SubHead>
          {/* The import goes in the copied block. It is the single most-typed line in
              any component reference and the snippet did not carry it, so what you
              pasted never compiled on its own. Derived from meta.tag like the elements
              below it, so a renamed component renames its own import. */}
          <Snippet
            code={[
              `import { ${meta.tag} } from '@/components/ui';`,
              '',
              ...recipe.variants.map((v) => recipe.usage(v)),
            ].join('\n')}
            label={`components/ui/${meta.tag}.tsx`}
          />
        </div>
      </div>
    </Section>
  );
}
