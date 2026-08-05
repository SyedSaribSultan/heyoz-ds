'use client';

import { useId } from 'react';
import { accordionRecipe, type AccordionVariant } from '@/lib/recipes';
import { cx } from '@/lib/core/cx';
import { useControllable } from '@/lib/core/useControllable';
import { Separator } from './Separator';

function ChevronIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export type AccordionSection = {
  /** Stable across renders — it is the open/closed key. An index would reorder with the list. */
  id: string;
  title: string;
  content: React.ReactNode;
  disabled?: boolean;
};

export type AccordionProps = {
  sections: AccordionSection[];
  /** Open section ids. */
  value?: string[];
  defaultValue?: string[];
  onChange?: (open: string[]) => void;
  variant?: AccordionVariant;
  /**
   * Opening one closes the last.
   *
   * Off by default and usually the wrong choice: it makes the reader lose their place to see
   * something else, and the two sections they wanted to compare are the two it will not show
   * together.
   */
  single?: boolean;
  /**
   * The heading level the triggers render at.
   *
   * A prop because only the caller knows what this is nested under, and getting it wrong
   * breaks the document outline a screen-reader user navigates by — an h3 directly inside an
   * h1 section skips a level, which reads as a missing heading.
   */
  headingLevel?: 2 | 3 | 4 | 5 | 6;
  className?: string;
};

/**
 * Sections the reader opens one at a time.
 *
 * Only for content most readers will skip. Anything most of them need is content you have
 * hidden, and a page that hides what it is about is shorter and worse.
 *
 * The structure is `<h3><button aria-expanded></button></h3>`, and both halves matter: the
 * button is what a keyboard can reach, and the heading is what gives a screen reader an
 * outline — without it a twelve-item FAQ is twelve unrelated controls.
 */
export function Accordion({
  sections,
  value,
  defaultValue = [],
  onChange,
  variant = 'row',
  single = false,
  headingLevel = 3,
  className,
}: AccordionProps) {
  const [open, setOpen] = useControllable<string[]>({
    value,
    defaultValue,
    onChange,
  });

  const baseId = useId();
  const Heading = `h${headingLevel}` as 'h2' | 'h3' | 'h4' | 'h5' | 'h6';

  const toggle = (id: string) => {
    const isOpen = open.includes(id);
    if (single) return setOpen(isOpen ? [] : [id]);
    setOpen(isOpen ? open.filter((x) => x !== id) : [...open, id]);
  };

  return (
    <div className={cx(accordionRecipe.containerClasses(variant), className)}>
      {sections.map((s, i) => {
        const isOpen = open.includes(s.id);
        const panelId = `${baseId}-${s.id}-panel`;
        const triggerId = `${baseId}-${s.id}-trigger`;

        return (
          <div key={s.id} className={accordionRecipe.sectionClasses(variant)}>
            {/* The hairline between rows, as a real Separator — a rule between rows is
                `separation`, which rule 1c makes a build error as a border, and Separator is
                the component that already carries that argument. `card` needs none: each
                section is its own surface with its own gap. */}
            {variant === 'row' && i > 0 && <Separator />}

            <Heading>
              <button
                type="button"
                id={triggerId}
                aria-expanded={isOpen}
                /* Only while open. aria-controls pointing at an element that is not in the DOM
                   is a dangling reference, and the panel is unmounted when closed. */
                aria-controls={isOpen ? panelId : undefined}
                disabled={s.disabled}
                onClick={() => toggle(s.id)}
                className={accordionRecipe.classes({
                  variant,
                  className: 'font-medium',
                })}
              >
                <span className="min-w-0 flex-1">{s.title}</span>
                <span className={accordionRecipe.chevronClasses(isOpen)}>
                  <ChevronIcon />
                </span>
              </button>
            </Heading>

            {/* Unmounted when closed, not hidden. `display: none` leaves the content where
                find-in-page can hit it invisibly and where images keep downloading. */}
            {isOpen && (
              <div
                id={panelId}
                role="region"
                aria-labelledby={triggerId}
                className={cx(accordionRecipe.panelClasses(), accordionRecipe.enterClass)}
              >
                {s.content}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
