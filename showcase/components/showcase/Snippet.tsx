'use client';

import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui';
import { ScrollRegion } from './ScrollRegion';

/* The primary action on this whole page is "copy the correct thing to type", so it
 * gets a real button rather than a hover-revealed icon — hover is not an
 * affordance on a touch screen and is not reachable from a keyboard.
 *
 * That argument was made here and then abandoned in three places, and all three are
 * fixed below. The block itself was a pointer-only scroller, so the one thing on the
 * page a reader is meant to type from could not be read past its right edge without a
 * mouse. The button reported its outcome by renaming itself, which is not an
 * announcement — changing the accessible name of the control you just activated tells
 * a screen reader nothing happened. And a refused clipboard reported nothing at all:
 * the catch block was empty, with a comment noting that the code is selectable. That
 * was true, it was never said out loud, and it left the observable behaviour of a
 * denied clipboard as "the button does nothing". */

/** How long `Copied` stands before the label goes back to being a verb. */
const RECEIPT_MS = 1600;

/** The three outcomes, named. This used to be one boolean, so `!copied` meant both
 *  "nothing has happened yet" and "the clipboard refused" — one state for two
 *  situations that need opposite copy, which is exactly how the refusal stayed
 *  invisible for as long as it did. */
type Outcome = 'idle' | 'copied' | 'denied';

/** Which modifier to name in the fallback instruction.
 *
 *  Read from `navigator` inside the click handler and then stored, never read while
 *  rendering. The denied state is only reachable after a gesture, so the server render
 *  and the first client render both see `idle` and there is nothing for hydration to
 *  disagree about — the same discipline ThemeProvider applies to `matchMedia`.
 *
 *  `navigator.platform` is deprecated and is still the only synchronous answer every
 *  browser gives; `userAgentData` is Chromium-only. The cost of it guessing wrong is
 *  one wrong glyph inside a sentence that also says the block is already selected. */
function copyCombo() {
  return /mac|iphone|ipad|ipod/i.test(navigator.platform) ? '⌘C' : 'Ctrl-C';
}

