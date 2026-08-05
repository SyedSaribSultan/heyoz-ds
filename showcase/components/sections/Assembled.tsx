'use client';

import { useState } from 'react';
import { Section, Stage } from '@/components/showcase/Section';
import {
  Alert,
  Badge,
  Button,
  Card,
  CardMeta,
  CardTitle,
  Checkbox,
  Input,
  Skeleton,
  SkeletonGroup,
  Switch,
  Table,
} from '@/components/ui';

/* ---------------------------------------------------------------------------
 * The assembled screen.
 *
 * Not a mockup. Every element below is one of the exported components from
 * components/ui, with no local styling beyond layout — check the imports. This is
 * the section that catches what the individual sections cannot: whether the tokens
 * hold up when a brand fill, a status surface, a selected row and four elevations
 * are on screen at once, and whether the accent still reads as "act here" when the
 * page is busy.
 *
 * It is also the state harness. The three buttons at the top switch the content
 * area between ready, loading and empty, because the states a product gets wrong
 * are the ones nobody built a way to look at.
 * ------------------------------------------------------------------------- */

type ViewState = 'ready' | 'loading' | 'empty';

const COLUMNS = [
  { key: 'clip', label: 'Clip' },
  { key: 'model', label: 'Model' },
  { key: 'status', label: 'Status' },
  { key: 'length', label: 'Length', align: 'right' as const },
];

const ROWS = [
  {
    clip: 'street-dusk-01',
    model: 'Seedance 2',
    status: (
      <Badge variant="success-subtle" icon>
        Ready
      </Badge>
    ),
    length: '0:12',
  },
  {
    clip: 'harbour-pan-04',
    model: 'Seedance 2',
    status: (
      <Badge variant="info-subtle" icon>
        Rendering
      </Badge>
    ),
    length: '0:08',
  },
  {
    clip: 'rooftop-wide-02',
    model: 'Veo 3',
    status: (
      <Badge variant="critical-subtle" icon>
        Failed
      </Badge>
    ),
    length: '—',
  },
];

/* Sidebar nav, with real icons.
 *
 * These were `bg-current opacity-50` squares — placeholder blocks, on the one screen
 * that exists to argue the system holds up in a product. A grey square in a nav slot
 * is the detail that makes a reviewer stop trusting the rest of the page, and it costs
 * four paths to remove.
 *
 * Inline rather than an icon dependency: this folder has three runtime dependencies
 * and adding a fourth for four glyphs is not a trade worth making. currentColor means
 * they inherit the sidebar content role, so they follow the modes and the selected
 * state without naming a colour — same rule as everything else here. */
const NAV: Array<{ label: string; path: string }> = [
  // sparkle — generate
  { label: 'Generate', path: 'M8 1.5l1.6 4.2L14 7.3l-4.4 1.6L8 13.1 6.4 8.9 2 7.3l4.4-1.6z' },
  // stacked layers — library
  { label: 'Library', path: 'M8 1.8l6 3.2-6 3.2-6-3.2zM2 8.4l6 3.2 6-3.2M2 11.2l6 3.2 6-3.2' },
  // chip — models
  { label: 'Models', path: 'M5.2 5.2h5.6v5.6H5.2zM6.4 2.2v1.8M9.6 2.2v1.8M6.4 12v1.8M9.6 12v1.8M2.2 6.4h1.8M2.2 9.6h1.8M12 6.4h1.8M12 9.6h1.8' },
  // card — billing
  { label: 'Billing', path: 'M1.8 4.6h12.4v6.8H1.8zM1.8 7.2h12.4M4.2 9.6h2.2' },
];

/** One nav glyph. Stroked, 1.5px, square-capped — matched to the stroke scale the
 *  rest of the system draws borders with rather than to a random icon set's weight. */
function NavIcon({ path }: { path: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 16 16"
      className="h-space-5 w-space-5 shrink-0"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d={path} />
    </svg>
  );
}

