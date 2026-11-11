import { I18N_MESSAGES } from '../../../i18n/src/i18n.messages';
import { i18nParityProblems } from '../../../testing/schedule-testing';

/** Keys scheduler.md §14 lists, plus `open-day` (Step 0 H8). */
const KEYS = [
  'label',
  'resources',
  'group-count',
  'group-expand',
  'group-collapse',
  'empty',
  'drop-blocked',
  'moved-resource',
  'cursor-time',
  'cursor-day',
  'event-label',
  'event-label-all-day',
  'grid-help',
  'event-help',
  'open-day',
];

describe('sd-scheduler i18n', () => {
  it('[SCH-SC-37] has every core.component.scheduler key in vi, en, ja, ko and zh, not empty, with the same placeholders', () => {
    expect(i18nParityProblems('core.component.scheduler.')).toEqual([]);
    const keys = Object.keys(I18N_MESSAGES.vi)
      .filter(key => key.startsWith('core.component.scheduler.'))
      .map(key => key.slice('core.component.scheduler.'.length));
    expect(keys.sort()).toEqual([...KEYS].sort());
    expect(I18N_MESSAGES.vi['core.component.scheduler.event-label']).toBe('{title}, {resource}, {weekday} {date}, {start} đến {end}');
    expect(I18N_MESSAGES.en['core.component.scheduler.drop-blocked']).toBe("Can't move to {resource}");
  });
});
