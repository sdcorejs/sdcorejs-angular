import { ChangeDetectionStrategy as SdAngular22ChangeDetectionStrategy } from '@angular/core';
import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { SdSearch } from '@sdcorejs/angular/forms/models';
import { SdSelect } from './select.component';

// Probes for AC-020 / AC-021 (D-026, D-030): 10,000 local items, real layout (CDK virtual scroll measures
// the DOM), so these specs run with real timers instead of fakeAsync.

const COUNT = 10_000;
const LAST = COUNT - 1;
// why: only the last row starts with "Z", so a typeahead on "z" has exactly one target — the last item.
const ITEMS = Array.from({ length: COUNT }, (_, i) => ({ id: i, name: i === LAST ? 'Zulu' : `Item ${i}` }));

@Component({
  changeDetection: SdAngular22ChangeDetectionStrategy.Eager,
  standalone: true,
  imports: [SdSelect],
  template: `<sd-select
    [items]="items"
    valueField="id"
    displayField="name"
    [virtualScroll]="virtual"
    [(model)]="model"
    (sdChange)="changes.push($event)"></sd-select>`,
})
class SingleHost {
  items = ITEMS;
  virtual = true;
  model: number | null = null;
  changes: unknown[] = [];
}

@Component({
  changeDetection: SdAngular22ChangeDetectionStrategy.Eager,
  standalone: true,
  imports: [SdSelect],
  template: `<sd-select
    [items]="items"
    valueField="id"
    displayField="name"
    [multiple]="true"
    [showSelectAll]="true"
    [virtualScroll]="virtual"
    [(model)]="model"></sd-select>`,
})
class MultiHost {
  items = ITEMS;
  virtual = true;
  model: number[] = [];
}

const KEY_CODES: Record<string, number> = { ArrowDown: 40, ArrowUp: 38, PageDown: 34, PageUp: 33, Home: 36, End: 35, Enter: 13, z: 90 };

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

const getSelect = (fixture: ComponentFixture<unknown>) =>
  fixture.debugElement.query(d => d.componentInstance instanceof SdSelect).componentInstance as SdSelect<(typeof ITEMS)[number]>;
// why: from CDK 22 the select panel is a popover inserted next to its trigger, not inside OverlayContainer;
// the document holds the open panel in every supported Angular version.
const overlay = (): HTMLElement => document.body;
const trigger = (fixture: ComponentFixture<unknown>) => fixture.nativeElement.querySelector('mat-select') as HTMLElement;
const searchInput = () => overlay().querySelector<HTMLInputElement>('input.c-search-input');
const renderedOptions = () =>
  Array.from(overlay().querySelectorAll<HTMLElement>('mat-option')).filter(
    option => !option.classList.contains('sd-virtual-sentinel') && !option.classList.contains('sd-read-state-anchor')
  );
const optionText = (id: string | null) => (id ? (document.getElementById(id)?.textContent ?? '').trim() : '');
/** Label of the option the focused search box points to (the component manages aria-activedescendant). */
const activeLabel = () => optionText(searchInput()?.getAttribute('aria-activedescendant') ?? null);

async function openPanel(fixture: ComponentFixture<unknown>): Promise<void> {
  getSelect(fixture).open();
  await until(fixture, () => renderedOptions().length > 0, 'the panel options');
  // why: the component focuses the search box 100ms after opening; wait for it like a user would.
  await wait(150);
  await settle(fixture);
}

