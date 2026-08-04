import type { Metadata } from 'next';
import { metadataBase } from '@/lib/core/site';

/* globals.css @imports ../../dist/tokens.css first. See the note there and in
 * postcss.config.mjs for why the token layer has to go through postcss-import
 * rather than being imported here as a second stylesheet. */
import './globals.css';

export const metadata: Metadata = {
  /* Without this, every metadata image route emits a RELATIVE og:image and Next
   * resolves it against `http://localhost:3000` — warning at build time and then
   * shipping that origin into production HTML. The three OG cards would be generated,
   * correct, and unfurl as broken images in Slack and Notion, which is the worst shape
   * of bug: it works locally and nowhere else.
   *
   * The origin is derived from the platform, never typed — see lib/core/site.ts. It is
   * inherited by every nested route, so /verify and /c/* need nothing of their own. */
  metadataBase,
  title: 'HeyOz design system',
  description:
    'Living reference for the HeyOz design system. Every specimen is the real component.',
};

/* Webfonts are loaded by <link>, not next/font, on purpose. The token values name
 * the families literally — var(--oz-font-display) is "'Bricolage Grotesque',
 * ui-sans-serif, …" — and next/font self-hosts under a generated family name like
 * __Bricolage_1a2b3c, which those literals would never match. Keeping the <link>
 * means the tokens stay the single source of truth for typography and the fallback
 * stack they already declare does its job when the network is unavailable.
 * ThemeScript below warns when that happens rather than letting a reviewer judge
 * the wrong typeface. */
const FONT_HREF =
  'https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,200..800&family=Geist:wght@100..900&family=Geist+Mono:wght@100..900&display=swap';

/* Applied before first paint so a dark-mode reload does not flash white. Kept as a
 * raw string because it must run synchronously in <head>, ahead of React — which is
 * also why it cannot import the constants ThemeProvider.tsx declares for the same
 * two strings. The pair has to be kept in step by hand; that file's comments point
 * back here for the same reason.
 *
 * Three stored values now, not two. 'oz-theme' used to hold only 'light' or 'dark',
 * and an absent key meant "follow prefers-color-scheme" — so following the OS was a
 * state you could leave and never return to. ThemeProvider now writes 'system'
 * explicitly, and the branch below has to treat it exactly like the absent key.
 *
 * Getting that wrong is not a subtle bug: a reader on a dark-mode OS whose stored
 * preference is 'system' would get no .dark class from this script, paint the page
 * white, and then have React add the class one frame later. That white flash on every
 * reload is the entire reason this script exists, and it is why storing a new value
 * for the preference is a change to two files rather than one.
 *
 * Anything else in the key — an old value, a hand-edited one — falls through to the
 * media query as well, which is the same rule ThemeProvider applies when it reads the
 * key back: only the two explicit modes count as explicit. */
const NO_FLASH = `
try {
  var m = localStorage.getItem('oz-theme');
  if (m === 'dark' || (m !== 'light' && matchMedia('(prefers-color-scheme: dark)').matches)) {
    document.documentElement.classList.add('dark');
  }
} catch (e) {}
`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link rel="stylesheet" href={FONT_HREF} />
        <script dangerouslySetInnerHTML={{ __html: NO_FLASH }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
