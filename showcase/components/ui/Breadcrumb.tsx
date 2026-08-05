'use client';

import { breadcrumbRecipe } from '@/lib/recipes';
import { cx } from '@/lib/core/cx';

export type Crumb = {
  label: string;
  /** Omit on the last item. A link to the page you are on does nothing, and a screen-reader
   *  user cannot tell it apart from the ones that do. */
  href?: string;
};

export type BreadcrumbProps = {
  items: Crumb[];
  /** Names the nav landmark. Defaults to "Breadcrumb", which is what screen-reader users
   *  expect to hear — this is one of the few places a conventional word beats a descriptive one. */
  label?: string;
  className?: string;
};

/**
 * Where this page sits in a hierarchy that actually exists.
 *
 * Not a history trail. If the path changes depending on how the user arrived, it is describing
 * their session rather than the product, and the user cannot learn anything from it.
 */
export function Breadcrumb({ items, label = 'Breadcrumb', className }: BreadcrumbProps) {
  return (
    <nav aria-label={label} className={className}>
      {/* An <ol>, so a screen reader can say "item 3 of 4" — which is the entire content of a
          breadcrumb. A row of links in a div carries none of that. */}
      <ol className={breadcrumbRecipe.listClasses()}>
        {items.map((c, i) => {
          const last = i === items.length - 1;
          return (
            <li key={`${c.label}-${i}`} className="flex items-center">
              {i > 0 && (
                /* aria-hidden: "Projects slash Spring campaign" is not how anyone wants a path
                   read. A CSS pseudo-element would be read by some screen readers and not
                   others, which is worse than either choice made on purpose. */
                <span aria-hidden="true" className={breadcrumbRecipe.separatorClasses()}>
                  /
                </span>
              )}

              {last || !c.href ? (
                <span
                  aria-current={last ? 'page' : undefined}
                  className={breadcrumbRecipe.classes({
                    variant: 'current',
                    className: 'font-medium',
                  })}
                >
                  {c.label}
                </span>
              ) : (
                <a href={c.href} className={breadcrumbRecipe.classes({ variant: 'link' })}>
                  {c.label}
                </a>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
