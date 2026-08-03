'use client';

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

      {/* The live proof. Hovering this bar runs the component's own spring on its own
          declared properties — not an illustration of it, the same two custom
          properties the className resolves to. */}
      <div className="oz-cluster oz-cluster-4">
        <span className="font-mono text-label-sm text-content-tertiary">feel it</span>
        <div
          className={`h-space-8 w-space-14 rounded-4 bg-fill-secondary hover:bg-fill-brand ${
            m.properties === 'none' ? '' : recipe.motionClasses
          }`}
          style={{ transitionProperty: 'background-color' }}
          aria-hidden="true"
        />
        <span className="font-mono text-label-sm text-content-tertiary">
          {m.transition} · settles in{' '}
          <span className="text-content-secondary">
            var(--oz-spring-{m.transition}-ms)
          </span>
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
