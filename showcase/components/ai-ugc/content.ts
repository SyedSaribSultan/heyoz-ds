/* ---------------------------------------------------------------------------
 * Every string and figure on /ai-ugc, in one file.
 *
 * The components below it render; they do not author. That split is the same one
 * lib/content/ makes for the component pages, and it exists for the same reason: copy
 * that lives inside JSX gets edited by whoever is nearest the JSX, and marketing copy
 * has an owner who is not that person.
 *
 * PROVENANCE. Copy marked `LIVE` is verbatim from heyoz.com/features/ugc. Copy marked
 * `NEW` was written for this page because the improvement brief asked for it — the
 * unified CTA, the outcome-led headline, the trimmed hero subhead, the pricing
 * footnote, the FAQ grouping, the closing incentive. Anything marked `PLACEHOLDER` is a
 * claim about the world that I cannot verify and MUST NOT SHIP as written.
 * ------------------------------------------------------------------------- */

/** One CTA phrase, used everywhere a primary action appears.
 *
 *  The live page has five: "Get Started", "Make AI UGC Ads", "Create UGC Style Ads",
 *  "Get Started with HeyOz", "Get Started for Free". The brief calls that out, and it is
 *  right: five labels for one action cannot be A/B tested against each other because
 *  nobody can say which one a conversion belongs to. NEW. */
export const CTA_PRIMARY = 'Create your first UGC ad free';

/* CTA_SECONDARY IS GONE, and it was 'Watch a 60-second demo'. It existed for the hero
 * only, on the argument that a page-long secondary CTA competes with the primary at every
 * scroll depth but a hero can afford one route for a reader not ready to sign up. The nine
 * Figma frames all draw exactly one button, and against a composition that points at one
 * button a second one is an argument with the design rather than an implementation of it.
 * Deleted rather than left as a dead export: this file is the copy deck, and a string in it
 * that renders nowhere is a trap for whoever edits it next. */

export const HERO = {
  /* NEW. "Create UGC Ads" is the feature name, which the reader already knows from the
   * link they clicked. The outcome is what they do not know.
   *
   * Both lines are verbatim in the Figma hero (node 4442:80522), which is the artifact
   * this hero is built from — the copy written here for the brief and the copy the design
   * was set with turned out to be the same two sentences. */
  headline: 'Turn one script into scroll-stopping UGC ads',
  headlineAccent: 'in minutes',
  /* NEW, trimmed. The live subhead lists four features and a promise in one sentence;
   * the features moved to Key Features, where they are already listed again. */
  sub: 'No influencers, no filming, no studio time. Pick an AI creator, paste your script, and get a creator-style ad that looks real and converts.',
  /* `video` and `poster` were here and are gone with the framed hero video the drawn hero
   * replaces. Neither asset is orphaned — WhyChoose still plays UGC_6.webm and the first
   * how-it-works step still uses UGC_21.webp — so this removes two keys, not two files. */
} as const;

/** The four tilted stills the Figma hero arranges around the headline.
 *
 * GEOMETRY LIVES HERE, not in the component, for the same reason the copy does: it is
 * two arrangements of four cards across three breakpoints, and one array is the only
 * version of that which cannot drift out of step with itself.
 *
 * THE TWO ARRANGEMENTS come from the nine Figma frames, which draw this hero at 375,
 * 430, 768, 1025, 1280, 1440 and 1920:
 *
 *   - `collage`, below `lg`. All four cards sit in a band at the foot of the hero,
 *     bleeding off both edges and clipped by the section's bottom — Figma's 768 frame,
 *     where the cards are drawn at √2 the desktop size precisely because most of each
 *     one is off-screen. The sizes are the same at 375 as at 768, so they are px and not
 *     fluid. `sm:` is where the fourth card arrives: the 375 frame ships three.
 *
 *   - `scattered`, `lg` and up. Two cards above the headline, two flanking the CTA.
 *
 * WHY THE SCATTERED OFFSETS ARE `calc(50% ± Npx)` AND NOT PERCENTAGES. The text column
 * is a fixed width, so the gutter either side of it grows at half the rate the viewport
 * does, while a percentage offset grows at a tenth of it. Percentages taken off the 1920
 * frame therefore walk the two lower cards into the sub-headline as the window narrows —
 * measured, they collide below about 1710px, which is most desktops. Anchoring each card
 * to the centre line instead reproduces the 1920 frame exactly and holds its clearance
 * at every width, and the cards bleed off the edges rather than into the words. The `lg`
 * row is Figma's 1025 frame, which pulls the lower pair down and in; `xl` is the 1920
 * frame. Both were checked against the sub-headline and the CTA at the ends of their
 * ranges.
 *
 * TOPS ARE FIGMA'S MINUS 70, because they are px from the top of the *section* and Figma
 * measures from the top of the *page* — its hero frame contains the 70px nav band, where
 * here the header is a separate element in the flow ahead of the section. Applying the page
 * values directly counted that band twice and put the whole hero one header-height low; the
 * same correction applies to `lg:pt` and to both glow coats in UgcHero.tsx, and all three
 * have to move together or the cards stop lining up with the words.
 *
 * The stills are the Figma assets re-encoded to webp at 2× their drawn box — 5.4MB of
 * PNG became 56KB, which matters on the one image set on this page that cannot be
 * lazy-loaded, because it is the fold. */
