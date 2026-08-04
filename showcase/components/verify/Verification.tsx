'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { GATE_FAMILIES, closest, gates, subject, type GateKind, type GateRow } from '@/lib/core/gates';
import { primitiveSummary } from '@/lib/core/primitives';
import { registry } from '@/components/showcase/catalog';
import { suites } from '@/lib/core/suites';
import { BindingTable } from '@/components/showcase/BindingTable';
import { ScrollRegion } from '@/components/showcase/ScrollRegion';
import { Section, SubHead } from '@/components/showcase/Section';
import { Header, NavRail, type NavGroup } from '@/components/showcase/Chrome';
import { ThemeProvider } from '@/components/showcase/ThemeProvider';
import { ButtonLink, Checkbox, Input } from '@/components/ui';

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

/* The audit download. A route rather than a file in `public/`: `reports/` is a sibling
 * of `showcase/` and Next serves static assets only from inside it, so the choice was
 * to copy the JSON in on every build or to serve the module the page already imports.
 * app/audit/route.ts serves the module, and carries the argument. */
const AUDIT_ROUTE = '/audit';

/* ---------------------------------------------------------------------------
 * Which gate families are expanded, as a URL parameter.
 *
 * `?expand=contrast,motion`. The kinds themselves rather than indices or a bitmask, so
 * a link survives a family being added, removed or reordered in GATE_FAMILIES — and a
 * name nobody recognises is dropped on the way in, which means a link to a family that
 * has since been renamed opens the page rather than a wrong one.
 *
 * OWNED BY THE PAGE, not by GateFamily, and that is the reason this hook exists at all.
 * There is one address bar and eight families: eight components each writing their own
 * parameter are eight writers racing on one string, and the last to fire decides what
 * the others said. One owner, one write, one parameter.
 *
 * The per-family filter string is deliberately NOT mirrored, and the asymmetry is the
 * point. "Show me every contrast gate" is a view of this page worth sending; a
 * half-typed needle is a keystroke. Eight of those in one query string would also be a
 * URL longer than the section it addresses.
 * ------------------------------------------------------------------------- */
const EXPAND_PARAM = 'expand';

/** Rewrite the query string and nothing else about the URL.
 *
 *  PRESERVES THE HASH, and that is the load-bearing part. The scroll spy in Chrome.tsx
 *  writes `#gate-contrast`, `#suites` and so on into the address bar as the reader moves
 *  down this page; a URL assembled from pathname plus search alone deletes it, so the
 *  two would fight and whichever wrote last would win. The spy carries the mirror image
 *  of this note and preserves the search for the same reason — both read
 *  `window.location` live, so neither has to know when the other ran. Primitives.tsx
 *  holds the same pair on `/`.
 *
 *  replaceState, not pushState: expanding a table is a view of one page, and a history
 *  entry per checkbox turns Back into "collapse a section". */
function writeExpanded(kinds: GateKind[]) {
  const { pathname, search, hash } = window.location;
  const params = new URLSearchParams(search);
  /* Ordered by GATE_FAMILIES rather than by the order the reader clicked, so one set of
   * open families is always one URL. */
  const value = GATE_FAMILIES.filter((f) => kinds.includes(f.kind))
    .map((f) => f.kind)
    .join(',');
  if (value) params.set(EXPAND_PARAM, value);
  else params.delete(EXPAND_PARAM);
  const next = params.toString();
  const url = `${pathname}${next ? `?${next}` : ''}${hash}`;
  if (url === `${pathname}${search}${hash}`) return;
  window.history.replaceState(null, '', url);
}

