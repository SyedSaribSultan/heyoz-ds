'use client';

import { useEffect, useState } from 'react';
import { Dialog, Input } from '@/components/ui';
import {
  ChatGptGlyph,
  FacebookGlyph,
  FriendsGlyph,
  GoogleGlyph,
  InstagramGlyph,
  LinkedInGlyph,
  NewsGlyph,
  OtherGlyph,
  RedditGlyph,
  TikTokGlyph,
  XGlyph,
  YouTubeGlyph,
} from './glyphs';

/* ---------------------------------------------------------------------------
 * "How did you find HeyOz?" — asked once per session.
 *
 * Now checked against the real thing:
 *   heyoz-repo/heyoz/apps/heyoz-nextapp/app/content-studio/components/HeardAboutUsModal.tsx
 *
 * Geometry and behaviour are that file's; every colour, size and space is this
 * system's. Its shadcn utilities map onto the scale almost exactly, which is the
 * strongest evidence for the scale being the right one:
 *
 *   max-w-2xl              672px         !max-w-[672px]   (see the note at the call)
 *   gap-3 (grid)            12px         gap-space-4
 *   py-3 px-4 (tile)     12px/16px       py-space-4 px-space-5
 *   gap-2 (icon→label)       8px         gap-space-3
 *   size-8 / size-5      32px/20px       h-space-9 / h-space-6
 *   text-sm                 14px         text-body-sm
 *   rounded-xl (Card)       12px         rounded-6
 *   1 → 2 → 3 columns                    grid-cols-1 sm:grid-cols-2 md:grid-cols-3
 *
 * The selected state needed no translation at all. The original is `border-primary
 * bg-primary/5` with `text-primary`; this system's border/selected + fill/selected +
 * content/selected trio resolves to brand, brand-at-15% and brand. They were built for
 * exactly this.
 *
 * WHAT WAS WRONG BEFORE READING THE SOURCE, since three of these are visible: the grid
 * was two columns at an 8px gap rather than one-to-three at 12px, the tiles had no icon
 * well (the original seats every mark in a 32px circle, which is most of why the row
 * reads as a card rather than as a checkbox), the label was label-md rather than
 * body-sm, and the panel was the recipe's 460px instead of 672px — narrow enough that
 * three columns of "Research competitors"-length labels would truncate.
 *
 * TWO DELIBERATE DEPARTURES FROM THE ORIGINAL, both about escapability.
 *
 * It hard-blocks: `preventDefault` on `onEscapeKeyDown` and on `onPointerDownOutside`,
 * plus `[&>button]:hidden` to remove the close. This keeps all three routes, because
 * this system's Dialog treats them as non-negotiable — and specifically because the
 * `singleAction` prop's own comment justifies dropping Cancel on the grounds that
 * "dropping Cancel does not make the dialog inescapable". Removing Escape here would
 * retroactively invalidate the reasoning that made that prop safe to add. A required
 * modal is a legitimate thing to build; it is not a thing to build out of a component
 * that documents the opposite.
 *
 * And the title stays at the Dialog's own heading-xs medium rather than the original's
 * `text-xl md:text-2xl font-bold`. Overriding a component's internal type from a call
 * site is the drift this repo exists to prevent — if dialog titles should be 24px bold,
 * that belongs in dialog.recipe.ts, where every dialog gets it. Flagged rather than
 * forced.
 *
 * SESSION, not visit, and the distinction decides the storage. `sessionStorage` is
 * per tab and cleared when the tab closes, which is what "at the start of each
 * session" means; `localStorage` would ask once ever, and no storage at all would ask
 * on every client navigation and every hot reload. It is also written on *dismissal*
 * as well as on submit, so Escape does not mean "ask me again in four seconds".
 *
 * WHY NATIVE RADIOS. The obvious build is twelve buttons with aria-pressed, and it is
 * wrong twice: a set of twelve where exactly one may be chosen is a radio group, and
 * announcing "pressed" for a choice is not the same as announcing "2 of 12 selected".
 * A visually hidden `input[type=radio]` inside its own label gets the roving focus,
 * the arrow-key traversal, the group semantics and the label association from the
 * platform, and none of it has to be maintained. The tile is styled off the input's
 * own `:checked` and `:focus-visible` through Tailwind's has- variants, so the paint
 * and the state cannot disagree. This is better than the original, which maps over
 * clickable `<Card>` divs a keyboard cannot reach at all.
 * ------------------------------------------------------------------------- */

