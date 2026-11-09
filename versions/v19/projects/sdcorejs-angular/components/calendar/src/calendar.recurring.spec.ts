import { TestBed, fakeAsync, flushMicrotasks, type ComponentFixture } from '@angular/core/testing';
import { centerOf, mouseDrag, press } from '../../../testing/schedule-testing';
import { SdCalendar } from './calendar.component';
import type { SdCalendarEvent, SdCalendarMoveRequest } from './calendar.model';
import { configureCalendar, createWith, q, qa, text, weekEvents, type CalendarDto } from './calendar.testing';

type Event = SdCalendarEvent<CalendarDto>;

/** Monday stand-up as the occurrence of a weekly series. */
function recurringEvents(): Event[] {
  return weekEvents().map(event =>
    event.id === 'standup' ? { ...event, occurrence: { seriesId: 'standup-series', originalStart: '2026/10/19 09:00:00' } } : event
  );
}

interface Mounted {
  readonly fixture: ComponentFixture<SdCalendar<CalendarDto>>;
  readonly calendar: SdCalendar<CalendarDto>;
  readonly host: HTMLElement;
  readonly onMove: jasmine.Spy;
  readonly onLoad: jasmine.Spy;
  settle(): void;
}

function mount(result: boolean | 'cancel' = true): Mounted {
  configureCalendar();
  const onMove = jasmine.createSpy('onMove').and.returnValue(result);
  const onLoad = jasmine.createSpy('onLoad').and.callFake(() => recurringEvents());
  const fixture = createWith(SdCalendar<CalendarDto>, { option: { dataSource: { onLoad }, move: { onMove } }, date: '2026/10/22' });
  const host = fixture.nativeElement as HTMLElement;
  host.style.height = '640px';
  host.style.width = '960px';
  const settle = (): void => {
    fixture.detectChanges();
    flushMicrotasks();
    fixture.detectChanges();
    flushMicrotasks();
    fixture.detectChanges();
  };
  settle();
  return { fixture, calendar: fixture.componentInstance, host, onMove, onLoad, settle };
}

const standup = (host: HTMLElement): HTMLElement | null => q(host, '[data-event-id="standup"]');
const bar = (host: HTMLElement): HTMLElement | null => q(host, '[role="alertdialog"]');
const scopeButton = (host: HTMLElement, scope: string): HTMLButtonElement | null =>
  q<HTMLButtonElement>(host, `[role="alertdialog"] button[data-scope="${scope}"]`);
const lastRequest = (spy: jasmine.Spy): SdCalendarMoveRequest | undefined =>
  spy.calls.mostRecent()?.args[0] as SdCalendarMoveRequest | undefined;

