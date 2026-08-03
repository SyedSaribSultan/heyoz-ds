'use client';

import { useState } from 'react';
import { GATE_FAMILIES, closest, gates, subject, type GateKind, type GateRow } from '@/lib/core/gates';
import { primitiveSummary } from '@/lib/core/primitives';
import { registry } from '@/components/showcase/catalog';
import { suites } from '@/lib/core/suites';
import { BindingTable } from '@/components/showcase/BindingTable';
import { Section, SubHead } from '@/components/showcase/Section';
import { Header, NavRail, type NavGroup } from '@/components/showcase/Chrome';
import { ThemeProvider } from '@/components/showcase/ThemeProvider';

/* ---------------------------------------------------------------------------
 * The Verification route.
 *
 * This page and `/` are the same content answering two different questions.
 * `/` answers "what is this and how do I use it" — specimen, intent, guidance.
 * This one answers "how do I know it is correct" — every measured gate, every
 * resolved binding, every count.
 *
 * They are split because those two jobs want opposite pages. A reference is
 * scanned and wants air; an audit is read closely and wants density. Trying to be
 * both is why the binding table for Button — forty rows of hex — used to sit
 * between the specimen and the usage snippet on the page a designer opens to look
 * at a button.
 *
 * Nothing here is computed. Every number is joined from reports/audit.json, which
 * `node build/build.mjs` regenerates and exits non-zero on. That is also why this
 * page can replace test/index.html rather than sit beside it: the generated rig
 * existed to render exactly this data, and two renderings of one dataset is one
 * more than can be kept in step.
 *
 * Density is correct here. The borders, the monospace, the tables — all the things
 * that were stripped out of `/` — belong on an audit.
 * ------------------------------------------------------------------------- */

