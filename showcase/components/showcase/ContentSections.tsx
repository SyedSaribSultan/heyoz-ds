'use client';

import type { ComponentContent } from '@/lib/content/types';
import { SubHead } from './Section';

/* ---------------------------------------------------------------------------
 * The written guidance, rendered.
 *
 * One layout for all twelve sections on all nine components, for the same reason
 * ComponentSection has one layout: consistency here is structural rather than
 * something to remember, and a page cannot grow a section its siblings lack.
 *
 * Everything is set at a reading measure — 62–68ch — rather than the full column.
 * This is the only part of the page that is prose, and prose set to the width of a
 * data table is prose nobody finishes.
 * ------------------------------------------------------------------------- */

/** A list where each entry is a claim and a consequence. The consequence is the
 *  part that matters, so it gets the readable role and the claim gets the weight. */
function RuleList({ items }: { items: Array<{ head: string; body: string }> }) {
  return (
    <ul className="oz-stack oz-stack-5">
      {items.map((it, i) => (
        <li key={i} className="max-w-[68ch]">
          <p className="text-body-md font-medium text-content-primary">{it.head}</p>
          <p className="mt-space-1 text-body-md text-content-secondary">{it.body}</p>
        </li>
      ))}
    </ul>
  );
}

function Plain({ items }: { items: string[] }) {
  return (
    <ul className="oz-stack oz-stack-3">
      {items.map((s, i) => (
        <li key={i} className="flex max-w-[68ch] gap-space-4 text-body-md text-content-secondary">
          <span aria-hidden="true" className="select-none text-content-tertiary">
            ·
          </span>
          <span>{s}</span>
        </li>
      ))}
    </ul>
  );
}

/** Two columns that must be read together — a situation and its answer. A table
 *  rather than a list because the pairing is the content. */
function PairTable({
  rows,
  left,
  right,
}: {
  rows: Array<[string, string]>;
  left: string;
  right: string;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr>
            {[left, right].map((h) => (
              <th
                key={h}
                scope="col"
                className="w-1/2 border-b-2 border-border-primary px-0 pb-space-3 pr-space-6 text-left font-mono text-label-sm font-medium text-content-tertiary"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map(([a, b], i) => (
            <tr key={i} className="align-top">
              <td className="border-b-2 border-border-tertiary py-space-4 pr-space-6 text-body-md text-content-primary">
                {a}
              </td>
              <td className="border-b-2 border-border-tertiary py-space-4 pr-space-6 text-body-md text-content-secondary">
                {b}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** `E` / `S` / `D`, the vocabulary DECISIONS.md already uses. Rendered as a letter
 *  rather than a word because it repeats on every row and the claim is what should
 *  be read. */
function Mark({ mark }: { mark: string }) {
  const label: Record<string, string> = {
    E: 'mechanically enforced — the build fails',
    S: 'structural — the mistake is unexpressible',
    D: 'a documented convention — nothing checks it',
  };
  return (
    <abbr
      title={label[mark] ?? mark}
      className="font-mono text-label-sm font-medium text-content-secondary no-underline"
    >
      {mark}
    </abbr>
  );
}

export function ContentSections({ content }: { content: ComponentContent }) {
  const c = content;

  return (
    <>
      <div>
        <SubHead tag="the eligibility gate, before any execution rule">Reach for it when</SubHead>
        <Plain items={c.reachForItWhen} />
      </div>

      <div>
        <SubHead>Reach for something else when</SubHead>
        <PairTable
          left="situation"
          right="use instead"
          rows={c.reachForSomethingElseWhen.map((r) => [r.situation, r.instead])}
        />
      </div>

      <div>
        <SubHead tag="in emphasis order">Variants</SubHead>
        <div className="oz-stack oz-stack-6">
          {c.variants.map((v) => (
            <div key={v.variant} className="max-w-[68ch]">
              <p className="font-mono text-label-md text-content-primary">{v.variant}</p>
              <p className="mt-space-2 text-body-md text-content-secondary">
                <span className="text-content-primary">Use when</span> {v.useWhen}
              </p>
              <p className="mt-space-1 text-body-md text-content-secondary">
                <span className="text-content-primary">Avoid when</span> {v.avoidWhen}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div>
        <SubHead>Sizes</SubHead>
        <div className="oz-stack oz-stack-4">
          <RuleList items={c.sizes.guidance.map((s) => ({ head: s.size, body: s.useWhen }))} />
          <p className="max-w-[68ch] text-body-md text-content-tertiary">{c.sizes.note}</p>
        </div>
      </div>

      <div>
        <SubHead tag="the only author-supplied strings this component renders">Copy</SubHead>
        <Plain items={c.copy} />
      </div>

      <div>
        <SubHead>Behaviour under pressure</SubHead>
        <RuleList
          items={c.behaviourUnderPressure.map((b) => ({ head: b.case, body: b.behaviour }))}
        />
      </div>

      <div>
        <SubHead tag="E enforced · S structural · D convention">
          What the build enforces, and what it does not
        </SubHead>
        <div className="oz-stack oz-stack-6">
          <ul className="oz-stack oz-stack-4">
            {c.whatTheBuildEnforces.enforced.map((e, i) => (
              <li key={i} className="flex max-w-[68ch] gap-space-4">
                <span className="w-[2ch] shrink-0 pt-[2px]">
                  <Mark mark={e.mark} />
                </span>
                <span>
                  <span className="text-body-md text-content-primary">{e.claim}</span>{' '}
                  <code className="font-mono text-label-sm text-content-tertiary">
                    {e.assertion}
                  </code>
                </span>
              </li>
            ))}
          </ul>

          {c.whatTheBuildEnforces.notEnforced.length > 0 && (
            <div>
              <p className="mb-space-3 text-label-md font-medium text-content-secondary">
                Not enforced — assume nothing here is checked
              </p>
              <Plain items={c.whatTheBuildEnforces.notEnforced} />
            </div>
          )}
        </div>
      </div>

      {c.looksLikeABugButIsNot.length > 0 && (
        <div>
          <SubHead>Looks like a bug and is not</SubHead>
          <RuleList
            items={c.looksLikeABugButIsNot.map((b) => ({ head: b.observation, body: b.why }))}
          />
        </div>
      )}

      <div>
        <SubHead tag="how these differ, not when to switch">Related</SubHead>
        <PairTable
          left="component"
          right="difference"
          rows={c.related.map((r) => [r.component, r.difference])}
        />
      </div>

      {c.changed.length > 0 && (
        <div>
          <SubHead tag="act on these">Changed</SubHead>
          <RuleList items={c.changed.map((ch) => ({ head: ch.what, body: ch.why }))} />
        </div>
      )}
    </>
  );
}