describe('SdCalendar · recurring events', () => {
  afterEach(() => TestBed.resetTestingModule());

  it('[CAL-C-13] marks an occurrence with the repeat icon and "lặp lại" in its label', fakeAsync(() => {
    const { host } = mount();
    expect(q(standup(host) ?? host, 'sd-icon[name="repeat"]')).not.toBeNull();
    expect(standup(host)?.getAttribute('aria-label')).toBe('Họp giao ban tuần, Thứ Hai 19/10, 09:00 đến 09:30, lặp lại');
  }));

  it('[CAL-C-13] asks for the scope before onMove, focuses "Chỉ lần này" and keeps the block at the proposal', fakeAsync(() => {
    const { host, onMove, settle } = mount();
    const block = standup(host);
    block?.focus();
    press(block ?? host, 'ArrowDown', { alt: true });
    settle();
    expect(onMove).not.toHaveBeenCalled();
    const dialog = bar(host);
    expect(dialog).not.toBeNull();
    const labelledBy = dialog?.getAttribute('aria-labelledby') ?? 'none';
    expect(text(q(host, `#${labelledBy}`))).toBe('“Họp giao ban tuần” là sự kiện lặp. Áp dụng thay đổi cho:');
    expect(qa(dialog ?? host, 'button').map(text)).toEqual(['Chỉ lần này', 'Lần này và các lần sau', 'Tất cả', 'Hủy']);
    expect(document.activeElement).toBe(scopeButton(host, 'this'));
    expect(standup(host)?.dataset['start']).toBe('2026/10/19 09:15:00');
    expect(standup(host)?.hasAttribute('data-pending')).toBeTrue();
  }));

  it('[CAL-C-13] cancels with Esc and with Huỷ: no onMove, back in place, "cancelled", focus back on the block', fakeAsync(() => {
    const { host, onMove, settle } = mount();
    for (const close of [(): void => void press(bar(host) ?? host, 'Escape'), (): void => scopeButton(host, 'cancel')?.click()]) {
      const block = standup(host);
      block?.focus();
      press(block ?? host, 'ArrowDown', { alt: true });
      settle();
      close();
      settle();
      expect(bar(host)).toBeNull();
      expect(onMove).not.toHaveBeenCalled();
      expect(standup(host)?.dataset['start']).toBe('2026/10/19 09:00:00');
      expect(standup(host)?.hasAttribute('data-pending')).toBeFalse();
      expect(text(q(host, '[role="status"]'))).toBe('Đã huỷ thay đổi');
      expect((document.activeElement as HTMLElement | null)?.dataset['eventId']).toBe('standup');
    }
  }));

  // why: in the browser the continuation after the scope answer runs as a microtask before change detection removes
  // the bar, so the focus is still on a bar button when the calendar decides where it goes (R2 A-18).
  it('[CAL-B-05] puts the focus back on the block when the scope bar closes before change detection (SC-29)', fakeAsync(() => {
    const { host, settle } = mount();
    const closes: [string, (target: HTMLElement) => void][] = [
      ['Esc', target => void press(target, 'Escape')],
      ['Huỷ', () => scopeButton(host, 'cancel')?.click()],
      ['Chỉ lần này', () => scopeButton(host, 'this')?.click()],
    ];
    for (const [name, close] of closes) {
      const block = standup(host);
      block?.focus();
      press(block ?? host, 'ArrowDown', { alt: true });
      settle();
      expect(document.activeElement).withContext(name).toBe(scopeButton(host, 'this'));
      close(bar(host) ?? host);
      flushMicrotasks();
      settle();
      expect(bar(host)).withContext(name).toBeNull();
      expect((document.activeElement as HTMLElement | null)?.dataset['eventId']).withContext(name).toBe('standup');
    }
  }));

  it('[CAL-B-05] puts the focus on the block after the scope bar of a mouse drag closes', fakeAsync(() => {
    const { host, settle } = mount('cancel');
    const block = standup(host) ?? host;
    const from = { x: centerOf(block).x, y: block.getBoundingClientRect().top + 5 };
    mouseDrag(block, { x: from.x, y: from.y + 48 }, { from, step: settle });
    expect(document.activeElement).toBe(scopeButton(host, 'this'));
    scopeButton(host, 'cancel')?.click();
    flushMicrotasks();
    settle();
    expect(bar(host)).toBeNull();
    expect((document.activeElement as HTMLElement | null)?.dataset['eventId']).toBe('standup');
  }));

  it('[CAL-B-10] closes the scope bar silently when a reload aborts the move (SC-15, R2 B-3)', fakeAsync(() => {
    const { host, calendar, onMove, settle } = mount();
    const block = standup(host);
    block?.focus();
    press(block ?? host, 'ArrowDown', { alt: true });
    settle();
    expect(bar(host)).not.toBeNull();
    calendar.reload();
    settle();
    expect(bar(host)).toBeNull();
    expect(onMove).not.toHaveBeenCalled();
    expect(text(q(host, '[role="status"]'))).not.toContain('Đã huỷ thay đổi');
    expect(standup(host)?.dataset['start']).toBe('2026/10/19 09:00:00');
    expect(standup(host)?.hasAttribute('data-pending')).toBeFalse();
  }));

  it('[CAL-C-13] passes the chosen scope and reloads after "following" and "all"', fakeAsync(() => {
    for (const scope of ['this', 'following', 'all'] as const) {
      const { host, onMove, onLoad, settle } = mount();
      press(standup(host) ?? host, 'ArrowDown', { alt: true });
      settle();
      const loads = onLoad.calls.count();
      scopeButton(host, scope)?.click();
      settle();
      expect(lastRequest(onMove)?.scope).withContext(scope).toBe(scope);
      expect(onLoad.calls.count())
        .withContext(scope)
        .toBe(scope === 'this' ? loads : loads + 1);
      TestBed.resetTestingModule();
    }
  }));

  it('[CAL-C-13] asks after a drag too, and moves with scope "this" without asking for source "api"', fakeAsync(() => {
    const { host, calendar, onMove, settle } = mount('cancel');
    const block = standup(host) ?? host;
    const from = { x: centerOf(block).x, y: block.getBoundingClientRect().top + 5 };
    mouseDrag(block, { x: from.x, y: from.y + 48 }, { from, step: settle });
    expect(bar(host)).not.toBeNull();
    scopeButton(host, 'all')?.click();
    settle();
    expect([lastRequest(onMove)?.source, lastRequest(onMove)?.scope]).toEqual(['drag', 'all']);
    void calendar.move('standup', { start: '2026/10/19 11:00:00', end: '2026/10/19 11:30:00' });
    settle();
    expect(bar(host)).toBeNull();
    expect([lastRequest(onMove)?.source, lastRequest(onMove)?.scope]).toEqual(['api', 'this']);
  }));

  it('[CAL-SC-14] counts the open scope question as the one waiting operation', fakeAsync(() => {
    const { host, calendar, onMove, settle } = mount();
    press(standup(host) ?? host, 'ArrowDown', { alt: true });
    settle();
    let result: boolean | null = null;
    void calendar.move('client', { start: '2026/10/22 11:00:00', end: '2026/10/22 12:00:00' }).then(value => (result = value));
    settle();
    expect(result).toBeFalse();
    expect(onMove).not.toHaveBeenCalled();
  }));

  it('[CAL-SC-15] closes the scope question when the range changes', fakeAsync(() => {
    const { host, onMove, settle } = mount();
    press(standup(host) ?? host, 'ArrowDown', { alt: true });
    settle();
    q<HTMLButtonElement>(host, 'button[data-action="next"]')?.click();
    settle();
    expect(bar(host)).toBeNull();
    q<HTMLButtonElement>(host, 'button[data-action="prev"]')?.click();
    settle();
    expect(standup(host)?.dataset['start']).toBe('2026/10/19 09:00:00');
    expect(onMove).not.toHaveBeenCalled();
  }));
});
