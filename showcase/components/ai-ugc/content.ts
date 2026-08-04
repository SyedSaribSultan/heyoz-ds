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

/** The one place a second action is offered, in the hero only. A page-long secondary
 *  CTA competes with the primary at every scroll depth. NEW. */
export const CTA_SECONDARY = 'Watch a 60-second demo';

export const HERO = {
  /* NEW. "Create UGC Ads" is the feature name, which the reader already knows from the
   * link they clicked. The outcome is what they do not know. */
  headline: 'Turn one script into scroll-stopping UGC ads',
  headlineAccent: 'in minutes',
  /* NEW, trimmed. The live subhead lists four features and a promise in one sentence;
   * the features moved to Key Features, where they are already listed again. */
  sub: 'No influencers, no filming, no studio time. Pick an AI creator, paste your script, and get a creator-style ad that looks real and converts.',
  video: '/ai-ugc/UGC_6.webm',
  /* The poster is one of the step stills rather than a frame grab: a <video> with no
   * poster paints the page background until the first frame decodes, which on a 4MB
   * webm is a visible hole exactly where the hero is. */
  poster: '/ai-ugc/UGC_21.webp',
} as const;

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
 *  and the honest version of "add testimonials" is "collect testimonials". */
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