function useExpandedFamilies() {
  const [expanded, setExpanded] = useState<GateKind[]>([]);

  /* Read the URL once, after hydration — and gate the writer on having done so.
   *
   * Not in a lazy useState initialiser and not during render: window.location does not
   * exist during the server render, so a first client render that consulted it would
   * disagree with the markup React is hydrating. The gate matters as much as the read,
   * and it is state rather than a ref precisely because effects in one commit run in
   * declaration order — a ref set by the read would already be true when the write
   * effect ran beside it, and the write would delete the parameter the read had just
   * taken. Same construction as Primitives.tsx, for the same reason. */
  const [readUrl, setReadUrl] = useState(false);

  useEffect(() => {
    const raw = new URLSearchParams(window.location.search).get(EXPAND_PARAM) ?? '';
    const known = new Set<string>(GATE_FAMILIES.map((f) => f.kind));
    setExpanded(raw.split(',').filter((k) => known.has(k)) as GateKind[]);
    setReadUrl(true);
  }, []);

  useEffect(() => {
    if (!readUrl) return;
    writeExpanded(expanded);
  }, [readUrl, expanded]);

  /* No debounce, unlike the filter on `/`: a checkbox is one write per click and there
   * is no keystroke to coalesce. */
  const setFamily = useCallback((kind: GateKind, next: boolean) => {
    setExpanded((prev) => {
      if (prev.includes(kind) === next) return prev;
      return next ? [...prev, kind] : prev.filter((k) => k !== kind);
    });
  }, []);

  return { expanded, setFamily };
}

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

      {/* The artifact, not a description of it. Every figure above and below is joined
          from this one file, and a reviewer's first useful question — "can I have the
          data" — had no answer on the page that exists to answer questions. */}
      <p className="mt-space-5 text-body-md text-content-tertiary">
        All of it is joined from one file, and the file is downloadable rather than
        described:{' '}
        <ButtonLink href={AUDIT_ROUTE} variant="neutral">
          reports/audit.json
        </ButtonLink>
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

/** One gate family. Collapsed to its margins by default — every row in it passes, so
 *  the interesting number is not "did it" but "by how much".
 *
 *  (That sentence used to say "all 250 rows pass". `gates.total` is 252 today. A
 *  hardcoded count in a comment on the verification page is CLAUDE.md rule 5 broken in
 *  the one file least entitled to break it, so the number is gone rather than
 *  corrected — the row counts this component prints are all read from the audit.)
 *
 *  `showAll` is owned by the page, not by this component, because it is mirrored into
 *  the query string and there is only one of those. See useExpandedFamilies. */