export const HERO_CARDS = [
  {
    src: '/ai-ugc/hero-tall-left.webp',
    alt: 'A generated ad: a creator holding a skincare serum up to camera',
    tilt: 'rotate-[-15deg]',
    collage: 'left-[-22.5%] top-[24px] h-[424px] w-[239px]',
    scattered:
      'lg:left-[calc(50%-413px)] lg:top-[610px] lg:h-[300px] lg:w-[169px] xl:left-[calc(50%-664px)] xl:top-[484px]',
  },
  {
    src: '/ai-ugc/hero-wide.webp',
    alt: 'A generated ad: a close crop on a model wearing branded sunglasses',
    tilt: 'rotate-[-5deg]',
    collage: 'left-[37.9%] top-[117px] h-[238px] w-[424px]',
    scattered:
      'lg:left-[calc(50%-419px)] lg:top-[160px] lg:h-[168px] lg:w-[300px] xl:left-[calc(50%-523px)] xl:top-[147px]',
  },
  {
    src: '/ai-ugc/hero-square.webp',
    alt: 'A generated ad: a creator presenting a bottle of perfume',
    tilt: 'rotate-[10deg]',
    collage: 'left-[9.2%] top-[75px] h-[322px] w-[257px]',
    scattered:
      'lg:left-[calc(50%+273px)] lg:top-[104px] lg:h-[228px] lg:w-[182px] xl:left-[calc(50%+366px)] xl:top-[82px]',
  },
  {
    /* The card the 375 frame drops. Hidden below `sm` rather than reordered, so the three
     * that remain keep the positions they were drawn with. */
    src: '/ai-ugc/hero-tall-right.webp',
    alt: 'A generated ad: a creator in profile carrying a leather handbag',
    tilt: 'rotate-[15deg]',
    collage: 'hidden sm:block left-[91.7%] top-[24px] h-[424px] w-[238px]',
    scattered:
      'lg:left-[calc(50%+350px)] lg:top-[575px] lg:h-[300px] lg:w-[168px] xl:left-[calc(50%+505px)] xl:top-[466px]',
  },
] as const;

/** PLACEHOLDER — every figure here is invented and must be replaced or removed.
 *
 *  The brief asks for social proof under the hero CTA, and it is the right ask: there is
 *  no trust signal anywhere on the live page. But a rating, a customer count and a set
 *  of logos are claims about the world, and inventing them is not a design decision — it
 *  is a false statement rendered at 14px. So the slot is built and the values are
 *  deliberately obvious nonsense, `shipReady: false` gates the whole block, and the
 *  component refuses to render it until someone flips that flag with real numbers.
 *
 *  Same reasoning kills the testimonials and customer logos the brief also asks for: a
 *  fabricated quote attributed to a fabricated person is worse than a missing section,
 *  and the honest version of "add testimonials" is "collect testimonials".
 *
 *  KEEPING THIS GATED IS A CONFIRMED DECISION, not an unfinished edit. Deleting the block
 *  and re-adding it later was offered and declined — the layout is the expensive part and
 *  it is already solved, so it waits here. Two things to know if you are the one flipping
 *  it: every value below is false, so `shipReady: true` without replacing all five ships
 *  "0.0/5 from 000 reviews on REPLACE WITH REAL SOURCE" to production; and `reviewSource`
 *  wants the real platform name, because a rating with no attribution is the kind of trust
 *  signal that costs trust. */
