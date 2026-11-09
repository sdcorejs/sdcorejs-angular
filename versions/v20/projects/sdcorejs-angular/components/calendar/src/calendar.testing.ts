import type { Type } from '@angular/core';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { SD_CORE_CONFIGURATION } from '@sdcorejs/angular/configurations';
import { SdDateTimeService } from '@sdcorejs/angular/services/date-time';
import type { Language } from '@sdcorejs/utils/models';
import { SCHEDULE_TEST_NOW, SCHEDULE_TEST_ZONE, stubNow } from '../../../testing/schedule-testing';
import { SD_CALENDAR_CONFIGURATION, type ISdCalendarConfiguration } from './calendar.configuration';
import type { SdCalendarEvent, SdCalendarOption } from './calendar.model';

// Fixtures of the sd-calendar component specs. Spec-only: nothing in the library imports this file.

export interface CalendarDto {
  readonly room: string;
}

/** The week of 19–25/10/2026 shown by the design file. */
export function weekEvents(): SdCalendarEvent<CalendarDto>[] {
  return [
    { id: 'standup', title: 'Họp giao ban tuần', start: '2026/10/19 09:00:00', end: '2026/10/19 09:30:00', data: { room: 'Sen' } },
    {
      id: 'review',
      title: 'Review ngân sách Q4',
      start: '2026/10/21 14:00:00',
      end: '2026/10/21 15:30:00',
      color: 'warning',
      data: { room: 'Lan' },
    },
    {
      id: 'client',
      title: 'Hẹn khách: Công ty An Phát',
      start: '2026/10/22 09:30:00',
      end: '2026/10/22 10:30:00',
      color: 'success',
      data: { room: 'Cúc' },
    },
    { id: 'one-on-one', title: '1:1 với Minh', start: '2026/10/22 10:00:00', end: '2026/10/22 10:30:00', data: { room: 'Online' } },
    { id: 'leave', title: 'Nghỉ phép · Lan', start: '2026/10/22', end: '2026/10/23', allDay: true, color: 'secondary', data: { room: '' } },
    { id: 'deadline', title: 'Hạn chót báo cáo Q3', start: '2026/10/23', allDay: true, color: 'error', data: { room: '' } },
    {
      id: 'night',
      title: 'Trực đêm',
      start: '2026/10/22 22:00:00',
      end: '2026/10/23 06:00:00',
      color: 'rebeccapurple',
      data: { room: 'Kho' },
    },
    { id: 'old', title: 'Sự kiện tuần trước', start: '2026/10/12 09:00:00', end: '2026/10/12 10:00:00', data: { room: 'Sen' } },
  ];
}

export function clientOption(events: () => readonly SdCalendarEvent<CalendarDto>[] = weekEvents): SdCalendarOption<CalendarDto> {
  return { dataSource: { onLoad: () => events() } };
}

export interface CalendarSetup {
  readonly zone?: string;
  readonly now?: string;
  readonly configuration?: ISdCalendarConfiguration;
  readonly language?: Language;
}

/** Configures TestBed with the zone, a pinned "now" and an optional calendar configuration. */
export function configureCalendar(setup: CalendarSetup = {}): { clock: SdDateTimeService; setNow: (next: string) => void } {
  TestBed.configureTestingModule({
    providers: [
      { provide: SD_CORE_CONFIGURATION, useValue: { timeZone: setup.zone ?? SCHEDULE_TEST_ZONE, language: setup.language ?? 'vi' } },
      ...(setup.configuration ? [{ provide: SD_CALENDAR_CONFIGURATION, useValue: setup.configuration }] : []),
    ],
  });
  const clock = TestBed.inject(SdDateTimeService);
  const setNow = stubNow(clock, setup.now ?? SCHEDULE_TEST_NOW);
  return { clock, setNow };
}

/** Creates `type` with the given inputs set before the first change detection. */
export function createWith<C>(type: Type<C>, inputs: Record<string, unknown>): ComponentFixture<C> {
  const fixture = TestBed.createComponent(type);
  for (const [name, value] of Object.entries(inputs)) fixture.componentRef.setInput(name, value);
  return fixture;
}

export function q<T extends Element = HTMLElement>(root: Element, selector: string): T | null {
  return root.querySelector<T>(selector);
}

export function qa<T extends Element = HTMLElement>(root: Element, selector: string): T[] {
  return Array.from(root.querySelectorAll<T>(selector));
}

/** Visible text with collapsed white space. */
export function text(element: Element | null): string {
  return (element?.textContent ?? '').replace(/\s+/g, ' ').trim();
}
