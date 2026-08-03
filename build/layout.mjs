/**
 * layout.mjs — the layout primitives.
 *
 * Eight algorithmic layouts plus the overflow guards, emitted to dist/layout.css.
 *
 * WHY THESE EXIST. "Responsive" in most systems means a handful of viewport
 * breakpoints, and viewport breakpoints are the reason component layout breaks. A
 * card does not care how wide the window is; it cares how wide *its own box* is.
 * The same card sits in a 200px sidebar and a 900px main column on the same screen
 * at the same viewport width, and a media query cannot tell those apart — so it
 * gets one of them wrong, and the fix is a one-off override, and the override is
 * the bug that shows up two months later in a layout nobody tested.
 *
 * Every primitive below is therefore **self-governing**: it reads its own
 * container, never the viewport, and it has no breakpoints. Drop it anywhere and it
 * is correct. This is the approach Heydon Pickering and Andy Bell set out in Every
 * Layout; the container-query mechanics are newer than that book and replace some
 * of its cleverness with something readable.
 *
 * WHAT "NEVER BREAKS" ACTUALLY MEANS. Adaptive layout fails in five specific ways,
 * and they are the same five every time. Each primitive here is built against them
 * and the build gates them:
 *
 *   1. A flex or grid child refuses to shrink below its content, because the
 *      initial value of min-width for a flex item is `auto`, not 0. This is the
 *      single most common overflow in CSS and it has nothing to do with the
 *      viewport. Every primitive here sets `min-width: 0` on its children.
 *
 *   2. `minmax(280px, 1fr)` in a container narrower than 280px. The track cannot
 *      go below its minimum, so the grid overflows. `minmax(min(280px, 100%), 1fr)`
 *      cannot — the min collapses to the container. The build asserts that no
 *      emitted minmax() is missing this.
 *
 *   3. An unbroken string longer than its box: a URL, a hash, a token path, a
 *      German compound noun. Nothing wraps it because there is nowhere to wrap.
 *
 *   4. Content that legitimately does not fit at any size — a nine-column table on
 *      a phone. The failure is pretending it fits. The answer is a Reel: scroll it
 *      deliberately, with the affordance visible.
 *
 *   5. Too many children. Every horizontal layout looks fine with three items and
 *      unusable with nine. Cluster wraps; Switcher has a quantity query.
 *
 * These are declared as data so the build can both emit them and inspect them.
 */

/** Emitted class prefix. Matches the CSS variable namespace. */
const P = 'oz';

/* ------------------------------------------------------------------ *
 * The primitives
 * ------------------------------------------------------------------ */

