'use client';

import { useState } from 'react';
import { Button } from '@/components/ui';

/* The primary action on this whole page is "copy the correct thing to type", so it
 * gets a real button rather than a hover-revealed icon — hover is not an
 * affordance on a touch screen and is not reachable from a keyboard. */

export function Snippet({ code, label }: { code: string; label?: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      /* Clipboard denied. The code is selectable, which is the fallback. */
    }
  }

  return (
    <div className="overflow-hidden rounded-5 border-2 border-border-secondary bg-surface-secondary">
      <div className="flex items-center gap-space-4 border-b-2 border-border-tertiary px-space-4 py-space-2">
        <span className="font-mono text-label-sm text-content-tertiary">{label ?? 'usage'}</span>
        <div className="ml-auto">
          <Button variant="ghost" size="sm" onClick={copy}>
            {copied ? 'Copied' : 'Copy'}
          </Button>
        </div>
      </div>
      {/* body-sm, not body-xs. This is the block a reader is meant to type from, and it
          was the smallest text in the section that exists to be read most closely. */}
      <pre className="overflow-x-auto px-space-5 py-space-5">
        <code className="font-mono text-body-sm text-content-secondary">
          {code}
        </code>
      </pre>
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