function Verdict() {
  const built = new Date(gates.generatedAt).toISOString().slice(0, 16).replace('T', ' ');
  const clean = gates.failing.length === 0 && gates.errors === 0;

  return (
    <div className="pt-space-11">
      <p className="font-mono text-label-sm uppercase text-content-tertiary">Verification</p>
      <h1 className="mt-space-3 max-w-[20ch] font-display text-display-lg font-extrabold text-content-primary">
        {gates.passing} of {gates.total} gates pass.
      </h1>
      <p className="mt-space-7 max-w-[58ch] text-body-lg text-content-secondary">
        Every figure on this page was measured by <code className="font-mono">node build/build.mjs</code>,
        which exits non-zero on any failure — so a page that renders at all is a page whose gates
        passed. Nothing here is a claim about the system; it is the system&rsquo;s own output, joined
        to a label.
      </p>

      <dl className="mt-space-12 grid grid-cols-2 gap-x-space-6 gap-y-space-9 border-t-2 border-border-primary pt-space-8 sm:grid-cols-3 lg:grid-cols-5">
        {[
          [`${gates.passing}/${gates.total}`, 'gates', 'measured, not asserted'],
          [`${gates.counts.colorPrimitives}`, 'primitives', `${primitiveSummary.families} families`],
          [`${gates.counts.semanticPerMode}`, 'semantic', 'per mode, ×2 modes'],
          [`${gates.errors}`, 'errors', clean ? 'clean build' : 'see below'],
          [built.slice(0, 10), 'built', `${built.slice(11)} UTC`],
        ].map(([value, label, sub]) => (
          <div key={label}>
            <dt className="font-mono text-label-sm uppercase text-content-tertiary">{label}</dt>
            <dd className="mt-space-3 font-display text-display-sm font-extrabold tabular-nums text-content-primary">
              {value}
            </dd>
            <dd className="mt-space-2 max-w-[22ch] text-body-sm text-content-tertiary">{sub}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

/** One gate family. Collapsed to its margins by default — all 250 rows pass, so
 *  the interesting number is not "did it" but "by how much". */
function GateFamily({
  kind,
  title,
  blurb,
  unit,
  index,
}: {
  kind: GateKind;
  title: string;
  blurb: string;
  unit: (r: GateRow) => string;
  index: string;
}) {
  const [showAll, setShowAll] = useState(false);
  const rows = gates.byKind(kind);
  const tight = closest(kind, 5);
  const visible = showAll ? rows : tight;
  const failing = rows.filter((r) => !r.pass);

  if (rows.length === 0) return null;

  return (
    <Section
      id={`gate-${kind}`}
      index={index}
      title={title}
      tag={`${rows.filter((r) => r.pass).length}/${rows.length} pass`}
      blurb={blurb}
    >
      <div className="mb-space-4 oz-cluster oz-cluster-4">
        <p className="font-mono text-label-sm text-content-tertiary">
          {showAll ? `all ${rows.length}` : `the ${visible.length} closest to their floor`}
        </p>
        <label className="ml-auto flex cursor-pointer items-center gap-space-2 text-label-sm text-content-secondary">
          <input
            type="checkbox"
            checked={showAll}
            onChange={(e) => setShowAll(e.target.checked)}
            className="h-space-4 w-space-4 accent-fill-brand"
          />
          Show all {rows.length}
        </label>
      </div>

      <div className="overflow-x-auto rounded-5 border-2 border-border-secondary">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-surface-secondary">
              {['subject', 'mode', 'measured', 'floor', ''].map((h, i) => (
                <th
                  key={h || i}
                  scope="col"
                  className="whitespace-nowrap border-b-2 border-border-primary px-space-4 py-space-3 text-left font-mono text-label-sm font-medium text-content-tertiary"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {visible.map((r, i) => (
              <tr key={`${subject(r)}-${r.mode}-${i}`} className="text-content-secondary">
                <td className="border-b-2 border-border-tertiary px-space-4 py-space-3 font-mono text-label-sm text-content-primary">
                  {subject(r)}
                </td>
                <td className="whitespace-nowrap border-b-2 border-border-tertiary px-space-4 py-space-3 font-mono text-label-sm">
                  {r.mode ?? '—'}
                </td>
                <td className="whitespace-nowrap border-b-2 border-border-tertiary px-space-4 py-space-3 font-mono text-label-sm tabular-nums text-content-primary">
                  {unit(r)}
                </td>
                <td className="whitespace-nowrap border-b-2 border-border-tertiary px-space-4 py-space-3 font-mono text-label-sm tabular-nums">
                  {r.min}
                </td>
                <td className="whitespace-nowrap border-b-2 border-border-tertiary px-space-4 py-space-3">
                  <span
                    className={`font-mono text-label-sm ${
                      r.pass ? 'text-content-success' : 'text-content-critical'
                    }`}
                  >
                    {r.pass ? 'pass' : 'FAIL'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {failing.length > 0 && (
        <p className="mt-space-4 text-body-md text-content-critical">
          {failing.length} failing. This page should not have rendered — the build exits non-zero
          before writing <code className="font-mono">reports/audit.json</code>, so a failure visible
          here means the audit is stale. Re-run{' '}
          <code className="font-mono">node build/build.mjs</code>.
        </p>
      )}
    </Section>
  );
}

/** The checks that live at THIS layer, rather than at the token build.
 *
 *  For most of this system's life these printed to a terminal and vanished, while
 *  the page showed "250/250 gates" — the token build's verdict — as though it were
 *  the whole story. It is not: the token build measures tokens, and deciding to put
 *  `content/primary` on `surface/critical`, or a spatial spring on a colour, or a
 *  border with no reason, all happen in a recipe where `build/spec.mjs` cannot see
 *  them. Those decisions are what these six measure.
 *
 *  Read from `reports/showcase-verify.json`, which each script appends to on its
 *  last run. Gitignored and timestamped, because it is a record rather than a source
 *  of truth — and a stale record that says so is better than a fresh-looking one. */
function ShowcaseSuites({ index }: { index: string }) {
  if (!suites.length) {
    return (
      <Section
        id="suites"
        index={index}
        title="Component-layer checks"
        blurb="No results recorded yet."
      >
        <p className="max-w-[68ch] text-body-md text-content-secondary">
          Run <code className="font-mono">npm run verify</code> in{' '}
          <code className="font-mono">showcase/</code>. Each script writes its outcome to{' '}
          <code className="font-mono">reports/showcase-verify.json</code>, which this section
          renders. The file is gitignored, so a fresh clone shows this until the suite has been
          run once.
        </p>
      </Section>
    );
  }

  const passing = suites.filter((s) => s.ok).length;

  return (
    <Section
      id="suites"
      index={index}
      title="Component-layer checks"
      tag={`${passing}/${suites.length} suites`}
      blurb="What the token build cannot see. It measures tokens; these measure the decisions recipes make with them — which pairing a component created, which spring it reached for, whether a stroke has a reason, and whether a class it composes at runtime has a rule."
    >
      <div className="oz-stack oz-stack-9">
        {suites.map((s) => (
          <div key={s.suite}>
            <SubHead
              tag={
                <span className={s.ok ? 'text-content-success' : 'text-content-critical'}>
                  {s.ok ? `${s.passed}/${s.total} pass` : `${s.total - s.passed} failing`}
                </span>
              }
            >
              {s.suite}
            </SubHead>
            <p className="mb-space-4 max-w-[68ch] text-body-md text-content-secondary">{s.blurb}</p>
            {s.detail.length > 0 && (
              <ul className="oz-stack oz-stack-1">
                {s.detail.map((d, i) => (
                  <li key={i} className="font-mono text-label-sm text-content-tertiary">
                    {d}
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </div>
    </Section>
  );
}

/** Every component's resolved bindings. Moved here off the Design System route,
 *  where a forty-row hex table sat between the specimen and the usage snippet. */
function Bindings({ index }: { index: string }) {
  return (
    <Section
      id="bindings"
      index={index}
      title="Bindings"
      tag={`${registry.size} components`}
      blurb="Every token every recipe names, resolved in the current mode, with the tier-1 primitive it came from. Not documentation about the components — a rendering of the objects they are compiled from, joined against the build's own audit output."
    >
      <div className="oz-stack oz-stack-11">
        {registry.all.map((entry) => (
          <div key={entry.recipe.id}>
            <SubHead tag={`${entry.recipe.tokensUsed.length} distinct tokens`}>
              {entry.recipe.meta.title}
            </SubHead>
            <BindingTable recipe={entry.recipe} />
          </div>
        ))}
      </div>
    </Section>
  );
}

export function Verification({ staleSources = [] }: { staleSources?: string[] }) {
  const pad = (n: number) => String(n).padStart(2, '0');
  let n = 0;

  const navGroups: NavGroup[] = [
    {
      label: 'gates',
      items: GATE_FAMILIES.filter((f) => gates.byKind(f.kind).length > 0).map((f) => ({
        id: `gate-${f.kind}`,
        label: f.title,
      })),
    },
    {
      label: 'this layer',
      items: [
        { id: 'suites', label: 'Component-layer checks' },
        { id: 'bindings', label: 'Bindings' },
      ],
    },
  ];

  return (
    <ThemeProvider>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-space-4 focus:top-space-4 focus:z-tooltip focus:rounded-4 focus:bg-fill-inverse focus:px-space-4 focus:py-space-3 focus:text-label-sm focus:text-content-on-inverse"
      >
        Skip to content
      </a>

      <Header route="verify" staleSources={staleSources} />

      <div className="mx-auto grid max-w-container-xl grid-cols-1 gap-x-space-9 px-space-6 lg:grid-cols-rail">
        <NavRail groups={navGroups} />

        <main id="main" className="min-w-0 pb-space-18">
          <Verdict />

          {GATE_FAMILIES.map((f) => (
            <GateFamily
              key={f.kind}
              kind={f.kind}
              title={f.title}
              blurb={f.blurb}
              unit={f.unit}
              index={pad(++n)}
            />
          ))}

          <ShowcaseSuites index={pad(++n)} />
          <Bindings index={pad(++n)} />

          <footer className="mt-space-18 border-t-2 border-border-primary py-space-9">
            <p className="max-w-[74ch] text-body-md text-content-secondary">
              This page replaced <code className="font-mono">test/index.html</code>, which was
              generated by the build to render this same data as a standalone file. Two renderings
              of one dataset is one more than can be kept in step, and the rig could not show the
              four checks that live at the component layer —{' '}
              <code className="font-mono">verify:contrast</code>,{' '}
              <code className="font-mono">verify:motion</code>,{' '}
              <code className="font-mono">verify:borders</code> and{' '}
              <code className="font-mono">verify:classes</code> — because those measure what the
              recipes compile to rather than what the tokens declare.
            </p>
          </footer>
        </main>
      </div>
    </ThemeProvider>
  );
}