export const LAYOUTS = [
  {
    name: 'stack',
    intent: 'Vertical rhythm. One axis, one job: put space between things.',
    knobs: { '--stack-space': 'var(--oz-space-5)' },
    notes:
      'gap rather than the classic margin + owl selector. The owl exists because gap ' +
      'had no flex support in 2019; it does now, and gap does not collapse, does not ' +
      'leak past the last child, and does not need resetting when the stack nests.',
    css: `
  display: flex;
  flex-direction: column;
  gap: var(--stack-space);`,
    childCss: `
  min-width: 0;`,
  },

  {
    name: 'cluster',
    intent:
      'A group of things along a line that wraps rather than overflowing. Button rows, tag lists, toolbars, breadcrumbs.',
    knobs: {
      '--cluster-space': 'var(--oz-space-4)',
      '--cluster-align': 'center',
      '--cluster-justify': 'flex-start',
    },
    notes:
      'The wrap is the whole point and it is why a cluster cannot overflow: with ' +
      'flex-wrap: wrap there is no width at which the children have nowhere to go. ' +
      'Failure mode 5 handled structurally rather than by counting items.',
    css: `
  display: flex;
  flex-wrap: wrap;
  gap: var(--cluster-space);
  align-items: var(--cluster-align);
  justify-content: var(--cluster-justify);`,
    childCss: `
  min-width: 0;`,
  },

  {
    name: 'switcher',
    intent:
      'Side by side when the container is wide enough, stacked when it is not. The responsive layout, without a breakpoint.',
    knobs: {
      '--switcher-threshold': '30rem',
      '--switcher-space': 'var(--oz-space-5)',
    },
    /* Item counts at which a switcher gives up and stacks. NOT a custom property:
     * :nth-last-child() takes the An+B microsyntax, which is integer literals only,
     * and var() inside it is a parse error that makes the browser discard the whole
     * selector. The first version of this file emitted
     *
     *     :nth-last-child(n + var(--switcher-limit))
     *
     * which is silently dead CSS — the build passed, the file looked right, and the
     * quantity query simply never fired. So the limits are baked, one modifier class
     * each, and there is now a gate for var() inside :nth-. */
    quantityLimits: [3, 4, 5],
    notes:
      'flex-basis: calc((threshold - 100%) * 999) is the mechanism, and it is doing ' +
      'real work rather than being clever for its own sake. 100% resolves against the ' +
      'CONTAINER, so (threshold - 100%) is positive when the container is narrower ' +
      'than the threshold and negative when it is wider. Times 999 saturates it. A ' +
      'huge positive basis forces one item per line; a negative basis is invalid, so ' +
      'the browser drops that one declaration and flex-grow: 1 lays them out in a ' +
      'row. The result is a container query that predates container queries and needs ' +
      'no container-type, which matters because establishing containment has layout ' +
      'side effects a primitive should not impose on its parent.',
    css: `
  display: flex;
  flex-wrap: wrap;
  gap: var(--switcher-space);`,
    childCss: `
  flex-grow: 1;
  flex-basis: calc((var(--switcher-threshold) - 100%) * 999);
  min-width: 0;`,
    /* Quantity query: past the limit, go vertical regardless of width. Without this
     * a switcher with nine children divides the row nine ways and every child is
     * unreadable — technically not overflowing, practically broken.
     *
     * Default is 5, matching Every Layout. The modifiers let a caller tighten it
     * where the children are wide: `class="oz-switcher oz-switcher-max-3"`. */
    extra: [
      `.${P}-switcher > :nth-last-child(n + 5),`,
      `.${P}-switcher > :nth-last-child(n + 5) ~ * {`,
      `  flex-basis: 100%;`,
      `}`,
      ...[3, 4].flatMap((n) => [
        `.${P}-switcher-max-${n} > :nth-last-child(n + ${n}),`,
        `.${P}-switcher-max-${n} > :nth-last-child(n + ${n}) ~ * {`,
        `  flex-basis: 100%;`,
        `}`,
      ]),
    ].join('\n'),
  },

  {
    name: 'grid',
    intent:
      'As many equal columns as fit, then wrap. Card grids, swatch grids, stat rows.',
    knobs: {
      '--grid-min': '16rem',
      '--grid-space': 'var(--oz-space-5)',
    },
    notes:
      'minmax(min(var(--grid-min), 100%), 1fr) — the inner min() is not optional and ' +
      'is failure mode 2. Without it a 16rem minimum inside a 12rem container gives a ' +
      'track wider than its parent and the grid overflows horizontally, which is the ' +
      'single most common bug in hand-written auto-fit grids. With it the track ' +
      'collapses to the container and you get one full-width column.',
    css: `
  display: grid;
  gap: var(--grid-space);
  grid-template-columns: repeat(auto-fit, minmax(min(var(--grid-min), 100%), 1fr));`,
    childCss: `
  min-width: 0;`,
  },

  {
    name: 'sidebar',
    intent:
      'A fixed-ish sidebar and a fluid main area, which become stacked when the main area would get too narrow.',
    knobs: {
      '--sidebar-width': '16rem',
      '--sidebar-content-min': '60%',
      '--sidebar-space': 'var(--oz-space-6)',
    },
    notes:
      'The sidebar is allowed to be its declared width but never more than the ' +
      'container. The content claims a percentage minimum, and when it cannot have it ' +
      'both wrap. --sidebar-content-min must stay above 50% or the two will sit side ' +
      'by side forever and never wrap, which the build checks.',
    css: `
  display: flex;
  flex-wrap: wrap;
  gap: var(--sidebar-space);`,
    extra: `
.${P}-sidebar > :first-child {
  flex-basis: var(--sidebar-width);
  flex-grow: 1;
  min-width: 0;
}
.${P}-sidebar > :last-child {
  flex-basis: 0;
  flex-grow: 999;
  min-width: var(--sidebar-content-min);
}`,
  },

  {
    name: 'center',
    intent: 'A centred column with a maximum measure and guaranteed gutters.',
    knobs: {
      '--center-max': 'var(--oz-container-measure)',
      '--center-gutter': 'var(--oz-space-6)',
    },
    notes:
      'padding-inline rather than a margin, so the gutter survives the max-width — a ' +
      'centred box with max-width alone touches both screen edges on a narrow phone.',
    css: `
  box-sizing: content-box;
  max-inline-size: var(--center-max);
  margin-inline: auto;
  padding-inline: var(--center-gutter);`,
  },

  {
    name: 'frame',
    intent:
      'A box with a fixed aspect ratio that crops whatever is inside it. Thumbnails, video slots, media placeholders.',
    knobs: { '--frame-ratio': '16 / 9' },
    notes:
      'aspect-ratio plus object-fit: cover on the child. The reason this is a ' +
      'primitive rather than two utilities is that forgetting the object-fit is what ' +
      'produces a stretched image, and the two belong together.',
    css: `
  aspect-ratio: var(--frame-ratio);
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;`,
    extra: `
.${P}-frame > img,
.${P}-frame > video {
  inline-size: 100%;
  block-size: 100%;
  object-fit: cover;
}`,
  },

  {
    name: 'reel',
    intent:
      'Deliberate horizontal overflow with snap points. For content that genuinely does not fit and should not be forced to.',
    knobs: {
      '--reel-space': 'var(--oz-space-4)',
      '--reel-item': 'auto',
    },
    notes:
      'Failure mode 4, answered honestly. A nine-column table on a 360px screen does ' +
      'not fit at any breakpoint, and the choices are to hide columns, shrink text to ' +
      'nothing, or scroll. Scrolling is the only one that keeps all the data. ' +
      'overscroll-behavior-inline: contain stops the swipe escaping to the page, and ' +
      'the scroll-snap makes it feel intentional rather than like a leak.',
    css: `
  display: flex;
  gap: var(--reel-space);
  overflow-x: auto;
  overscroll-behavior-inline: contain;
  scroll-snap-type: inline mandatory;
  scrollbar-width: thin;`,
    childCss: `
  flex: 0 0 var(--reel-item);
  scroll-snap-align: start;
  min-width: 0;`,
  },
];

