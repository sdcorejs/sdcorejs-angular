import { i18nParityProblems } from '../../../testing/schedule-testing';

/** Title keys whose wording differs per language (§6 of the handoff): any subset of these placeholders. */
const DATE_TITLES = {
  'title-week': ['from', 'to', 'month', 'monthName', 'year'],
  'title-month': ['month', 'monthName', 'year'],
  'title-day': ['weekday', 'day', 'month', 'monthName', 'year'],
} as const;

describe('sd-calendar i18n', () => {
  it('[CAL-SC-37] has every core.component.calendar key in vi, en, ja, ko and zh, not empty, with the same placeholders', () => {
    expect(i18nParityProblems('core.component.calendar.', DATE_TITLES)).toEqual([]);
  });
});
