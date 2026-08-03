import type { Metadata } from 'next';
import { ComponentPage } from '@/components/showcase/ComponentPage';
import { allRecipes } from '@/lib/recipes';
import { content } from '@/lib/content';
import { staleSources } from '@/lib/core/staleness';

/* One static page per component.
 *
 * The params come from `allRecipes` rather than from the registry, for the reason
 * lib/recipes/index.ts gives: the registry lives in a .tsx file full of JSX demos,
 * and this module runs on the server at build time. The two lists are the same nine
 * — and if they ever were not, the list that should decide which pages exist is the
 * one that cannot be forgotten to be updated. */
export function generateStaticParams() {
  return allRecipes.map((r) => ({ component: r.meta.id }));
}

/** No dynamic segments beyond the nine. A typo in a URL gets a real 404 rather than
 *  a rendered page saying the component does not exist. */
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
