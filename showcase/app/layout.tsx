import type { Metadata } from 'next';

/* globals.css @imports ../../dist/tokens.css first. See the note there and in
 * postcss.config.mjs for why the token layer has to go through postcss-import
 * rather than being imported here as a second stylesheet. */
import './globals.css';

export const metadata: Metadata = {
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
 * raw string because it must run synchronously in <head>, ahead of React. */
const NO_FLASH = `
try {
  var m = localStorage.getItem('oz-theme');
  if (m === 'dark' || (m === null && matchMedia('(prefers-color-scheme: dark)').matches)) {
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
