import { ChangeDetectionStrategy as SdAngular22ChangeDetectionStrategy } from '@angular/core';
import { CdkDrag } from '@angular/cdk/drag-drop';
import { Component, signal } from '@angular/core';
import { TestBed, discardPeriodicTasks, fakeAsync, flushMicrotasks } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { findCssRule } from '../../../testing';
import { FakeResizeObserver, pointer, press, q, qa, text } from '../../../testing/schedule-testing';
import { SdScheduler } from './scheduler.component';
import type { SdSchedulerCellSelect, SdSchedulerCreateArgs, SdSchedulerView } from './scheduler.model';
import { SdSchedulerCellTemplateDirective } from './scheduler.templates';
import { clientOption, configureScheduler, renderScheduler, rooms, type Booking, type Room } from './scheduler.testing';

const run = (body: () => void): (() => void) =>
  fakeAsync(() => {
    body();
    discardPeriodicTasks();
  });

describe('SdScheduler · compact, touch, cell template and media', () => {
  afterEach(() => TestBed.resetTestingModule());

  describe('compact (§11)', () => {
    let restore: () => void;
    beforeEach(() => (restore = FakeResizeObserver.install()));
    afterEach(() => restore());

    it(
      '[SCH-SC-32] turns compact under 600px of host width, not at 600px',
      run(() => {
        const { host, fixture } = renderScheduler();
        const region = (): HTMLElement => q(host, '[role="region"]')!;
        FakeResizeObserver.trigger(599);
        fixture.detectChanges();
        expect(region().dataset['compact']).toBe('true');
        FakeResizeObserver.trigger(600);
        fixture.detectChanges();
        expect(region().hasAttribute('data-compact')).toBeFalse();
      })
    );

    it(
      '[SCH-C-15] narrows the resource column, hides descriptions, keeps two lines of title and the views',
      run(() => {
        const { host, fixture } = renderScheduler();
        FakeResizeObserver.trigger(390);
        fixture.detectChanges();
        const header = q(host, '[role="row"][data-resource-id="hue"] [role="rowheader"]')!;
        expect(header.getBoundingClientRect().width).toBe(120);
        expect(getComputedStyle(q(header, '.sd-scheduler__resource-description')!).display).toBe('none');
        expect(getComputedStyle(q(header, '.sd-scheduler__resource-title')!).webkitLineClamp).toBe('2');
        expect(qa(host, '[data-view-option]').length).withContext('§11: every view stays').toBe(3);
        expect(getComputedStyle(q(host, '[data-axis-hour]')!).width).toBe('64px');
        expect(getComputedStyle(q(host, '[data-group="Tầng 3"]')!).height).toBe('44px');
      })
    );

    it(
      '[SCH-C-15] waits 400ms on touch before a block lifts, not with a mouse',
      run(() => {
        const { fixture } = renderScheduler({ option: { ...clientOption(), move: { onMove: () => true } } });
        const drag = fixture.debugElement.query(By.directive(CdkDrag)).injector.get(CdkDrag);
        expect(drag.dragStartDelay).toEqual({ touch: 400, mouse: 0 });
      })
    );
  });

  describe('touch', () => {
    it(
      '[SCH-C-15] creates one slot on a tap and nothing on a one-finger move',
      run(() => {
        const onCreate = jasmine.createSpy('onCreate');
        const { host, settle } = renderScheduler({ option: { ...clientOption(), create: { onCreate } } });
        const track = q(host, '[data-track][data-resource-id="hall"]')!;
        const rect = track.getBoundingClientRect();
        const at = { x: rect.left + 13.25 * 80, y: rect.top + 20 };
        pointer(track, 'pointerdown', at, 'touch');
        pointer(track, 'pointermove', { x: at.x + 40, y: at.y }, 'touch');
        expect(q(host, '[data-create-ghost]')).withContext('no sweep on touch').toBeNull();
        pointer(track, 'pointerup', { x: at.x + 40, y: at.y }, 'touch');
        settle();
        expect(onCreate).not.toHaveBeenCalled();
        pointer(track, 'pointerdown', at, 'touch');
        pointer(track, 'pointerup', at, 'touch');
        settle();
        const args = onCreate.calls.mostRecent().args[0] as SdSchedulerCreateArgs<Room>;
        expect([args.start, args.end]).toEqual(['2026/11/09 13:00:00', '2026/11/09 13:30:00']);
      })
    );
  });

  describe('cell template (§8.5)', () => {
    @Component({
      changeDetection: SdAngular22ChangeDetectionStrategy.Eager,
      standalone: true,
      imports: [SdScheduler, SdSchedulerCellTemplateDirective],
      template: `
        <sd-scheduler
          [option]="option"
          [resources]="resources"
          date="2026/11/09"
          [view]="view()"
          [disabled]="disabled()"
          [readonly]="readonly()"
          (sdCellSelect)="selected.push($event)">
          <ng-template sdSchedulerCellTemplate [views]="views()" let-date let-events="events" let-off="off" let-resource="resource">
            <span data-code>{{ events.length ? 'X' : off ? '–' : '' }}|{{ resource.id }}|{{ date }}</span>
          </ng-template>
        </sd-scheduler>
      `,
    })
    class CellHost {
      readonly onCreate = jasmine.createSpy('onCreate');
      readonly option = { ...clientOption(), create: { onCreate: this.onCreate }, move: { onMove: () => true } };
      readonly resources = rooms();
      readonly view = signal<SdSchedulerView>('week');
      readonly views = signal<readonly ('week' | 'month')[]>(['week', 'month']);
      readonly selected: SdSchedulerCellSelect<Booking, Room>[] = [];
      readonly disabled = signal(false);
      readonly readonly = signal(false);
    }

    function mount(): { fixture: ReturnType<typeof TestBed.createComponent<CellHost>>; host: HTMLElement; settle: () => void } {
      configureScheduler();
      const fixture = TestBed.createComponent(CellHost);
      const host = fixture.nativeElement as HTMLElement;
      host.style.display = 'block';
      host.style.width = '1122px';
      const settle = (): void => {
        fixture.detectChanges();
        flushMicrotasks();
        fixture.detectChanges();
      };
      settle();
      return { fixture, host, settle };
    }

    it(
      '[SCH-C-11] draws cells instead of blocks: no drag, a cell with events emits sdCellSelect, an empty one creates',
      run(() => {
        const { fixture, host, settle } = mount();
        expect(qa(host, '[data-event-id]').length).toBe(0);
        expect(qa(host, '[data-resize-handle]').length).toBe(0);
        const cell = (resourceId: string, date: string): HTMLElement =>
          q(host, `[role="gridcell"][data-resource-id="${resourceId}"][data-date="${date}"]`)!;
        expect(cell('can-tho', '2026/11/10')).withContext('the cell of Cần Thơ on Tuesday').not.toBeNull();
        expect(text(cell('can-tho', '2026/11/10'))).toBe('X|can-tho|2026/11/10');
        expect(text(cell('hue', '2026/11/14')))
          .withContext('weekend off')
          .toBe('–|hue|2026/11/14');
        cell('can-tho', '2026/11/10').click();
        settle();
        const selected = fixture.componentInstance.selected;
        expect(selected.length).toBe(1);
        expect([selected[0].resource.id, selected[0].date, selected[0].events.map(event => event.id)]).toEqual([
          'can-tho',
          '2026/11/10',
          ['tuesday'],
        ]);
        cell('hue', '2026/11/12').click();
        settle();
        const args = fixture.componentInstance.onCreate.calls.mostRecent().args[0] as SdSchedulerCreateArgs<Room>;
        expect([args.resourceId, args.start, args.end, args.allDay]).toEqual(['hue', '2026/11/12', '2026/11/12', true]);
        expect(selected.length).withContext('an empty cell does not select').toBe(1);
      })
    );

    it(
      '[SCH-B-33] [SCH-SC-28] emits sdCellSelect while readonly, not while disabled; neither creates',
      run(() => {
        const { fixture, host, settle } = mount();
        const cell = (resourceId: string, date: string): HTMLElement =>
          q(host, `[role="gridcell"][data-resource-id="${resourceId}"][data-date="${date}"]`)!;
        const { componentInstance } = fixture;
        componentInstance.disabled.set(true);
        settle();
        cell('can-tho', '2026/11/10').click();
        cell('hue', '2026/11/12').click();
        settle();
        expect(componentInstance.selected.length).withContext('disabled').toBe(0);
        componentInstance.disabled.set(false);
        componentInstance.readonly.set(true);
        settle();
        cell('can-tho', '2026/11/10').click();
        cell('hue', '2026/11/12').click();
        settle();
        expect(componentInstance.selected.map(item => item.date))
          .withContext('readonly')
          .toEqual(['2026/11/10']);
        expect(componentInstance.onCreate).not.toHaveBeenCalled();
      })
    );

    it(
      '[SCH-C-11] applies only to the views of the directive, and Enter on a cell with events selects it',
      run(() => {
        const { fixture, host, settle } = mount();
        fixture.componentInstance.views.set(['month']);
        settle();
        expect(qa(host, '[data-event-id]').length).withContext('the week draws blocks').toBeGreaterThan(0);
        fixture.componentInstance.view.set('month');
        settle();
        expect(qa(host, '[data-event-id]').length).toBe(0);
        const grid = q(host, '[role="grid"]')!;
        grid.focus();
        fixture.detectChanges();
        for (let row = 0; row < 3; row++) press(grid, 'ArrowDown');
        settle();
        press(grid, 'ArrowRight');
        settle();
        const id = grid.getAttribute('aria-activedescendant')!;
        expect(document.getElementById(id)?.dataset['date']).toBe('2026/11/10');
        press(grid, 'Enter');
        settle();
        expect(fixture.componentInstance.selected.map(item => item.resource.id)).toEqual(['can-tho']);
      })
    );
  });

  describe('media (SC-34 … SC-36)', () => {
    // The styles of the component are in the document only while one is mounted.
    it(
      '[SCH-SC-34] stops motion with prefers-reduced-motion',
      run(() => {
        renderScheduler();
        expect(findCssRule(/sd-scheduler__sync/, /prefers-reduced-motion/)?.getPropertyValue('animation-name')).toBe('none');
        expect(findCssRule(/sd-scheduler__event/, /prefers-reduced-motion/)?.getPropertyValue('transition-property')).toBe('none');
      })
    );

    it(
      '[SCH-SC-35] draws frames in CanvasText and selection in Highlight with forced-colors',
      run(() => {
        renderScheduler();
        const color = (selector: RegExp): string | undefined =>
          findCssRule(selector, /forced-colors/)
            ?.getPropertyValue('border-color')
            .toLowerCase();
        expect(color(/sd-scheduler__event/)).toBe('canvastext');
        expect(color(/sd-scheduler__event\[data-selected\]/)).toBe('highlight');
      })
    );

    it(
      '[SCH-SC-36] gives the toolbar, band, scope and group buttons 44px targets on a coarse pointer at every width, RX #7',
      run(() => {
        renderScheduler();
        const coarse = (selector: RegExp, property = 'min-height'): string | undefined =>
          findCssRule(selector, /pointer:\s*coarse/)?.getPropertyValue(property);
        for (const selector of [/^\.sd-scheduler__today/, /sd-scheduler__band-button/, /sd-scheduler__scope-button/]) {
          expect(coarse(selector)).withContext(String(selector)).toBe('var(--sd-control-height-coarse, 44px)');
        }
        expect(coarse(/sd-scheduler__icon-button/, 'min-width')).toBe('var(--sd-control-height-coarse, 44px)');
        expect(coarse(/^\.sd-scheduler$/, '--sd-scheduler-group-height')?.trim()).toBe('44px');
        expect(coarse(/data-view="week"]\s*\.sd-scheduler__day-number::after/, 'inset')).toBe('-8px');
      })
    );

    it(
      '[SCH-SC-36] keeps hover additive and gives touch a 24px resize target',
      run(() => {
        renderScheduler();
        expect(findCssRule(/sd-scheduler__event:hover/, /hover: hover/)).toBeDefined();
        expect(
          findCssRule(/sd-scheduler__event\[data-selected\] \.sd-scheduler__resize/, /pointer: coarse/)?.getPropertyValue('width')
        ).toBe('24px');
      })
    );
  });
});