describe('SdSelect virtual scroll — single (10,000 items)', () => {
  let fixture: ComponentFixture<SingleHost>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [SingleHost, NoopAnimationsModule] }).compileComponents();
    fixture = TestBed.createComponent(SingleHost);
    await settle(fixture);
  });

  afterEach(() => getSelect(fixture)?.selectRef()?.close());

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
    'End activates the last item and scrolls it into the rendered range',
    async () => {
      await openPanel(fixture);
      press(searchInput()!, 'End');
      await until(fixture, () => activeLabel() === 'Zulu', 'the last item to become active');
      expect(renderedOptions().some(option => option.textContent?.trim() === 'Zulu')).toBeTrue();
    },
    SPEC_TIMEOUT
  );

  it(
    'PageDown moves the active item by a page; ArrowDown then moves by one',
    async () => {
      await openPanel(fixture);
      press(searchInput()!, 'ArrowDown');
      await until(fixture, () => activeLabel() === 'Item 0', 'the first item to become active');
      press(searchInput()!, 'PageDown');
      await until(fixture, () => /^Item \d+$/.test(activeLabel()) && activeLabel() !== 'Item 0', 'a page move');
      const afterPage = Number(activeLabel().replace('Item ', ''));
      expect(afterPage).toBeGreaterThanOrEqual(4);
      press(searchInput()!, 'ArrowDown');
      await until(fixture, () => activeLabel() === `Item ${afterPage + 1}`, 'a one-row move');
    },
    SPEC_TIMEOUT
  );

  it(
    'typeahead on the trigger reaches the last item',
    async () => {
      await openPanel(fixture);
      press(trigger(fixture), 'z');
      await until(
        fixture,
        () => optionText(trigger(fixture).getAttribute('aria-activedescendant')) === 'Zulu',
        'typeahead to reach the last item'
      );
    },
    SPEC_TIMEOUT
  );

  it(
    'Enter selects the active item, closes the panel and shows its label',
    async () => {
      await openPanel(fixture);
      press(searchInput()!, 'End');
      await until(fixture, () => activeLabel() === 'Zulu', 'the last item to become active');
      press(searchInput()!, 'Enter');
      await until(fixture, () => fixture.componentInstance.model === LAST, 'the model to receive the last id');
      await until(fixture, () => !getSelect(fixture).selectRef()?.panelOpen, 'the panel to close');
      // The chosen row is no longer rendered (the list pins it first); the sentinel keeps the label shown.
      await until(fixture, () => !!trigger(fixture).textContent?.includes('Zulu'), 'the trigger to show the label');
      expect(fixture.componentInstance.changes).toEqual([LAST]);
    },
    SPEC_TIMEOUT
  );
});

describe('SdSelect virtual scroll — multiple (10,000 items)', () => {
  let fixture: ComponentFixture<MultiHost>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [MultiHost, NoopAnimationsModule] }).compileComponents();
    fixture = TestBed.createComponent(MultiHost);
  });

  afterEach(() => getSelect(fixture)?.selectRef()?.close());

  it(
    'select-all covers the whole filtered set while the rendered options stay bounded',
    async () => {
      await settle(fixture);
      await openPanel(fixture);
      overlay().querySelector<HTMLElement>('.sd-select-all-row')!.click();
      await until(fixture, () => fixture.componentInstance.model.length === COUNT, 'every value to be selected');
      await settle(fixture);
      expect(renderedOptions().length).toBeLessThan(80);
      const label = trigger(fixture).querySelector('.sd-trigger-text')?.textContent ?? '';
      expect(label).toContain('Item 0');
      expect(label).toContain('Zulu');
    },
    SPEC_TIMEOUT
  );

  it(
    'keeps selected values that are outside the viewport when another option is toggled',
    async () => {
      const preset = Array.from({ length: 3000 }, (_, i) => i);
      fixture.componentInstance.model = preset;
      await settle(fixture);
      await openPanel(fixture);
      press(searchInput()!, 'End');
      await until(fixture, () => activeLabel() === 'Zulu', 'the last item to become active');
      renderedOptions()
        .find(option => option.textContent?.trim() === 'Zulu')!
        .click();
      await until(fixture, () => fixture.componentInstance.model.length === 3001, 'the toggled value to be added');
      // Same order as the non-virtual branch: pinned selections in list order, then the new value.
      expect(fixture.componentInstance.model).toEqual([...preset, LAST]);
    },
    SPEC_TIMEOUT
  );
});

@Component({
  changeDetection: SdAngular22ChangeDetectionStrategy.Eager,
  standalone: true,
  imports: [SdSelect],
  template: `<sd-select
    [items]="items"
    valueField="id"
    displayField="name"
    [required]="required"
    [virtualScroll]="true"
    [(model)]="model"
    (sdChange)="changes.push($event)"></sd-select>`,
})
class ConfigurableHost {
  items: (typeof ITEMS)[number][] | SdSearch = ITEMS;
  required = false;
  model: number | null = null;
  changes: unknown[] = [];
}

@Component({
  changeDetection: SdAngular22ChangeDetectionStrategy.Eager,
  standalone: true,
  imports: [SdSelect],
  template: `<sd-select
    [items]="items"
    valueField="id"
    displayField="name"
    [multiple]="true"
    [virtualScroll]="true"
    [(model)]="model"
    (sdChange)="changes.push($event)"></sd-select>`,
})
class MultiChangeHost {
  items = ITEMS;
  model: number[] = [];
  changes: unknown[] = [];
}

