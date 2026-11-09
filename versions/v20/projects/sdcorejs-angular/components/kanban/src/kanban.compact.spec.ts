import { ComponentFixture, TestBed, fakeAsync, flush, flushMicrotasks } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { findCssRule } from '../../../testing';
import { FakeResizeObserver, deferred } from '../../../testing/schedule-testing';
import { SdKanban } from './kanban.component';
import type { SdKanbanCard, SdKanbanColumn, SdKanbanLoadResult, SdKanbanOption } from './kanban.model';

type Card = SdKanbanCard<never>;

const columns: readonly SdKanbanColumn[] = [
  { id: 'open', label: 'Open' },
  { id: 'done', label: 'Done' },
  { id: 'empty', label: 'Empty' },
];
const items: readonly Card[] = [
  { id: 'x', columnId: 'open', title: 'First' },
  { id: 'y', columnId: 'done', title: 'Second' },
];

describe('SdKanban · compact layout, live region and themes', () => {
  let fixture: ComponentFixture<SdKanban<never>>;
  let restore: () => void = () => undefined;
  const host = (): HTMLElement => fixture.nativeElement as HTMLElement;
  const root = (): HTMLElement | null => host().querySelector<HTMLElement>('section.sd-kanban');
  const settle = (): void => {
    fixture.detectChanges();
    flushMicrotasks();
    fixture.detectChanges();
  };
  const mount = (option: SdKanbanOption<never> = { move: { onMove: () => true } }, inputs: Record<string, unknown> = {}): void => {
    fixture = TestBed.createComponent(SdKanban<never>);
    fixture.componentRef.setInput('columns', columns);
    fixture.componentRef.setInput('items', items);
    fixture.componentRef.setInput('option', option);
    for (const [key, value] of Object.entries(inputs)) fixture.componentRef.setInput(key, value);
    settle();
  };

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [SdKanban], providers: [provideNoopAnimations()] });
    restore = FakeResizeObserver.install();
  });
  afterEach(() => restore());

  it('[KAN-SC-32] turns compact under 600px of host width and back from 600px; lanes are 260px wide', fakeAsync(() => {
    mount();
    expect(root()?.hasAttribute('data-compact')).toBeFalse();
    FakeResizeObserver.trigger(599);
    settle();
    expect(root()?.getAttribute('data-compact')).toBe('true');
    expect(host().querySelector<HTMLElement>('.sd-kanban__column[data-column-id="open"]')?.getBoundingClientRect().width).toBe(260);
    FakeResizeObserver.trigger(600);
    settle();
    expect(root()?.hasAttribute('data-compact')).toBeFalse();
    expect(findCssRule(/sd-kanban__column/, /max-width:\s*599px/))
      .withContext('no viewport media query')
      .toBeUndefined();
  }));

  it('[KAN-SC-32] runs without ResizeObserver and never turns compact', fakeAsync(() => {
    restore();
    restore = FakeResizeObserver.install(null);
    mount();
    expect(root()?.hasAttribute('data-compact')).toBeFalse();
    expect(host().querySelectorAll('article').length).toBe(2);
  }));

  it('[KAN-SC-32] stops watching the host when destroyed', fakeAsync(() => {
    mount();
    fixture.destroy();
    expect(FakeResizeObserver.instances.every(observer => observer.disconnected)).toBeTrue();
  }));

  it('[KAN-SC-33] has exactly one live region, also with a board failure, an empty column and a load error', fakeAsync(() => {
    const regions = (): number => host().querySelectorAll('[aria-live], [role="status"], [role="alert"]').length;
    mount({ move: { onMove: () => false } });
    expect(regions()).toBe(1);
    void fixture.componentInstance.move('x', { columnId: 'done' });
    settle();
    // The failed card is filtered out, so the failure goes to the board band.
    fixture.componentRef.setInput('keyword', 'Second');
    settle();
    expect(host().querySelector('.sd-kanban__failure')).not.toBeNull();
    expect(regions()).toBe(1);
    const wait = deferred<SdKanbanLoadResult<never>>();
    mount({ dataSource: { onLoad: () => wait.promise } });
    wait.reject(new Error('down'));
    settle();
    expect(host().querySelector('[data-load-error]')).not.toBeNull();
    expect(regions()).toBe(1);
    flush();
  }));

  it('[KAN-SC-34] has no transition with prefers-reduced-motion', () => {
    TestBed.createComponent(SdKanban<never>);
    expect(findCssRule(/sd-kanban__card-tools/, /prefers-reduced-motion/)?.getPropertyValue('transition-property')).toBe('none');
    expect(findCssRule(/sd-kanban__card\b/, /prefers-reduced-motion/)?.getPropertyValue('transition-property')).toBe('none');
  });

  it('[KAN-SC-35] outlines the selected and the pending card with Highlight in forced colors', () => {
    TestBed.createComponent(SdKanban<never>);
    expect(findCssRule(/data-selected/, /forced-colors/)?.getPropertyValue('outline-color')).toBe('highlight');
    expect(findCssRule(/sd-kanban__card--pending/, /forced-colors/)?.getPropertyValue('outline-color')).toBe('highlight');
    expect(findCssRule(/sd-kanban__column/, /forced-colors/)?.getPropertyValue('border-color')).toBe('canvastext');
  });

  it('[KAN-SC-36] gives every control a 40px target on a coarse pointer', () => {
    TestBed.createComponent(SdKanban<never>);
    for (const selector of [/sd-kanban__icon-button/, /sd-kanban__load-more/, /sd-kanban__retry/]) {
      expect(findCssRule(selector, /pointer:\s*coarse/)?.getPropertyValue('min-height'))
        .withContext(String(selector))
        .toBe('40px');
    }
  });

  it('[KAN-SC-38] puts data-autoid on the root, the columns and the cards only with autoId, ids encoded', fakeAsync(() => {
    mount();
    expect(host().querySelector('[data-autoid]')).toBeNull();
    fixture.componentRef.setInput('autoId', 'orders');
    fixture.componentRef.setInput('items', [{ id: 'DH 1/2', columnId: 'open', title: 'DH 1/2' }]);
    settle();
    expect(host().querySelector('[data-autoid="components-kanban-orders"]')).not.toBeNull();
    expect(host().querySelector('[data-autoid="components-kanban-orders-column-open"]')).not.toBeNull();
    expect(host().querySelector(`[data-autoid="components-kanban-orders-card-${encodeURIComponent('DH 1/2')}"]`)).not.toBeNull();
  }));
});
