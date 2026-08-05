/* Every recipe, re-exported. Import from here rather than from the individual
 * files so that adding a component is one line in one place. */

import { buttonRecipe as button } from './button.recipe';
import { iconButtonRecipe as iconButton } from './iconButton.recipe';
import { buttonLinkRecipe as buttonLink } from './buttonLink.recipe';
import { badgeRecipe as badge } from './badge.recipe';
import { fieldRecipe as field } from './field.recipe';
import { sliderRecipe as slider } from './slider.recipe';
import { dropzoneRecipe as dropzone } from './dropzone.recipe';
import { radioRecipe as radio } from './radio.recipe';
import { inputRecipe as input } from './input.recipe';
import { textareaRecipe as textarea } from './textarea.recipe';
import { listboxRecipe as listbox } from './listbox.recipe';
import { selectRecipe as select } from './select.recipe';
import { cardRecipe as card } from './card.recipe';
import { alertRecipe as alert } from './alert.recipe';
import { dialogRecipe as dialog } from './dialog.recipe';
import { tabsRecipe as tabs } from './tabs.recipe';
import { tableRecipe as table } from './table.recipe';
import { skeletonRecipe as skeleton } from './skeleton.recipe';
import { switchRecipe as toggle } from './switch.recipe';
import { checkboxRecipe as checkbox } from './checkbox.recipe';
import { pricingCardRecipe as pricingCard } from './pricingCard.recipe';
import type { ComponentRecipe } from '../core/Recipe';

/** Every recipe as a plain list, with no React in the import graph.
 *
 *  This is what scripts/verify-contrast.ts iterates. Pointing that check at the
 *  registry instead would drag the JSX demos into a Node script for no reason, and
 *  would only check recipes someone remembered to register — the opposite of what a
 *  sweep is for. */
export const allRecipes: ComponentRecipe<string, string, string>[] = [
  button,
  iconButton,
  buttonLink,
  badge,
  field,
  radio,
  slider,
  dropzone,
  input,
  textarea,
  select,
  listbox,
  card,
  alert,
  dialog,
  tabs,
  table,
  skeleton,
  toggle,
  checkbox,
  pricingCard,
];

export {
  buttonRecipe,
  type ButtonVariant,
  type ButtonSize,
  type ButtonShape,
} from './button.recipe';
export {
  iconButtonRecipe,
  type IconButtonVariant,
  type IconButtonSize,
  type IconButtonShape,
} from './iconButton.recipe';
export {
  buttonLinkRecipe,
  type ButtonLinkVariant,
  type ButtonLinkSize,
} from './buttonLink.recipe';
export { badgeRecipe, type BadgeVariant, type BadgeSize } from './badge.recipe';
export { dialogRecipe, type DialogVariant, type DialogSize } from './dialog.recipe';
export { tabsRecipe, type TabVariant, type TabSize } from './tabs.recipe';
export {
  pricingCardRecipe,
  TIER_PAINT,
  type PricingTier,
  type PricingCardSize,
} from './pricingCard.recipe';
export { fieldRecipe, type FieldTextRole, type FieldSize } from './field.recipe';
export { inputRecipe, InputRecipe, type InputVariant, type InputSize } from './input.recipe';
export {
  textareaRecipe,
  type TextareaVariant,
  type TextareaSize,
} from './textarea.recipe';
export { cardRecipe, type CardVariant, type CardSize } from './card.recipe';
export { alertRecipe, type AlertVariant, type AlertSize } from './alert.recipe';
export { tableRecipe, type TableRowVariant, type TableSize } from './table.recipe';
export { skeletonRecipe, type SkeletonVariant, type SkeletonSize } from './skeleton.recipe';
export { switchRecipe, type SwitchVariant, type SwitchSize } from './switch.recipe';
export { checkboxRecipe, type CheckboxVariant, type CheckboxSize } from './checkbox.recipe';
export { listboxRecipe, type ListboxVariant, type ListboxSize } from './listbox.recipe';
export { selectRecipe, type SelectVariant, type SelectSize } from './select.recipe';
export { radioRecipe, type RadioVariant, type RadioSize } from './radio.recipe';
export { sliderRecipe, type SliderVariant, type SliderSize } from './slider.recipe';
export { dropzoneRecipe, type DropzoneVariant, type DropzoneSize } from './dropzone.recipe';