export const SOCIAL_PROOF = {
  shipReady: false,
  rating: '0.0',
  ratingOutOf: '5',
  reviewCount: '000',
  reviewSource: 'REPLACE WITH REAL SOURCE',
  brandCount: '0,000',
} as const;

export const WHY = {
  heading: 'Why choose UGC video creator?', // LIVE
  /* LIVE, verbatim. */
  body: "Audiences trust people, not polished brands. Static product shots don't sell stories, but creator-style videos that feel real do. Oz helps you create authentic, high-performing UGC ads at scale, without hiring influencers or filming a thing.",
  bullets: [
    'Choose from real-looking AI creators.',
    'Write your hook & CTA.',
    'Customize your script, visuals, and CTA.',
    'Publish anywhere in one click.',
  ], // LIVE
  video: '/ai-ugc/UGC_6.webm',
  poster: '/ai-ugc/UGC_3.webp',
} as const;

/** LIVE, all five. `flagship` is NEW: the brief notes six equal-weight cards give the
 *  reader no hierarchy, and these two are the ones a competitor cannot trivially match. */
export const FEATURES = [
  {
    title: 'Natural Lip-Sync & Voice',
    body: 'Every line is delivered with perfect timing, tone, and accent. Choose from 30+ AI voices to match your audience.',
    flagship: true,
  },
  {
    title: 'Multi-Language UGC Ads',
    body: 'Create localized content for global audiences with different voices and subtitles.',
    flagship: true,
  },
  {
    title: 'Realistic AI Creators',
    body: 'Choose from a wide range of human-like avatars that look and sound like real UGC creators; no actors or influencers needed.',
    flagship: false,
  },
  {
    title: 'Custom Styling',
    body: 'Adjust expressions, outfits, and backgrounds to create on-brand UGC videos that look organic, not corporate.',
    flagship: false,
  },
  {
    title: 'Instant UGC Creation',
    body: 'Create UGC-style AI ads in minutes; complete with avatar, voice, and background.',
    flagship: false,
  },
] as const;

/** LIVE. The live page ships 35 of these; the first twelve are kept because a carousel
 *  of 35 is a link farm with arrows on it, and "See all 35" is one link. */
export const USE_CASES = [
  { label: 'E-Commerce Store', slug: 'e-commerce-store' },
  { label: 'Footwear', slug: 'footwear' },
  { label: 'Apparels', slug: 'apparels' },
  { label: 'Skin Care Products', slug: 'skin-care-products' },
  { label: 'Vitamin Supplements', slug: 'vitamin-supplement-product-visuals' },
  { label: 'Beverages', slug: 'beverages' },
  { label: 'Pet Food', slug: 'pet-food' },
  { label: 'Mobile App Gaming', slug: 'mobile-app-gaming' },
  { label: 'Fashion Accessories', slug: 'fashion-accessories' },
  { label: 'Home Furnishing', slug: 'home-furnishing' },
  { label: 'Hair Care', slug: 'hair-care' },
  { label: 'Coffee & Tea', slug: 'coffee-tea' },
] as const;

/** LIVE copy, LIVE media. The zig-zag is enforced by index rather than authored per
 *  step — the brief flags the live page's alternation as inconsistent, and a derived
 *  side cannot be inconsistent. */
export const STEPS = [
  {
    title: 'Choose an AI Avatar',
    body: 'Select from a range of realistic AI creators who look and speak like real people. Each avatar comes with lifelike gestures, expressions, and voices. Perfect for creating authentic UGC ads.',
    media: '/ai-ugc/UGC_21.webp',
    /* NEW. The brief asks for callouts on the step stills because two of them do not
     * explain themselves — step 3 especially, which is "a portrait with a progress bar".
     * One short annotation per step, rendered as a caption rather than as arrows drawn
     * on top of an image this repo cannot edit. */
    callout: 'Avatar picker — filter by look, age and voice',
  },
  {
    title: 'Add Your Video Text',
    body: "Start with your message. Type a short hook, testimonial, or call-to-action, and choose where it appears in your video. Oz automatically syncs your text with the avatar's delivery for a natural, creator-style ad.",
    media: '/ai-ugc/UGC_3.webp',
    callout: 'Script panel — text is synced to the avatar automatically',
  },
  {
    title: 'Edit in the video for better output',
    body: 'Transform your videos with expert editing for sharper visuals, smoother storytelling, faster delivery, and stunning results that captivate every viewer instantly worldwide today online effortlessly.',
    media: '/ai-ugc/UGC_4.webp',
    callout: 'Timeline editor — trim, caption and re-cut without leaving the page',
  },
  {
    title: 'Generate Your UGC Ad',
    body: "Hit 'Generate' and watch Oz instantly create a ready-to-share UGC ad. Download or post directly across TikTok, Instagram, and YouTube. No filming, editing, or studio time needed.",
    media: '/ai-ugc/image5.webp',
    callout: 'Finished ad — download or publish straight to TikTok, Instagram and YouTube',
  },
] as const;

