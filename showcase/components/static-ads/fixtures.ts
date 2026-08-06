/* ---------------------------------------------------------------------------
 * Every list on /static-ads, in one file.
 *
 * WHY THIS FILE EXISTS AT ALL. The component sheet specifies option lists that were
 * guesses a commit ago — the models, the eleven aspect ratios, the three resolutions. Those
 * guesses lived inline in the composer, which was fine while they were guesses and is wrong
 * now that they are data somebody else owns. When the real endpoints land, this is the file
 * that gets deleted; nothing else should have to change.
 *
 * WHAT IS SPECIFIED AND WHAT IS STILL INVENTED, kept honest because the last version of
 * this note is what let the wrong option lists ship:
 *
 *   specified by the sheet     MODELS (names, descriptions, credit costs), ASPECT_PRIMARY,
 *                             ASPECT_MORE, QUALITIES, the picker tabs and filter pills,
 *                             the CTA placeholder, the result-card metadata chips
 *   invented here             PRODUCTS and AVATARS entries, RECENTS headlines, TEMPLATES
 *                             names. The sheet shows real photographs of garments and
 *                             people; there is no image in this repo and no endpoint to
 *                             fetch one, so these are labels attached to drawn stand-ins.
 *                             See PlaceholderArt.tsx for why they are drawn.
 * ------------------------------------------------------------------------- */

/* -- the control row's pickers --------------------------------------------- */

export type Model = {
  id: string;
  name: string;
  /** The engine and what it is for, verbatim from the sheet. */
  description: string;
  /** Credit cost. Rendered as a badge with a diamond prefix. */
  credits: number;
  /** Which accent the row's spark takes. The sheet paints all three differently, and the
   *  difference is the tier — so it is data, not decoration. */
  tone: 'neutral' | 'brand' | 'spectrum';
};

export const MODELS: Model[] = [
  {
    id: 'standard',
    name: 'Standard',
    description: 'Nano Banana 2 · Fast, everyday generation',
    credits: 1,
    tone: 'neutral',
  },
  {
    id: 'pro',
    name: 'Pro',
    description: 'Nano Banana Pro · High detail & sharp precision',
    credits: 2,
    tone: 'brand',
  },
  {
    id: 'ultra',
    name: 'Ultra',
    description: 'ChatGPT Image 2.0 · Photorealistic studio quality',
    credits: 2,
    tone: 'spectrum',
  },
];

export type Ratio = {
  id: string;
  /** What the row reads. Absent on the secondary list, whose rows are the ratio alone. */
  name?: string;
  ratio: string;
  /** The platforms it is for. Primary list only. */
  hint?: string;
  /** Drives RatioIcon's computed frame. */
  w: number;
  h: number;
};

/** The four named crops, shown first. */
export const ASPECT_PRIMARY: Ratio[] = [
  { id: '9:16', name: 'Story / Reel', ratio: '9:16', hint: 'Instagram, TikTok, Snapchat', w: 9, h: 16 },
  { id: '4:5', name: 'Feed Post', ratio: '4:5', hint: 'Instagram, Facebook feeds', w: 4, h: 5 },
  { id: '1:1', name: 'Square', ratio: '1:1', hint: 'Works in any feed', w: 1, h: 1 },
  { id: '16:9', name: 'Landscape / YouTube', ratio: '16:9', hint: 'YouTube, websites', w: 16, h: 9 },
];

/** Behind `More`. Ratios without a platform story — the row is the number. */
export const ASPECT_MORE: Ratio[] = [
  { id: '9:21', ratio: '9:21', w: 9, h: 21 },
  { id: '2:3', ratio: '2:3', w: 2, h: 3 },
  { id: '3:4', ratio: '3:4', w: 3, h: 4 },
  { id: '5:4', ratio: '5:4', w: 5, h: 4 },
  { id: '4:3', ratio: '4:3', w: 4, h: 3 },
  { id: '3:2', ratio: '3:2', w: 3, h: 2 },
  { id: '21:9', ratio: '21:9', w: 21, h: 9 },
];

export type Quality = { id: string; label: string };

export const QUALITIES: Quality[] = [
  { id: '1k', label: '1K' },
  { id: '2k', label: '2K' },
  { id: '4k', label: '4K' },
];

/** The variation stepper's ceiling. Named because it appears in the readout, the disabled
 *  test and the aria-valuemax, and three copies of a 4 is how they drift apart. */
export const MAX_VARIATIONS = 4;

/* -- the asset picker ------------------------------------------------------- */

export type PickerTab = 'uploads' | 'generations' | 'avatars' | 'products';

export const PICKER_TABS: { value: PickerTab; label: string }[] = [
  { value: 'uploads', label: 'Uploads' },
  { value: 'generations', label: 'Generations' },
  { value: 'avatars', label: 'Avatars' },
  { value: 'products', label: 'Products' },
];

