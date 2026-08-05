import { ComponentRecipe, type RecipeMeta } from '../core/Recipe';
import type { MotionSpec, VariantBinding } from '../core/types';

export type CheckboxVariant = 'unchecked' | 'checked' | 'indeterminate';
export type CheckboxSize = 'md';

class CheckboxRecipe extends ComponentRecipe<CheckboxVariant, CheckboxSize> {
  readonly meta: RecipeMeta = {
    id: 'checkbox',
    group: 'forms',
    title: 'Checkbox',
    tag: 'Checkbox',
    blurb: 'A choice that is submitted later. Selecting rows, accepting terms, multi-select.',
    notes: [
      'unchecked binds a border and no fill; checked binds a fill and no border. Both bind border-transparent through the shared shape so the box does not change size when it is ticked — a 1px reflow on click is the kind of thing nobody can name but everyone notices.',
      'indeterminate is a real third value, not a styling of checked. It means "some of the things below this are selected" and it is what a select-all header checkbox shows.',
      'The tick is content/on-brand, the same token as a primary button label, because it sits on the same fill. It is drawn as an SVG rather than a font glyph so it survives the webfonts failing to load.',
    ],
  };

  readonly variants = ['unchecked', 'checked', 'indeterminate'] as const;
  readonly sizes = ['md'] as const;

  readonly motion: MotionSpec = {
    transition: 'effects-fast',
    properties: 'colors',
    enter: 'none',
    intent:
      'The box transitions colour on the fast effects spring. The tick inside it is the part that should feel physical and it scales in on spatial-fast — see the tick classes in components/ui/Checkbox.tsx, which is the one place a child element carries its own spring. A tick that fades in reads as uncertain; a tick that pops reads as committed, and commitment is the entire semantic content of a checkbox.',
  };

  protected readonly shape =
    'relative grid h-space-5 w-space-5 shrink-0 place-items-center rounded-2 border-2 ' +
    'disabled:cursor-not-allowed';

  protected readonly sizeClasses: Record<CheckboxSize, string> = { md: '' };

  protected readonly bindings: Record<CheckboxVariant, VariantBinding> = {
    unchecked: {
      borderJob: 'affordance',
      intent: 'Not selected. The default for every row.',
      base: { bg: 'surface-primary-variant', border: 'border-tertiary' },
      hover: { border: 'border-tertiary-hover' },
      disabled: { bg: 'fill-secondary-disabled', border: 'border-primary-disabled' },
      focus: 'outline',
    },
    checked: {
      borderJob: 'affordance',
      intent: 'Selected.',
      base: { bg: 'fill-brand', fg: 'content-on-brand', border: 'border-brand' },
      hover: { bg: 'fill-brand-hover', border: 'border-brand-hover' },
      disabled: {
        bg: 'fill-brand-disabled',
        fg: 'content-on-brand-disabled',
        border: 'border-primary-disabled',
      },
      focus: 'outline',
    },
    indeterminate: {
      borderJob: 'affordance',
      intent: 'Some but not all of the things this controls are selected.',
      base: { bg: 'fill-brand', fg: 'content-on-brand', border: 'border-brand' },
      hover: { bg: 'fill-brand-hover', border: 'border-brand-hover' },
      disabled: {
        bg: 'fill-brand-disabled',
        fg: 'content-on-brand-disabled',
        border: 'border-primary-disabled',
      },
      focus: 'outline',
    },
  };

  labelFor(variant: CheckboxVariant): string {
    const copy: Record<CheckboxVariant, string> = {
      unchecked: 'Keep the source file after export',
      checked: 'Add a watermark',
      indeterminate: 'Select all 12 clips',
    };
    return copy[variant];
  }

  protected sampleChildren(): string {
    return '';
  }
}

export const checkboxRecipe = new CheckboxRecipe();
