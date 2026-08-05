import { ComponentRecipe, type RecipeMeta } from '../core/Recipe';
import type { MotionSpec, VariantBinding } from '../core/types';

export type AlertVariant = 'info' | 'success' | 'warning' | 'critical';
export type AlertSize = 'md';

class AlertRecipe extends ComponentRecipe<AlertVariant, AlertSize> {
  readonly meta: RecipeMeta = {
    id: 'alert',
    group: 'feedback',
    title: 'Alert',
    tag: 'Alert',
    blurb: 'Something happened. The copy carries the weight; the colour only sorts it.',
    notes: [
      'Body text is content/primary on every variant, not content/<role>. The tinted surface plus the dot already encode the role, and role-coloured body copy costs contrast for no added meaning — critical text on a critical surface is the worst-reading pair in the system.',
      'The dot is fill/<role>, the one saturated element. It is what survives greyscale and what a colourblind reader is not relying on, because the heading says the same thing in words.',
      'No dismiss affordance in the recipe. Whether an alert can be dismissed depends on whether its information is still true afterwards, which the component cannot know.',
    ],
  };

  readonly variants = ['info', 'success', 'warning', 'critical'] as const;
  readonly sizes = ['md'] as const;

  readonly motion: MotionSpec = {
    transition: 'effects-default',
    properties: 'colors',
    /* Rises in. An alert is nearly always news — it was not there a moment ago — and
     * appearing with no transition at all is the thing users describe as the page
     * "jumping". 6px of travel is enough to say arrived without being a journey. */
    enter: 'rise',
    intent:
      'Enters on the default spatial spring so it reads as arriving rather than blinking into place, and transitions colour on an effects spring. Not `expressive`, deliberately: an alert is often an error, and a bouncy error is a tonal mistake — the motion should be calm precisely when the message is not.',
  };

  /* No border. Four came off, one per status, and they were the same redundancy
   * Badge had: an alert already sits on `surface/<role>`, a tint carrying the whole
   * status signal, and outlining it added a line without adding information.
   *
   * The tint alone is not the only thing separating an alert from the page — it
   * also has a status dot, which is the part that survives greyscale and red-green
   * deficiency, and that is why the tint is allowed to be as quiet as it is. The
   * build gates the dot separation, not the border. */
  protected readonly shape = 'flex items-start gap-space-4 rounded-5';

  protected readonly sizeClasses: Record<AlertSize, string> = {
    md: 'p-space-4',
  };

  protected readonly bindings: Record<AlertVariant, VariantBinding> = {
    info: {
      intent: 'System state the user did not ask about but should know.',
      base: { bg: 'surface-info', fg: 'content-primary' },
      focus: 'none',
    },
    success: {
      intent: 'Confirms the thing they just did actually happened.',
      base: { bg: 'surface-success', fg: 'content-primary' },
      focus: 'none',
    },
    warning: {
      intent: 'A consequence they are heading towards and can still avoid.',
      base: { bg: 'surface-warning', fg: 'content-primary' },
      focus: 'none',
    },
    critical: {
      intent: 'It failed. Say what failed and what to do next.',
      base: { bg: 'surface-critical', fg: 'content-primary' },
      focus: 'none',
    },
  };

  /** Alert copy is part of the design. Each of these says what happened, and where
   *  the user has a decision, what to do — never an apology, never blame. */
  copyFor(variant: AlertVariant): { title: string; body: string } {
    const copy: Record<AlertVariant, { title: string; body: string }> = {
      info: {
        title: 'Three clips are queued',
        body: 'They start as soon as a worker frees up, usually under a minute.',
      },
      success: {
        title: 'Render complete',
        body: 'Four clips are in your library at 1080p.',
      },
      warning: {
        title: '82% of this month’s credits used',
        body: 'About 74 renders left at your current settings. Resets on 1 August.',
      },
      critical: {
        title: 'Model timed out after 90 seconds',
        body: 'Nothing was charged. Shorten the clip to 8 seconds or try Veo 3.',
      },
    };
    return copy[variant];
  }

  protected sampleChildren(variant: AlertVariant): string {
    return this.copyFor(variant).title;
  }
}

export const alertRecipe = new AlertRecipe();