export function Snippet({ code, label }: { code: string; label?: string }) {
  const name = label ?? 'usage';
  const preRef = useRef<HTMLPreElement>(null);
  const receipt = useRef<ReturnType<typeof setTimeout> | null>(null);

  /* `seq` counts attempts and does nothing but key the live region's child — see the
   * region at the bottom for why that key is load-bearing. */
  const [result, setResult] = useState<{ outcome: Outcome; combo: string; seq: number }>({
    outcome: 'idle',
    combo: '',
    seq: 0,
  });

  /** Select the block, so the fallback is one keystroke away rather than a suggestion.
   *
   *  The keystroke works because focus is on a button: a button owns no selection of
   *  its own, so the platform copy command falls through to the document selection.
   *  The range is taken over the rendered pre rather than over the `code` string, so
   *  what lands on the clipboard is what the reader can see is selected. */
  function selectCode() {
    const el = preRef.current;
    const selection = window.getSelection();
    if (!el || !selection) return;
    const range = document.createRange();
    range.selectNodeContents(el);
    selection.removeAllRanges();
    selection.addRange(range);
  }

  async function copy() {
    /* Cleared before every attempt. The old timer was never cleared at all, so two
     * copies inside RECEIPT_MS left the first one running to revert the label out from
     * under the second — and see the effect below for the unmount half of it. */
    if (receipt.current) clearTimeout(receipt.current);
    try {
      await navigator.clipboard.writeText(code);
      setResult((r) => ({ outcome: 'copied', combo: '', seq: r.seq + 1 }));
      receipt.current = setTimeout(() => setResult((r) => ({ ...r, outcome: 'idle' })), RECEIPT_MS);
    } catch {
      /* Both failures land here and both look identical from the outside: a denied
       * permission, and an origin where `navigator.clipboard` does not exist at all so
       * the property access is what throws.
       *
       * The denial gets no timer, deliberately. `Copied` is a receipt for something
       * that already happened and can expire; `Press ⌘C` is an instruction about a
       * selection that is still sitting on screen, and expiring it would take the
       * instruction away while the thing it describes is still true. It clears on the
       * next attempt instead — and the button still retries, because a permission the
       * reader has just granted in the address bar should not need a reload. */
      selectCode();
      setResult((r) => ({ outcome: 'denied', combo: copyCombo(), seq: r.seq + 1 }));
    }
  }

  useEffect(
    () => () => {
      if (receipt.current) clearTimeout(receipt.current);
    },
    [],
  );

  const buttonLabel =
    result.outcome === 'copied'
      ? 'Copied'
      : result.outcome === 'denied'
        ? `Press ${result.combo}`
        : 'Copy';

  const announcement =
    result.outcome === 'copied'
      ? 'Copied to the clipboard.'
      : result.outcome === 'denied'
        ? `Copying was blocked. The snippet is selected — press ${result.combo} to copy it.`
        : '';

  /* No `overflow-hidden` on the panel any more, and that is not tidying.
   * `overflow: hidden` on an ancestor clips a descendant's outline, and the scroller
   * inside carries the focus ring that item 18's tab stop exists for. The ring is
   * drawn 2px outside a box that already sits flush against the panel's padding edge,
   * so left, right and bottom vanished entirely and a keyboard user got a 2px line
   * under the header and no other indication of where they were. Nothing needs the
   * clip now that the pre is no longer the scrolling box: the header's rule and the
   * code both start well inside the 8px inner radius, and the scroller clips its own
   * overflow. The one cost is that ScrollRegion's edge fade paints its square corner
   * over the bottom radius while the block is scrolled — a 2px notch in a state you
   * reach by dragging, against a focus ring that otherwise does not exist. */
  return (
    <div className="rounded-5 border-2 border-border-secondary bg-surface-secondary">
      <div className="flex items-center gap-space-4 border-b-2 border-border-tertiary px-space-4 py-space-2">
        <span className="font-mono text-label-sm text-content-tertiary">{name}</span>
        <div className="ml-auto">
          <Button variant="ghost" size="sm" onClick={copy}>
            {buttonLabel}
          </Button>
        </div>
      </div>

      {/* body-sm, not body-xs. This is the block a reader is meant to type from, and it
          was the smallest text in the section that exists to be read most closely.

          It is also the block that overflows — an import line plus one usage line per
          variant — and it was `overflow-x-auto` on the pre, which no keyboard can
          scroll and which announced nothing about being scrollable at all (WCAG 2.1.1,
          on the single most consequential piece of text on the page). ScrollRegion
          brings the tab stop, the name and the edge fades with it.

          The padding moves onto the region because the region is now the box that
          clips. Left on the pre, the left inset would scroll away with the first line
          and the code would sit against the frame. `fade="surface-secondary"` names the
          colour actually underneath it — the default fades to the page colour, which
          against this panel is a grey smear rather than an edge. */}
      <ScrollRegion
        label={`${name} snippet`}
        className="px-space-5 py-space-5"
        fade="surface-secondary"
      >
        <pre ref={preRef}>
          <code className="font-mono text-body-sm text-content-secondary">{code}</code>
        </pre>
      </ScrollRegion>

      {/* The outcome, out loud. Mounted unconditionally and empty when there is nothing
          to say, because a live region has to exist in the DOM before its message
          arrives — a region that appears already populated is routinely not announced,
          the assistive tech having had nothing to diff it against. `role="status"` plus
          an explicit `aria-live` is the pair Skeleton.tsx uses for the same reason.

          The child is keyed by attempt, and that key is the whole trick. Copy twice
          inside RECEIPT_MS and the string is identical, and identical text is not a
          change — a screen reader has no reason to read it out again, so the second
          copy would be as silent as the old label swap. Keying by `seq` makes React
          drop the element and insert a new one, so every attempt reaches the region as
          an addition. Both messages go through here: the receipt and the denial are the
          same event to whoever is listening, and only one of them was ever reported. */}
      <div role="status" aria-live="polite" className="sr-only">
        {announcement ? <span key={result.seq}>{announcement}</span> : null}
      </div>
    </div>
  );
}

/** The one-line inventory of every token a recipe names. Generated from
 *  `recipe.tokensUsed`, so it is not a claim about the component — it is the
 *  component's contents. If a hex ever appeared in a recipe, this strip is where it
 *  would be conspicuously missing. */
export function TokenStrip({ tokens }: { tokens: string[] }) {
  return (
    <div className="flex flex-wrap items-center gap-x-space-2 gap-y-space-2">
      <span className="mr-space-2 font-mono text-label-sm text-content-tertiary">
        {tokens.length} tokens
      </span>
      {/* No border on the chips. Twenty bordered pills at 1px each read as a mesh
          rather than as twenty names; the surface step alone is enough to say "this is
          a discrete token" when there are this many of them in a row. */}
      {tokens.map((t) => (
        <code
          key={t}
          className="rounded-3 bg-surface-secondary px-space-3 py-space-1 font-mono text-label-sm text-content-secondary"
        >
          {t}
        </code>
      ))}
    </div>
  );
}