/* ------------------------------------------------------------------ *
 * Overflow guards
 * ------------------------------------------------------------------ */

/**
 * Not layouts — the hygiene that stops the remaining two failure modes. Separate
 * because they apply to text inside a layout rather than to the layout itself, and
 * because a component usually wants exactly one of them and choosing is a real
 * decision: `truncate` loses information, `break` keeps it and gets ugly.
 */
export const GUARDS = [
  {
    name: 'truncate',
    intent: 'One line, ellipsis when it does not fit. For labels where the full value is available elsewhere.',
    notes:
      'min-width: 0 is included because text-overflow does nothing on a flex child ' +
      'that is refusing to shrink — the single most common reason "truncate is not ' +
      'working". The two are useless apart, so they ship together.',
    css: `
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;`,
  },
  {
    name: 'break',
    intent:
      'Wrap anywhere rather than overflow. For content that can be arbitrarily long and must stay readable: URLs, token paths, hashes, user input.',
    notes:
      'overflow-wrap: anywhere rather than break-word, because break-word will not ' +
      'break a string that has no break opportunity at all — which is exactly the ' +
      'case being defended against. Failure mode 3.',
    css: `
  overflow-wrap: anywhere;
  word-break: normal;`,
  },
  {
    name: 'balance',
    intent: 'Even line lengths for short display text. Headings only.',
    notes:
      'text-wrap: balance is capped by browsers at a handful of lines and is a ' +
      'no-op beyond that, so it is correct on a heading and pointless on a paragraph. ' +
      'Use pretty for body copy — it only fixes orphans, and it costs nothing.',
    css: `
  text-wrap: balance;`,
  },
  {
    name: 'pretty',
    intent: 'Avoid a one-word last line. Body copy.',
    css: `
  text-wrap: pretty;`,
  },
];

/* ------------------------------------------------------------------ *
 * Emission
 * ------------------------------------------------------------------ */

/** One primitive → CSS. Knobs are emitted as custom properties on the class so
 *  they are overridable per instance with a style attribute or a utility. */
function renderLayout(l) {
  const knobs = Object.entries(l.knobs ?? {})
    .map(([k, v]) => `  ${k}: ${v};`)
    .join('\n');

  const parts = [
    `/* ${l.name} — ${l.intent}`,
    ...(l.notes ? [` *`, ` * ${wrap(l.notes, 74, ' * ')}`] : []),
    ` */`,
    `.${P}-${l.name} {`,
    ...(knobs ? [knobs] : []),
    l.css.replace(/^\n/, ''),
    `}`,
  ];

  if (l.childCss) {
    parts.push(`.${P}-${l.name} > * {`, l.childCss.replace(/^\n/, ''), `}`);
  }
  if (l.extra) parts.push(l.extra.replace(/^\n/, ''));

  return parts.join('\n');
}