export const PRICING = {
  heading: 'Pricing Comparison', // LIVE
  sub: 'The quickest, most cost-effective way to grow your marketing', // LIVE
  intro:
    'Stop wasting time and money on complex marketing stacks. HeyOz streamlines your content creation and distribution, delivering results faster.', // LIVE
  /* NEW. The live column is headed "Traditional Marketing" and states $5,650+/month as
   * fact. The brief flags it as unsourced and the gap as large enough to read as a
   * sales trick — which is the real risk: an unbelievable number invites the reader to
   * disbelieve the believable ones next to it. "Typical" plus a visible footnote costs
   * nothing and is defensible. */
  traditionalLabel: 'Typical in-house stack',
  footnote:
    'Typical mid-market rates, not a quote. Agency and creator retainers vary widely by market and scope; tool prices are list prices at the time of writing.',
  staff: [
    { label: 'Marketing agency retainer', cost: '$3,000+' },
    { label: 'UGC creators', cost: '$2,500+' },
  ], // LIVE
  tools: [
    { label: 'ChatGPT Plus', cost: '$20' },
    { label: 'AI image generator', cost: '$20' },
    { label: 'AI avatar generator', cost: '$90' },
    { label: 'Video editor (e.g. CapCut Pro)', cost: '$10' },
    { label: 'Design tool (e.g. Canva Pro)', cost: '$10' },
  ], // LIVE
  traditionalTotal: '$5,650+',
  ozMonthly: '$44.99',
  /* NEW. The brief asks for a monthly/annual toggle. Two months free is the common
   * shape and is marked as an assumption — if the real annual price differs, this is the
   * one number to change. */
  ozAnnual: '$37.49',
  annualNote: 'billed yearly · assumption, confirm the real annual rate',
  planName: 'HeyOz Starter',
  /* NEW. The brief notes a "Best Value" badge on a single plan reads as a comparison
   * with nothing. Saying it is the entry plan is both true and more useful. */
  planNote: 'The entry plan. Everything below is included at every tier.',
  includes: [
    'Curated viral templates',
    'Powerful built-in editor',
    'Advanced customization',
    'Seamless one-click publishing',
    'All high-performing content formats',
  ], // LIVE
  reassurance: 'Instant access to every tool. Cancel anytime.', // LIVE
} as const;

/** LIVE labels. NEW grouping — the brief asks for these to read as related tools rather
 *  than as a tag cloud, which means each needs an icon key and a one-line purpose. */
export const RELATED_TOOLS = [
  { label: 'AI Actors', slug: 'ai-actors', icon: 'actor', blurb: 'Cast a face for the shot' },
  { label: 'AI Avatars', slug: 'ai-avatars', icon: 'avatar', blurb: 'Build a reusable presenter' },
  { label: 'AI Influencer Generator', slug: 'ai-influencer-generator', icon: 'spark', blurb: 'Invent a creator persona' },
  { label: 'Text To Video AI', slug: 'text-to-video-ai', icon: 'text', blurb: 'Script in, video out' },
  { label: 'AI Presenter', slug: 'ai-presenter', icon: 'present', blurb: 'Explainers to camera' },
  { label: 'AI Talking Head', slug: 'ai-talking-head', icon: 'head', blurb: 'Close-crop delivery' },
  { label: 'Talking Avatar', slug: 'talking-avatar', icon: 'avatar', blurb: 'Animate a still portrait' },
  { label: 'Product Demo Video Maker', slug: 'product-demo-video-maker', icon: 'box', blurb: 'Show the thing working' },
  { label: 'AI Lip Sync Video', slug: 'ai-lip-sync-video', icon: 'wave', blurb: 'Match mouth to any track' },
] as const;

/** LIVE questions and answers, NEW grouping. The brief asks for themes because the flat
 *  list mixes "what is this" with "will TikTok ban me", and a reader who wants the
 *  second should not have to read the first. */