const STORAGE_KEY = 'oz-studio-referral';

/** The original's cap and floor, exactly: 100 characters, and a value is only accepted
 *  from three non-space characters up. */
const OTHER_MAX = 100;
const OTHER_MIN = 3;

/** Order is the reference's: platforms by reach, then the two human answers, then the
 *  escape hatch. `Other` last because a list whose catch-all is in the middle reads as
 *  unfinished. */
const SOURCES: Array<{ id: string; label: string; Glyph: () => React.ReactElement }> = [
  { id: 'instagram', label: 'Instagram', Glyph: InstagramGlyph },
  { id: 'twitter', label: 'Twitter/X', Glyph: XGlyph },
  { id: 'tiktok', label: 'Tik Tok', Glyph: TikTokGlyph },
  { id: 'youtube', label: 'YouTube', Glyph: YouTubeGlyph },
  { id: 'google', label: 'Google', Glyph: GoogleGlyph },
  { id: 'linkedin', label: 'LinkedIn', Glyph: LinkedInGlyph },
  { id: 'chatgpt', label: 'ChatGPT', Glyph: ChatGptGlyph },
  { id: 'reddit', label: 'Reddit', Glyph: RedditGlyph },
  { id: 'facebook', label: 'Facebook', Glyph: FacebookGlyph },
  { id: 'news', label: 'News', Glyph: NewsGlyph },
  { id: 'friends', label: 'Friends', Glyph: FriendsGlyph },
  { id: 'other', label: 'Other', Glyph: OtherGlyph },
];

