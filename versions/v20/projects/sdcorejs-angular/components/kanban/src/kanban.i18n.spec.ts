import { i18nParityProblems } from '../../../testing/schedule-testing';

describe('sd-kanban i18n', () => {
  it('[KAN-SC-37] has every core.component.kanban key in vi, en, ja, ko and zh, not empty, with the same placeholders', () => {
    expect(i18nParityProblems('core.component.kanban.')).toEqual([]);
  });
});