export const FAQ_GROUPS = [
  {
    group: 'Getting started',
    items: [
      {
        q: 'What is AI UGC?',
        a: 'AI UGC refers to UGC style content generated via AI. HeyOz offers top of the line image and video models ensuring that the UGC generated via these models looks and feels the most realistic. This type of content is best used to test hooks and angles on paid campaigns.',
      },
      {
        q: 'How can I create UGC ads without hiring influencers or filming videos?',
        a: 'You can create UGC style ads using an AI video generator where you select a digital avatar, enter your script, and optionally upload your product media. The system then generates a realistic UGC style video without filming or hiring creators.',
      },
      {
        q: 'What are AI generated UGC ads and how do they work?',
        a: 'AI generated UGC ads are short videos that look like real user created content but are made using artificial intelligence. You write the message, choose a realistic avatar, select a voice, and the tool produces a complete video that mimics organic social content.',
      },
      {
        q: 'What is the fastest way to generate UGC ads for ecommerce products?',
        a: 'The fastest method is to use an AI UGC video generator where you upload a product image or clip, add a short selling script, choose an avatar and voice, and generate multiple ad variations within minutes.',
      },
    ],
  },
  {
    group: 'Platform & compliance',
    items: [
      {
        q: 'Are AI UGC ads allowed for paid ads on Instagram, TikTok, and YouTube?',
        a: "Yes, AI generated UGC style ads can be used for paid campaigns on social platforms as long as the content follows each platform's advertising guidelines and disclosure rules.",
      },
    ],
  },
  {
    group: 'Quality & realism',
    items: [
      {
        q: 'How realistic do AI UGC videos look compared to real creators?',
        a: 'Modern AI avatars use advanced lip sync, facial expressions, and natural voices, which makes the videos look very close to real human created content. When combined with real product images or clips, the realism increases further.',
      },
      {
        q: 'Can AI UGC hold or wear my product?',
        a: "Yes, through proprietary workflows which power HeyOz, we enable the AI avatars to hold or wear your product. Just share your product website's URL or the product image and generate images and videos of AI avatars showcasing your product.",
      },
    ],
  },
] as const;

export const FINAL_CTA = {
  heading: 'Ready to make your brand feel human?', // LIVE
  sub: 'Generate scroll-stopping AI UGC ads that connect and convert.', // LIVE
  /* NEW. The brief asks the closing CTA to carry something the hero did not. */
  incentive: 'Start free — no credit card, no watermark on your first export.',
} as const;

/** LIVE, all four columns and the support pair. */
export const FOOTER_COLUMNS = [
  {
    heading: 'Features',
    links: ['All Features', 'AI Actors', 'AI Carousels', 'AI Avatars', 'AI Lip Sync Video', 'Content Scheduler', 'UGC'],
  },
  {
    heading: 'Use Cases',
    links: ['Fashion Photoshoots', 'Video Effects', 'Realistic Actors', 'Realistic Actors Holding', 'Static Ads', 'TikTok Ads', 'AI Ads for Apps', 'Home Furnishing'],
  },
  {
    heading: 'Resources',
    links: ['Documentation', 'Blogs', 'Pricing', 'Careers', 'Affiliate Program', 'Creator Ambassador Program', 'UGC Ambassador Program', 'Sitemaps'],
  },
  {
    heading: 'Company',
    links: ['About Us', 'Contact', 'Terms of Service', 'Privacy Policy'],
  },
] as const;

export const FOOTER_SUPPORT = {
  heading: 'Need help?',
  links: ['Help Center'],
  email: 'support@heyoz.com',
} as const;

/** LIVE. Set as three lines on the live page, and kept that way — it is a wordmark
 *  line, not a paragraph. */
export const FOOTER_TAGLINE = ['Where products', 'become ads', 'people remember'] as const;

export const SOCIALS = ['Twitter', 'LinkedIn', 'Instagram', 'TikTok'] as const;

/** The nav, trimmed. The live header carries seven menus with 70+ links behind them;
 *  this page needs the ones a reader on it would want next. */
export const NAV = [
  { label: 'Features', href: '#features' },
  { label: 'How it works', href: '#how-it-works' },
  { label: 'Use cases', href: '#use-cases' },
  { label: 'Pricing', href: '#pricing' },
  { label: 'FAQ', href: '#faq' },
] as const;