function GateFamily({
  kind,
  title,
  blurb,
  unit,
  index,
  showAll,
  onShowAllChange,
}: {
  kind: GateKind;
  title: string;
  blurb: string;
  unit: (r: GateRow) => string;
  index: string;
  showAll: boolean;
  onShowAllChange: (next: boolean) => void;
}) {
  /* Local to the session on purpose, unlike showAll — the asymmetry is argued in the
   * note on useExpandedFamilies. */
  const [query, setQuery] = useState('');

  /* Memoised on `kind` so the filter below has a stable input. Both were plain calls,
   * which was harmless while this component owned all its state and is not now:
   * expanding any family re-renders every family, and a fresh `rows` array each time
   * would re-filter every row in all eight of them on each toggle and each keystroke. */
  const rows = useMemo(() => gates.byKind(kind), [kind]);
  const tight = useMemo(() => closest(kind, 5), [kind]);

  const needle = query.trim().toLowerCase();
  const filtering = needle.length > 0;

  /* Three fields, because those are the three a reviewer arrives knowing: the token
   * path or pairing they were sent, the mode they were told about, and — for motion and
   * layout, where the subject is one token with several assertions on it — which
   * assertion. Matching the measured value would be matching a float against a typed
   * string and would find nothing. */
  const matching = useMemo(
    () =>
      needle
        ? rows.filter((r) =>
            `${subject(r)} ${r.mode ?? ''} ${r.metric}`.toLowerCase().includes(needle),
          )
        : rows,
    [needle, rows],
  );

  /* A query beats the cap. The five-closest view is right because everything passes and
   * the margin is the only variable left — and that argument holds exactly until
   * somebody is looking for one named pairing, at which point showing five rows out of
   * a couple of hundred is answering a question nobody asked and the only way through
   * was "expand all, then Ctrl+F". The checkbox keeps its own state underneath, so
   * clearing the query returns the view it was in rather than a third state. */
  const visible = filtering ? matching : showAll ? rows : tight;
  const failing = rows.filter((r) => !r.pass);
  const metrics = Array.from(new Set(rows.map((r) => r.metric)));

  if (rows.length === 0) return null;

  return (
    <Section
      id={`gate-${kind}`}
      index={index}
      title={title}
      tag={`${rows.filter((r) => r.pass).length}/${rows.length} pass`}
      blurb={blurb}
    >
      {/* items-end rather than the cluster's centre alignment: the Input carries its own
          label above the field, so centring would hang the status line and the checkbox
          off the middle of a two-line block. Same idiom as the primitive filter on `/`. */}
      <div className="mb-space-4 flex flex-wrap items-end gap-space-5">
        {/* Measured in ch so the field tracks its own type step instead of being pinned
            to a pixel width, and narrow on purpose: this is a filter above a dense
            table, not the subject of the section. No `message` either — the same help
            sentence under all eight of these is eight lines of repetition, so it is said
            once, in the empty state, at the only moment anyone needs it. */}
        <div className="w-full max-w-[28ch]">
          <Input
            label="Filter"
            placeholder="subject, mode or metric"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>

        {/* aria-live, because the count IS the result of typing. Without it a screen
            reader user gets a table that silently grew or shrank. */}
        <p
          aria-live="polite"
          className="pb-space-3 font-mono text-label-sm text-content-tertiary"
        >
          {filtering
            ? `${matching.length} of ${rows.length} match`
            : showAll
              ? `all ${rows.length}`
              : `the ${tight.length} closest to their floor`}
        </p>

        {/* The system's Checkbox, which this was not.
            It was `<input type="checkbox" class="accent-fill-brand">` — a browser-drawn
            control on the site whose thesis is that every specimen is the real
            component, and the one control here that no check could see. The three sweeps
            that measure colour pairings, borders and springs all walk the recipe
            registry, and a raw input is in no recipe; verify:classes only asks whether a
            class has a rule, and `accent-fill-brand` is a literal in the source so it
            has one. Nothing anywhere measured what accent-color actually painted, or
            that the tick against that fill is a pairing at all. The control that was not
            built from a recipe was exactly the control nothing checked.
            It also arrives at min-h-target instead of the ~13px box a browser draws,
            which is the row getting taller for a reason. */}
        <div className="ml-auto">
          <Checkbox
            checked={showAll}
            onCheckedChange={onShowAllChange}
            label={`Show all ${rows.length}`}
          />
        </div>
      </div>

      {visible.length === 0 ? (
        /* A real answer rather than a table with a header and no body, which reads as a
           broken page rather than as a query that found nothing. The example subject and
           the metric list are read from this family's own rows, so they cannot describe a
           shape the data does not have. */
        <p className="rounded-5 border-2 border-border-secondary px-space-5 py-space-6 text-body-md text-content-secondary">
          No gate in this family matches{' '}
          <span className="font-mono text-content-primary">{query.trim()}</span>. The filter reads
          three fields — subject, mode and metric. A subject here looks like{' '}
          <span className="font-mono">{subject(rows[0])}</span>, and the metrics are{' '}
          <span className="font-mono">{metrics.join(', ')}</span>.
        </p>
      ) : (
        /* Was a bare `<div class="overflow-x-auto …">`: a scroller with no focusable
           child, so on a narrow column every measured number in the family was
           reachable by mouse and by nothing else (WCAG 2.1.1), and the clipped edge read
           as a table that simply ended there. The frame classes move onto ScrollRegion's
           own className because the element that clips has to be the element that draws
           the border. No `fade` prop: the rows sit on the page, and only the header row
           is on surface/secondary. */
        <ScrollRegion
          label={`${title} gates`}
          className="rounded-5 border-2 border-border-secondary"
        >
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
        </ScrollRegion>
      )}

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

  const { expanded, setFamily } = useExpandedFamilies();

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
              showAll={expanded.includes(f.kind)}
              onShowAllChange={(next) => setFamily(f.kind, next)}
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