export type Asset = {
  id: string;
  name: string;
  /** Seeds PlaceholderArt so a given asset draws the same stand-in every render. Once real
   *  images land this becomes a URL and the seed goes away. */
  seed: number;
};

export const PRODUCTS: Asset[] = [
  { id: 'p1', name: 'Knitted Polo Shirt', seed: 3 },
  { id: 'p2', name: 'Quarter Zip-Up Polo Shirt', seed: 2 },
  { id: 'p3', name: 'Stone Pointelle Flat Knit', seed: 5 },
  { id: 'p4', name: 'Cedric Buttons Up Shirt', seed: 4 },
  { id: 'p5', name: 'Maroon Drop Needle Tee', seed: 1 },
  { id: 'p6', name: 'Graphic T-Shirt', seed: 2 },
  { id: 'p7', name: 'Blue T-Shirt', seed: 2 },
  { id: 'p8', name: 'Pleated Trouser', seed: 5 },
  { id: 'p9', name: 'Ecru Short Sleeve Polo', seed: 5 },
  { id: 'p10', name: 'Oxford Button Down', seed: 2 },
  { id: 'p11', name: 'Leather Bomber', seed: 4 },
  { id: 'p12', name: 'Cropped Overshirt', seed: 3 },
];

export const AVATARS: Asset[] = [
  { id: 'a1', name: 'Stefan', seed: 2 },
  { id: 'a2', name: 'Hana', seed: 1 },
  { id: 'a3', name: 'Jeyden', seed: 3 },
  { id: 'a4', name: 'Adriana', seed: 4 },
  { id: 'a5', name: 'valentina', seed: 5 },
  { id: 'a6', name: 'Clara', seed: 1 },
  { id: 'a7', name: 'felix', seed: 5 },
  { id: 'a8', name: 'Marcus', seed: 3 },
  { id: 'a9', name: 'Priya', seed: 4 },
  { id: 'a10', name: 'Noor', seed: 2 },
  { id: 'a11', name: 'Tomas', seed: 5 },
];

/** The avatar sidebar's two filter groups, verbatim from the sheet. Not wired to anything
 *  that filters — there is no attribute on an Asset to filter by, and inventing an ethnicity
 *  field on placeholder people is a thing not to do. The pills are live and hold state so
 *  the interaction can be reviewed; AvatarFilters says so at the call site. */
export const AVATAR_TYPES = ['Male', 'Female'];
export const AVATAR_ETHNICITIES = ['European', 'Hispanic', 'Indians', 'Middle Eastern', 'African'];

/* -- the page's two card rows ---------------------------------------------- */

export type Recent = {
  id: string;
  headline: [string, string];
  ground: 'brand' | 'brand-hover' | 'brand-active';
  /** The metadata chips along the top edge of the hover overlay. */
  meta: { ar: string; version: string; style: string; stylize: string };
};

const META = { ar: 'ar 2:3', version: 'v 7', style: 'style standard', stylize: 'stylize 2' };

export const RECENTS: Recent[] = [
  { id: 'r1', headline: ['Hold your', 'ground'], ground: 'brand', meta: META },
  { id: 'r2', headline: ['Glow all', 'day'], ground: 'brand-hover', meta: META },
  { id: 'r3', headline: ['Bare', 'minimum'], ground: 'brand', meta: META },
  { id: 'r4', headline: ['Clean', 'slate'], ground: 'brand-active', meta: META },
  { id: 'r5', headline: ['Skin', 'deep'], ground: 'brand', meta: META },
  { id: 'r6', headline: ['Hold your', 'ground'], ground: 'brand-hover', meta: META },
  { id: 'r7', headline: ['Glow all', 'day'], ground: 'brand', meta: META },
  { id: 'r8', headline: ['Bare', 'minimum'], ground: 'brand-active', meta: META },
  { id: 'r9', headline: ['Clean', 'slate'], ground: 'brand', meta: META },
];

export type Template = { id: string; name: string; seed: 1 | 2 | 3 | 4 | 5 };

export const TEMPLATES: Template[] = [
  { id: 't1', name: 'Studio product', seed: 1 },
  { id: 't2', name: 'Editorial portrait', seed: 4 },
  { id: 't3', name: 'Flat lay', seed: 5 },
  { id: 't4', name: 'Bold statement', seed: 2 },
  { id: 't5', name: 'Soft focus', seed: 3 },
  { id: 't6', name: 'Split frame', seed: 4 },
  { id: 't7', name: 'Close crop', seed: 1 },
];

/** The prompt the sheet types into every populated state, verbatim. */
export const SAMPLE_PROMPT =
  "Studio product photograph of a classic Nike Air Force 1 '07 sneaker. The shoe is placed on a " +
  'modern, textured concrete platform with soft geometric shadows. Minimalist and sleek urban ' +
  'background with neutral, cool-toned ambient lighting. Dynamic 45-degree angle, shallow depth ' +
  'of field, crisp product focus.';
