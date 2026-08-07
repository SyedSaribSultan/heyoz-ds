import type { Metadata } from 'next';
import { Verification } from '@/components/verify/Verification';
import { staleSources } from '@/lib/core/staleness';

export const metadata: Metadata = {
  title: 'Verification · HeyOz design system',
  description:
    "Every gate the build measures, and every token every recipe resolves to. The system's own output, not a claim about it.",
};

/* The second of the four routes, and the second of the two the header toggle switches
 * between — `/` is the reference and this is the audit. See Chrome.tsx for why /studio
 * and /static-ads are not in that control. See components/verify/Verification.tsx for why the
 * split exists — in short, a reference is scanned and an audit is read, and the
 * page that tried to be both put a forty-row hex table between a button and its
 * usage snippet. */
export default function VerifyPage() {
  return <Verification staleSources={staleSources()} />;
}