describe('SdSelect virtual scroll — behaviour', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [ConfigurableHost, MultiChangeHost, NoopAnimationsModule] }).compileComponents();
  });

  it(
    'closed single select: End sets the last row, which is not rendered while closed',
    async () => {
      const fixture = TestBed.createComponent(ConfigurableHost);
      await settle(fixture);
      trigger(fixture).focus();
      press(trigger(fixture), 'End');
      await until(fixture, () => fixture.componentInstance.model === LAST, 'the last value');
      expect(getSelect(fixture).selectRef()?.panelOpen).toBeFalse();
      await until(fixture, () => !!trigger(fixture).textContent?.includes('Zulu'), 'the trigger to show the label');
    },
    SPEC_TIMEOUT
  );

  it(
    'shows the required error once the panel closes untouched (the shell has no formControl)',
    async () => {
      const fixture = TestBed.createComponent(ConfigurableHost);
      fixture.componentInstance.required = true;
      await settle(fixture);
      await openPanel(fixture);
      // why: closing programmatically while the search box has focus trips NG0100 in both branches (the blur
      // lands inside change detection); a user moves focus first.
      searchInput()?.blur();
      await settle(fixture);
      getSelect(fixture).selectRef()?.close();
      await until(fixture, () => !!fixture.nativeElement.querySelector('mat-error'), 'the required error');
      expect(trigger(fixture).getAttribute('aria-invalid')).toBe('true');
    },
    SPEC_TIMEOUT
  );

  it(
    'multiple: emits sdChange once, on close, with every toggled value in list order',
    async () => {
      const fixture = TestBed.createComponent(MultiChangeHost);
      await settle(fixture);
      await openPanel(fixture);
      renderedOptions()[2].click();
      await settle(fixture);
      renderedOptions()
        .find(option => option.textContent?.trim() === 'Item 0')!
        .click();
      await until(fixture, () => fixture.componentInstance.model.length === 2, 'two selected values');
      expect(fixture.componentInstance.changes).toEqual([]);
      getSelect(fixture).selectRef()?.close();
      await until(fixture, () => fixture.componentInstance.changes.length === 1, 'sdChange on close');
      expect(fixture.componentInstance.changes[0]).toEqual([2, 0]);
    },
    SPEC_TIMEOUT
  );

  it(
    'multiple: Ctrl+A on the trigger selects every row of the list, then clears them',
    async () => {
      const fixture = TestBed.createComponent(MultiChangeHost);
      await settle(fixture);
      await openPanel(fixture);
      const ctrlA = () => {
        const event = new KeyboardEvent('keydown', { key: 'a', ctrlKey: true, bubbles: true, cancelable: true });
        Object.defineProperty(event, 'keyCode', { get: () => 65 });
        trigger(fixture).dispatchEvent(event);
      };
      ctrlA();
      await until(fixture, () => fixture.componentInstance.model.length === COUNT, 'every value to be selected');
      ctrlA();
      await until(fixture, () => fixture.componentInstance.model.length === 0, 'every value to be cleared');
    },
    SPEC_TIMEOUT
  );

  it(
    'SdSearch: renders every row the loader returns (no `limit` cut) inside the viewport',
    async () => {
      const fixture = TestBed.createComponent(ConfigurableHost);
      const remote = Array.from({ length: 500 }, (_, i) => ({ id: i, name: `Remote ${i}` }));
      fixture.componentInstance.items = async () => remote;
      await settle(fixture);
      getSelect(fixture).open();
      await until(fixture, () => getSelect(fixture).filteredItems().length === 500, 'all 500 remote rows');
      await until(fixture, () => renderedOptions().length > 0, 'rendered rows');
      expect(renderedOptions().length).toBeLessThan(80);
      getSelect(fixture).selectRef()?.close();
    },
    SPEC_TIMEOUT
  );
});

describe('SdSelect virtual scroll — off (default)', () => {
  it(
    'keeps the 2.15 panel: no viewport and the list cut at `limit`',
    async () => {
      await TestBed.configureTestingModule({ imports: [SingleHost, NoopAnimationsModule] }).compileComponents();
      const fixture = TestBed.createComponent(SingleHost);
      fixture.componentInstance.virtual = false;
      await settle(fixture);
      await openPanel(fixture);
      expect(overlay().querySelector('cdk-virtual-scroll-viewport')).toBeNull();
      expect(renderedOptions().length).toBe(50);
      getSelect(fixture).selectRef()?.close();
    },
    SPEC_TIMEOUT
  );
});