function renderGuard(g) {
  return [
    `/* ${g.name} — ${g.intent}`,
    ...(g.notes ? [` *`, ` * ${wrap(g.notes, 74, ' * ')}`] : []),
    ` */`,
    `.${P}-${g.name} {`,
    g.css.replace(/^\n/, ''),
    `}`,
  ].join('\n');
}

/** Soft-wrap a comment body so the emitted file reads like the hand-written ones. */
function wrap(text, width, prefix) {
  const words = text.split(/\s+/);
  const lines = [];
  let line = '';
  for (const w of words) {
    if (line && line.length + 1 + w.length > width) {
      lines.push(line);
      line = w;
    } else {
      line = line ? `${line} ${w}` : w;
    }
  }
  if (line) lines.push(line);
  return lines.join(`\n${prefix}`);
}

/**
 * Spacing-step modifiers for the primitives whose knob is almost always a step from
 * the scale rather than an arbitrary value.
 *
 * These exist because the primitives were built, gated, and then hardly used, and
 * the reason turned out to be ergonomics rather than doubt. Setting the knob means
 * an inline custom property:
 *
 *     <div className="oz-stack" style={{ '--stack-space': 'var(--oz-space-4)' }}>
 *
 * against the Tailwind it replaces:
 *
 *     <div className="flex flex-col gap-space-4">
 *
 * The second is plainly better to write, so people wrote it — and lost `min-width: 0`
 * on the children every time, which is the single most common overflow in CSS and
 * exactly what the primitive was for. A safety feature that costs more to type than
 * the unsafe version is a safety feature nobody uses.
 *
 *     <div className="oz-stack-4">
 *
 * is as short as the Tailwind and keeps the guard. The variable knob stays for the
 * cases the scale does not cover.
 */
function renderSteps() {
  const STEPPED = ['stack', 'cluster', 'grid', 'reel'];
  const KNOB = { stack: 'stack-space', cluster: 'cluster-space', grid: 'grid-space', reel: 'reel-space' };
  /* The full spacing scale. Emitting all of it costs about 1.5kB and means a step is
   * never the reason someone reaches for raw flex. */
  const STEPS = Array.from({ length: 18 }, (_, i) => i + 1);

  const rules = STEPPED.flatMap((name) =>
    STEPS.map((n) => `.${P}-${name}-${n} { --${KNOB[name]}: var(--oz-space-${n}); }`),
  );

  return `/* Spacing-step modifiers. \`.oz-stack-4\` is \`.oz-stack\` with its gap set to
   \`--oz-space-4\`, and is why the primitives are usable at a call site — see
   renderSteps() in build/layout.mjs. Compose: class="oz-stack oz-stack-4". */
${rules.join('\n')}`;
}

/** The whole stylesheet. */
export function renderLayoutCss() {
  return [
    LAYOUTS.map(renderLayout).join('\n\n'),
    '',
    '/* ---- spacing steps ---- */',
    '',
    renderSteps(),
    '',
    '/* ---- overflow guards ---- */',
    '',
    GUARDS.map(renderGuard).join('\n\n'),
  ].join('\n');
}

/* ------------------------------------------------------------------ *
 * Self-inspection, for the gates
 * ------------------------------------------------------------------ */

/**
 * Everything build.mjs asserts about this file, computed here so the checks live
 * next to what they describe.
 *
 * These are static properties of the emitted CSS rather than rendered behaviour —
 * no browser is involved. That bounds what they can prove, and they are still worth
 * having: each one corresponds to a specific bug that has a specific textual
 * signature, and a regex over the output catches all of them cheaply. A grid whose
 * minmax has lost its min() wrapper is not a subtle rendering difference to be
 * judged by eye, it is a missing five characters.
 */
