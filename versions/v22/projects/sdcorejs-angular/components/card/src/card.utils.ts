import type { SdCardBehavior, SdCardContent } from './card.model';

type SdCardLayout = SdCardContent['layout'];

const ALL_BEHAVIORS: readonly SdCardBehavior[] = ['static', 'link', 'select'];

/** Behaviors each layout accepts (`card.md` §3.1); projected content accepts all three. */
const LAYOUT_BEHAVIORS: Readonly<Record<SdCardLayout, readonly SdCardBehavior[]>> = {
  stat: ALL_BEHAVIORS,
  option: ['select'],
  entity: ALL_BEHAVIORS,
  file: ALL_BEHAVIORS,
  shortcut: ['link'],
};

/** Whether `behavior` is valid for `layout` (`undefined` = projected content). */
export function sdCardBehaviorAllowed(layout: SdCardLayout | undefined, behavior: SdCardBehavior): boolean {
  return layout === undefined || LAYOUT_BEHAVIORS[layout].includes(behavior);
}
