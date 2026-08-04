import type { Metadata } from 'next';
import { ComponentPage } from '@/components/showcase/ComponentPage';
import { allRecipes } from '@/lib/recipes';
import { content } from '@/lib/content';
import { staleSources } from '@/lib/core/staleness';

/* One static page per registered recipe, and nothing in this file decides which those
 * are.
 *
 * The params come from `allRecipes` rather than from the registry, for the reason
 * lib/recipes/index.ts gives: the registry lives in a .tsx file full of JSX demos,
 * and this module runs on the server at build time. The two lists hold the same
 * recipes — and if they ever were not, the list that should decide which pages exist
 * is the one that cannot be forgotten to be updated.
 *
 * Neither sentence names a count, on purpose. Both of them used to say "nine" and
 * both lists had held fourteen for some time; the number is a property of the
 * catalogue and never was this file's to restate. See the note in ComponentPage.tsx. */
export function generateStaticParams() {
  return allRecipes.map((r) => ({ component: r.meta.id }));
}

/** No dynamic segment that `generateStaticParams` did not return. A typo in a URL gets
 *  a real 404 — app/not-found.tsx — rather than a rendered page saying the component
 *  does not exist, which is what ComponentPage used to answer with, at HTTP 200. */
export const dynamicParams = false;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ component: string }>;
}): Promise<Metadata> {
  const { component } = await params;
  const recipe = allRecipes.find((r) => r.meta.id === component);
  if (!recipe) return { title: 'Not found · HeyOz design system' };

  /* The written definition, where there is one — it was authored to survive being
   * read alone, which is exactly what a search result and a link preview are. The
   * recipe blurb is the fallback and was not. */
  const description = content[component]?.definition ?? recipe.meta.blurb;

  return {
    title: `${recipe.meta.title} · HeyOz design system`,
    description,
  };
}

export default async function Page({ params }: { params: Promise<{ component: string }> }) {
  const { component } = await params;
  return <ComponentPage id={component} staleSources={staleSources()} />;
}
