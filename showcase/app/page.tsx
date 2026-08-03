import { Showcase } from '@/components/showcase/Showcase';
import { staleSources } from '@/lib/core/staleness';

/* One client boundary, drawn here. Everything below it is interactive — the mode
 * toggle, the state harness, the live components — so splitting the tree finer would
 * buy nothing and would make the registry's module-level registration run in two
 * places. */
export default function Page() {
  return <Showcase staleSources={staleSources()} />;
}
