import { ChangeDetectionStrategy as SdAngular22ChangeDetectionStrategy } from '@angular/core';
import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { SdAutocomplete } from './autocomplete.component';

// Probes for AC-022 (D-026, D-030): 10,000 local items with real layout, so real timers instead of fakeAsync.

const COUNT = 10_000;
const LAST = COUNT - 1;
const ITEMS = Array.from({ length: COUNT }, (_, i) => ({ id: i, name: i === LAST ? 'Zulu' : `Item ${i}` }));

@Component({
  changeDetection: SdAngular22ChangeDetectionStrategy.Eager,
  standalone: true,
  imports: [SdAutocomplete],
  template: `<sd-autocomplete
    [items]="items"
    valueField="id"
    displayField="name"
    [virtualScroll]="virtual"
    [(model)]="model"
    (sdChange)="changes.push($event)"></sd-autocomplete>`,
})
class Host {
  items = ITEMS;
  virtual = true;
  model: number | null = null;
  changes: unknown[] = [];
}

const KEY_CODES: Record<string, number> = { ArrowDown: 40, ArrowUp: 38, Enter: 13 };

// why: real timers and layout; Jasmine's 5s default is shorter than a slow CI frame budget.
const SPEC_TIMEOUT = 30_000;

const frame = () => new Promise<void>(resolve => requestAnimationFrame(() => resolve()));
const wait = (ms: number) => new Promise<void>(resolve => setTimeout(resolve, ms));

async function settle(fixture: ComponentFixture<unknown>, rounds = 2): Promise<void> {
  for (let i = 0; i < rounds; i++) {
    fixture.detectChanges();
    await fixture.whenStable();
    await frame();
  }
  fixture.detectChanges();
}

async function until(fixture: ComponentFixture<unknown>, predicate: () => boolean, what: string, timeout = 10_000): Promise<void> {
  const start = performance.now();
  while (!predicate()) {
    if (performance.now() - start > timeout) throw new Error(`timed out waiting for ${what}`);
    await settle(fixture, 1);
    await wait(20);
  }
}

function press(target: Element, key: string): void {
  const event = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true });
  Object.defineProperty(event, 'keyCode', { get: () => KEY_CODES[key] ?? 0 });
  target.dispatchEvent(event);
}

const getComp = (fixture: ComponentFixture<unknown>) =>
  fixture.debugElement.query(d => d.componentInstance instanceof SdAutocomplete).componentInstance as SdAutocomplete;
// why: from CDK 22 the autocomplete panel is a popover inserted next to its input, not inside OverlayContainer;
// the document holds the open panel in every supported Angular version.
const overlay = (): HTMLElement => document.body;
const input = (fixture: ComponentFixture<unknown>) => fixture.nativeElement.querySelector('input') as HTMLInputElement;
const renderedOptions = () =>
  Array.from(overlay().querySelectorAll<HTMLElement>('mat-option')).filter(option => !option.classList.contains('sd-read-state-anchor'));
/** Label of the option the input points to through aria-activedescendant. */
const activeLabel = (fixture: ComponentFixture<unknown>) => {
  const id = input(fixture).getAttribute('aria-activedescendant');
  return id ? (document.getElementById(id)?.textContent ?? '').trim() : '';
};

async function openPanel(fixture: ComponentFixture<unknown>): Promise<void> {
  input(fixture).focus();
  getComp(fixture).onFocus();
  getComp(fixture).autocompleteTrigger()?.openPanel();
  await until(fixture, () => renderedOptions().length > 0, 'the panel options');
  await settle(fixture);
}

describe('SdAutocomplete virtual scroll (10,000 items)', () => {
  let fixture: ComponentFixture<Host>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [Host, NoopAnimationsModule] }).compileComponents();
    fixture = TestBed.createComponent(Host);
    await settle(fixture);
  });

  afterEach(() => getComp(fixture)?.autocompleteTrigger()?.closePanel());

  it(
    'renders a bounded number of options inside a virtual viewport',
    async () => {
      await openPanel(fixture);
      expect(overlay().querySelector('cdk-virtual-scroll-viewport')).not.toBeNull();
      expect(renderedOptions().length).toBeGreaterThan(0);
      expect(renderedOptions().length).toBeLessThan(80);
    },
    SPEC_TIMEOUT
  );

  it(
    'ArrowDown walks past the rendered rows and Enter selects the active value',
    async () => {
      await openPanel(fixture);
      for (let i = 0; i < 30; i++) {
        press(input(fixture), 'ArrowDown');
        await settle(fixture, 1);
      }
      await until(fixture, () => activeLabel(fixture) === 'Item 29', 'the 30th item to become active');
      press(input(fixture), 'Enter');
      await until(fixture, () => fixture.componentInstance.model === 29, 'the model to receive id 29');
      expect(fixture.componentInstance.changes).toEqual([29]);
    },
    SPEC_TIMEOUT
  );

  it(
    'ArrowUp from the top wraps to the last item, which Enter selects',
    async () => {
      await openPanel(fixture);
      press(input(fixture), 'ArrowUp');
      await until(fixture, () => activeLabel(fixture) === 'Zulu', 'the last item to become active');
      press(input(fixture), 'Enter');
      await until(fixture, () => fixture.componentInstance.model === LAST, 'the model to receive the last id');
    },
    SPEC_TIMEOUT
  );
});

describe('SdAutocomplete virtual scroll — off (default)', () => {
  it(
    'keeps the 2.15 panel: no viewport and the list cut at `limit`',
    async () => {
      await TestBed.configureTestingModule({ imports: [Host, NoopAnimationsModule] }).compileComponents();
      const fixture = TestBed.createComponent(Host);
      fixture.componentInstance.virtual = false;
      await settle(fixture);
      await openPanel(fixture);
      expect(overlay().querySelector('cdk-virtual-scroll-viewport')).toBeNull();
      expect(renderedOptions().length).toBe(100);
      getComp(fixture).autocompleteTrigger()?.closePanel();
    },
    SPEC_TIMEOUT
  );
});