export function inspectLayouts() {
  const css = renderLayoutCss();
  const findings = [];

  /* 1. Every minmax() must clamp its minimum against the container. */
  for (const m of css.matchAll(/minmax\(([^;]*?),/g)) {
    const min = m[1];
    findings.push({
      check: 'minmax-clamped',
      subject: `minmax(${min.trim()}, …)`,
      pass: /min\(/.test(min),
      why: 'a bare minimum wider than the container overflows it',
    });
  }

  /* 2. Every layout that lays children out along an axis must be un-overflowable
   *    by them. Written as a sweep rather than a list of names, so a primitive
   *    added later is covered by existing.
   *
   *    There are two legitimate mechanisms and the check accepts either, because
   *    the invariant is "a child cannot overflow this" and min-width: 0 is only one
   *    way to get there. Frame reaches it by cropping — overflow: hidden plus an
   *    explicitly sized child — and an earlier version of this check failed Frame
   *    for it. That was the check being wrong, not Frame: asserting the proxy
   *    instead of the property is how a gate starts producing work rather than
   *    catching bugs. */
  for (const l of LAYOUTS) {
    const isAxis = /display:\s*(flex|grid)/.test(l.css);
    if (!isAxis) continue;
    const all = `${l.css}${l.childCss ?? ''}${l.extra ?? ''}`;
    const shrinkable = /min-width:\s*0/.test(all);
    const clipped = /overflow:\s*hidden/.test(l.css);
    findings.push({
      check: 'children-contained',
      subject: `${P}-${l.name}`,
      pass: shrinkable || clipped,
      why: 'flex and grid children default to min-width:auto and will not shrink below their content — zero it, or clip with overflow:hidden',
    });
  }

  /* 3. No fixed inline size anywhere. A primitive that hardcodes a width is not a
   *    primitive, it is a component with an opinion, and it is the thing that
   *    breaks in a container nobody anticipated.
   *
   *    Parsed rather than pattern-matched. The first version of this was
   *
   *        /(?:width|inline-size):\s*(?!100%|auto|var\()/
   *
   *    which is unsound and reported every primitive as failing: `\s*` backtracks
   *    to zero width, so the negative lookahead ends up testing the space after the
   *    colon rather than the value, and a negative lookahead against the wrong
   *    position always succeeds. Extract the value, then test the value. */
  const SAFE_WIDTH = /^(?:100%|auto|inherit|0|var\(|min\(|max\(|clamp\()/;
  for (const l of LAYOUTS) {
    const all = `${l.css}${l.childCss ?? ''}${l.extra ?? ''}`;
    const offenders = [];
    for (const m of all.matchAll(/(?:^|[\s;{])(width|inline-size)\s*:\s*([^;}]+)/g)) {
      const value = m[2].trim();
      if (!SAFE_WIDTH.test(value)) offenders.push(`${m[1]}: ${value}`);
    }
    findings.push({
      check: 'no-fixed-width',
      subject: offenders.length ? `${P}-${l.name} (${offenders.join(', ')})` : `${P}-${l.name}`,
      pass: offenders.length === 0,
      why: 'a hardcoded width cannot adapt to a container it did not expect',
    });
  }

  /* 4. No var() inside a selector. Custom properties are values, not syntax: they
   *    cannot appear in :nth-child()'s An+B microsyntax, in a media query feature
   *    test, or anywhere else the parser needs a literal. And the failure is silent
   *    in the worst way — an invalid selector makes the browser discard that rule
   *    and keep going, so the stylesheet still loads, the class still exists, and
   *    the behaviour is simply absent. This exact mistake shipped in the switcher's
   *    quantity query and nothing else in the build noticed. */
  for (const m of css.matchAll(/^[^@{}\n]*:nth-[a-z-]+\([^)]*\)/gm)) {
    const sel = m[0].trim();
    findings.push({
      check: 'selector-has-no-var',
      subject: sel.length > 60 ? `${sel.slice(0, 57)}…` : sel,
      pass: !/var\(/.test(sel),
      why: 'var() is not valid in :nth-* An+B syntax — the browser drops the whole rule silently',
    });
  }

  /* 5. Sidebar's content minimum has to exceed half the container or the two
   *    children will never wrap — they will just both get narrower forever. This
   *    is a real trap: the layout looks correct until the container is 300px and
   *    then it is two 150px columns instead of a stack. */
  const sidebar = LAYOUTS.find((l) => l.name === 'sidebar');
  const pct = Number(String(sidebar?.knobs?.['--sidebar-content-min'] ?? '').replace('%', ''));
  findings.push({
    check: 'sidebar-wraps',
    subject: '--sidebar-content-min',
    pass: pct > 50,
    why: `must exceed 50% to ever wrap, got ${pct}%`,
  });

  return findings;
}