export function ReferralDialog() {
  /* Closed on the server and on the first client render, opened in an effect. The
   * answer depends on sessionStorage, which does not exist during the server pass, so
   * anything else is a hydration mismatch — the discipline ThemeProvider sets out. */
  const [open, setOpen] = useState(false);
  const [choice, setChoice] = useState<string | null>(null);
  const [otherText, setOtherText] = useState('');

  /* The original models one value: null, an option id, or `other:<text>` once the free
   * text is usable. The bare 'other' is the deliberate in-between that keeps Continue
   * disabled — a reader who picks Other and types nothing has not answered yet. */
  const trimmed = otherText.trim();
  const otherTooShort = trimmed.length > 0 && trimmed.length < OTHER_MIN;
  const answer = choice === 'other' && trimmed.length >= OTHER_MIN ? `other:${trimmed}` : choice;
  const canContinue = Boolean(answer) && answer !== 'other';

  useEffect(() => {
    try {
      if (sessionStorage.getItem(STORAGE_KEY) === null) setOpen(true);
    } catch {
      /* Private browsing, or storage disabled. Asking once per mount is a better
       * failure than a modal that can never be got rid of, so this stays closed. */
    }
  }, []);

  function settle(answer: string) {
    try {
      sessionStorage.setItem(STORAGE_KEY, answer);
    } catch {
      /* Nothing to do — the dialog still closes for this session. */
    }
    setOpen(false);
  }

  return (
    <Dialog
      open={open}
      title="How did you find HeyOz?"
      /* Continue IS gated, which is the original's condition verbatim
       * (`!heardAboutUs || heardAboutUs === 'other'`): a Continue that submits no answer
       * makes the question pointless, and WCAG 1.4.3 exempts disabled controls from
       * contrast so the greyed state costs nothing.
       *
       * This is not the trap the original is, because the three escape routes survive —
       * Escape, the scrim and the close button all still record `dismissed`. So the
       * reader can always leave; they just cannot submit an empty answer. "Declined to
       * say" is still captured, by the route that actually means it. */
      confirmLabel="Continue"
      singleAction
      confirmDisabled={!canContinue}
      onConfirm={() => answer && settle(answer)}
      onClose={() => settle('dismissed')}
      /* The recipe's shape carries max-w-[460px] and the original panel is max-w-2xl —
       * 672px, which `cn()`'s tailwind-merge resolves in favour of the override, and the
       * same width as the hero composer. The `!` is load-bearing: two max-width
       * utilities on one element are resolved by their order in the compiled stylesheet
       * rather than in the attribute, and Stage's `flush` prop exists because that
       * happened to come out right once and is not a thing to leave to chance. 460px is
       * the measure for a one-sentence confirmation; this panel holds twelve options
       * three across. */
      className="!max-w-[672px]"
    >
      <div className="oz-stack oz-stack-6">
        <p className="text-body-sm text-content-secondary">
          Knowing what brought you here helps us reach more marketers like you.
        </p>

        {/* A real fieldset with a real legend. The legend repeats the dialog title and
            is hidden, because the group needs its own accessible name — a screen reader
            reaching the radios from inside the panel does not re-announce the h2. */}
        <fieldset className="min-w-0">
          <legend className="sr-only">How did you find HeyOz?</legend>
          {/* 1 → 2 → 3 columns at a 12px gap, which is the original's
              `grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3`. Two columns at the
              narrowest width truncates "Research competitors"-length labels; one does
              not, which is why the original starts at one. */}
          <div className="grid grid-cols-1 gap-space-4 sm:grid-cols-2 md:grid-cols-3">
            {SOURCES.map(({ id, label, Glyph }) => (
              <label
                key={id}
                className="group flex min-w-0 cursor-pointer items-center gap-space-3 rounded-6 border-2 border-border-secondary bg-fill-secondary px-space-5 py-space-4 transition-colors duration-effects-fast ease-effects-fast hover:border-border-brand has-[:checked]:border-border-selected has-[:checked]:bg-fill-selected has-[:focus-visible]:outline has-[:focus-visible]:outline-ring has-[:focus-visible]:outline-offset-ring has-[:focus-visible]:outline-border-focus"
              >
                <input
                  type="radio"
                  name="referral"
                  value={id}
                  checked={choice === id}
                  onChange={() => setChoice(id)}
                  className="sr-only"
                />
                {/* The 32px well is not decoration — it is most of why the original's row
                    reads as a card rather than as a checkbox, and it was the biggest thing
                    missing before the source was read. fill/tertiary is the quiet neutral
                    that `bg-muted` maps to; brand-at-15% is `bg-primary/10`.

                    currentColor throughout, so the mark follows the content role and the
                    selected state without a single brand hex. Recognisable marks at one
                    weight rather than the twelve companies' own palettes — which is also
                    what the original does, colouring its react-icons
                    `text-muted-foreground` and `text-primary`. */}
                <span className="grid h-space-9 w-space-9 shrink-0 place-items-center rounded-full bg-fill-tertiary text-content-tertiary group-has-[:checked]:bg-fill-brand-secondary group-has-[:checked]:text-content-selected">
                  <Glyph />
                </span>
                <span className="min-w-0 truncate text-body-sm font-medium text-content-primary group-has-[:checked]:text-content-selected">
                  {label}
                </span>
              </label>
            ))}
          </div>
        </fieldset>

        {/* Revealed by Other, exactly as the original does. autoFocus rather than a ref:
            the field mounts as the direct result of the reader's click, which is the one
            case where taking focus is expected rather than rude.

            The counter and the error share Input's `message` slot because that prop is
            what gets wired to aria-describedby and to aria-invalid — an error rendered
            anywhere else is an error a screen reader never hears. The original prints
            both in a row below the field and announces neither. */}
        {choice === 'other' && (
          <Input
            autoFocus
            /* A hidden real <label> rather than aria-label. Same announcement, and it
               keeps click-to-focus, which aria-label throws away. */
            label="Tell us how you found HeyOz"
            labelHidden
            placeholder="Tell us how you found HeyOz..."
            value={otherText}
            /* Over the cap is ignored rather than truncated, matching the original's
               early return: a 300-character paste leaves the field as it was instead of
               silently keeping the first hundred. */
            onChange={(e) => {
              if (e.target.value.length <= OTHER_MAX) setOtherText(e.target.value);
            }}
            /* The counter is a hint and the minimum is an error, and they are now two
               props rather than one string switched by `variant`. The count keeps
               rendering while the error shows — Field stacks the error above the hint
               precisely so the instruction survives the failure. */
            hint={`${otherText.length}/${OTHER_MAX}`}
            error={otherTooShort ? `Minimum ${OTHER_MIN} characters.` : undefined}
          />
        )}
      </div>
    </Dialog>
  );
}