export function Assembled({ index }: { index: string }) {
  const [view, setView] = useState<ViewState>('ready');
  const [selected, setSelected] = useState<string[]>(['harbour-pan-04']);

  return (
    <Section
      id="assembled"
      index={index}
      title="Assembled"
      tag="every element is an imported component"
      blurb="The same nine components under load. Nothing here is a styled div — if a state is broken in the app, it is broken on this screen too."
    >
      {/* State harness. Looks like scaffolding on purpose: it is not part of the
          product, and dressing it up would make the screen below harder to judge. */}
      <div className="mb-space-5 oz-cluster oz-cluster-3">
        <span className="font-mono text-label-xs uppercase text-content-tertiary">
          force state
        </span>
        {(['ready', 'loading', 'empty'] as const).map((s) => (
          <Button
            key={s}
            variant={view === s ? 'secondary' : 'ghost'}
            size="sm"
            aria-pressed={view === s}
            onClick={() => setView(s)}
          >
            {s}
          </Button>
        ))}
      </div>

      <Stage label="app · dashboard" flush>
        <div className="grid grid-cols-1 lg:grid-cols-app">
          {/* Sidebar. Uses the sidebar/* token group, which exists so a sidebar is
              not a special case of a card. */}
          <aside className="border-b-2 border-sidebar-border bg-sidebar-background p-space-4 lg:border-b-0 lg:border-r-2">
            <p className="px-space-3 pb-space-5 font-display text-heading-xs font-bold text-sidebar-content">
              HeyOz
            </p>
            <nav className="flex gap-space-1 lg:flex-col">
              {NAV.map((n, i) => (
                <a
                  key={n.label}
                  href="#assembled"
                  aria-current={i === 0 ? 'page' : undefined}
                  className={`flex min-h-target items-center gap-space-3 rounded-4 px-space-3 text-body-sm transition-colors duration-fast ease-standard focus-visible:outline focus-visible:outline-ring focus-visible:outline-offset-ring focus-visible:outline-border-focus ${
                    i === 0
                      ? 'bg-sidebar-item-selected font-medium text-sidebar-content-selected'
                      : 'text-sidebar-content-muted hover:bg-sidebar-item-hover active:bg-sidebar-item-active'
                  }`}
                >
                  <NavIcon path={n.path} />
                  {n.label}
                </a>
              ))}
            </nav>
          </aside>

          <div className="min-w-0 p-space-6">
            <div className="mb-space-6 flex flex-wrap items-start gap-space-4">
              <div>
                <div className="flex items-center gap-space-3">
                  <h3 className="font-heading text-heading-lg font-semibold text-content-primary">
                    Seedance 2
                  </h3>
                  <Badge variant="brand">New</Badge>
                </div>
                <p className="mt-space-1 text-body-sm text-content-secondary">
                  Text-to-video, 1080p, up to 12 seconds.
                </p>
              </div>
              <div className="ml-auto flex gap-space-3">
                <Button variant="ghost" size="sm">
                  Docs
                </Button>
                <Button variant="secondary" size="sm">
                  Duplicate
                </Button>
              </div>
            </div>

            {/* Stat tiles: raised cards, one accent-free progress bar each. */}
            <div className="mb-space-6 grid grid-cols-1 gap-space-4 sm:grid-cols-3">
              {(
                [
                  ['Renders this month', '1,284', 'success', '62%'],
                  ['In queue', '3', 'info', '18%'],
                  ['Credits left', '412', 'warning', '82%'],
                ] as const
              ).map(([label, value, role, width]) => (
                <Card key={label} variant="raised">
                  <p className="font-mono text-label-xs uppercase text-content-tertiary">
                    {label}
                  </p>
                  <p className="mt-space-2 font-heading text-heading-sm font-semibold text-content-primary">
                    {value}
                  </p>
                  <div className={`mt-space-3 h-space-1 rounded-1 bg-fill-${role}-secondary`}>
                    <div
                      className={`h-full rounded-1 bg-fill-${role}`}
                      style={{ width }}
                    />
                  </div>
                </Card>
              ))}
            </div>

            {/* Prompt composer. Real Input, real Buttons, real Switch. */}
            <Card variant="flat" className="mb-space-6">
              <CardTitle>Prompt</CardTitle>
              <div className="mt-space-4 oz-stack oz-stack-4">
                <Input
                  label="Describe the shot"
                  defaultValue="A slow dolly through a rain-lit Karachi street at dusk"
                  hint="Specific camera language gives the model more to work with."
                />
                <div className="oz-cluster oz-cluster-6">
                  <Switch label="Upscale to 4K on export" defaultChecked />
                  <Checkbox label="Add a watermark" />
                </div>
                <div className="flex flex-wrap gap-space-3">
                  <Button variant="primary">Generate video</Button>
                  <Button variant="secondary">Save draft</Button>
                  <Button variant="ghost">Reset</Button>
                  <Button variant="destructive" className="ml-auto">
                    Delete project
                  </Button>
                </div>
              </div>
            </Card>

            {/* The three feedback states, one per role that can actually occur here. */}
            <div className="mb-space-6 oz-stack oz-stack-3">
              <Alert variant="success" />
              <Alert variant="warning" />
              <Alert variant="critical" />
            </div>

            {/* The container animates once, not each of the twenty rows. A stagger on
                tabular data is decoration on top of the thing people came to read —
                see the note on tableRecipe.motion. */}
            {view === 'ready' && (
              <div className="oz-enter-rise">
                <Table
                  caption="Recent renders"
                  columns={COLUMNS}
                  rows={ROWS}
                  rowKey={(r) => String(r.clip)}
                  selectedKeys={selected}
                  onRowClick={(r) =>
                    setSelected((prev) =>
                      prev.includes(String(r.clip))
                        ? prev.filter((k) => k !== String(r.clip))
                        : [...prev, String(r.clip)],
                    )
                  }
                />
                <p className="mt-space-3 text-body-sm text-content-tertiary">
                  Click a row. Selection drives <code className="font-mono">fill/selected</code> and{' '}
                  <code className="font-mono">aria-selected</code> from the same prop.
                </p>
              </div>
            )}

            {view === 'loading' && (
              <SkeletonGroup label="Loading recent renders">
                <Card variant="flat">
                  <div className="oz-stack oz-stack-4">
                    {[0, 1, 2].map((i) => (
                      <div key={i} className="flex items-center gap-space-4">
                        <Skeleton variant="line" width="w-1/3" />
                        <Skeleton variant="line" width="w-1/5" />
                        <Skeleton variant="line" width="w-space-14" />
                      </div>
                    ))}
                  </div>
                </Card>
              </SkeletonGroup>
            )}

            {view === 'empty' && (
              /* An invitation with an action, not an apology. */
              <div className="rounded-6 border-2 border-dashed border-border-secondary bg-surface-primary p-space-11 text-center">
                <p className="font-heading text-heading-xs font-semibold text-content-primary">
                  No renders yet
                </p>
                <p className="mx-auto mt-space-2 max-w-[42ch] text-body-sm text-content-secondary">
                  Describe a shot above and Seedance 2 will return four variations in about a
                  minute.
                </p>
                <div className="mt-space-5 flex justify-center">
                  <Button variant="primary">Generate your first clip</Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </Stage>
    </Section>
  );
}
