import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { SdSearch } from '@sdcorejs/angular/forms/models';
import { SdSelect } from './select.component';

const first = { id: '00000000-0000-4000-8000-000000000001', name: 'First label' };
const second = { id: '00000000-0000-4000-8000-000000000002', name: 'Second label' };

@Component({
  standalone: true,
  imports: [SdSelect],
  template: `<sd-select
    [items]="items"
    [(model)]="value"
    [multiple]="multiple"
    valueField="id"
    displayField="name"
    [virtualScroll]="true"
    [limit]="1"></sd-select>`,
})
class VirtualLabelHost {
  items: SdSearch = () => Promise.resolve([]);
  value: string | string[] = first.id;
  multiple = false;
}

// CDK measures and scrolls the real viewport. Match select.virtual-scroll.spec.ts:
// await actual rendering frames instead of advancing only Zone's fake timers.
async function settle(fixture: ComponentFixture<unknown>): Promise<void> {
  fixture.detectChanges();
  await fixture.whenStable();
  await new Promise<void>(resolve => requestAnimationFrame(() => resolve()));
  fixture.detectChanges();
}

async function until(fixture: ComponentFixture<unknown>, predicate: () => boolean, description: string): Promise<void> {
  const start = performance.now();
  while (!predicate()) {
    if (performance.now() - start > 10_000) throw new Error(`Timed out waiting for ${description}`);
    await settle(fixture);
  }
}

describe('SdSelect virtual selected-label recovery', () => {
  beforeEach(() => TestBed.configureTestingModule({ imports: [VirtualLabelHost, NoopAnimationsModule] }));

  for (const outcome of ['empty', 'error'] as const) {
    for (const multiple of [false, true]) {
      it(`keeps recovered labels after scrolling selections out of view (VALUE=${outcome}, multiple=${multiple})`, async () => {
        let resolveSearch!: (items: unknown[]) => void;
        const search = new Promise<unknown[]>(resolve => (resolveSearch = resolve));
        const loader = jasmine
          .createSpy('loader')
          .and.callFake(req =>
            req.type === 'SEARCH' ? search : outcome === 'error' ? Promise.reject(new Error('synthetic VALUE error')) : Promise.resolve([])
          );
        const fixture = TestBed.createComponent(VirtualLabelHost);
        const value = multiple ? [second.id, first.id] : first.id;
        fixture.componentInstance.items = loader;
        fixture.componentInstance.value = value;
        fixture.componentInstance.multiple = multiple;
        await settle(fixture);
        const comp = fixture.debugElement.query(By.directive(SdSelect)).componentInstance as SdSelect;
        const selected = multiple ? [second, first] : [first];
        const label = selected.map(item => item.name).join(', ');
        const modelChange = jasmine.createSpy('modelChange');
        const sdChange = jasmine.createSpy('sdChange');
        const sdSelection = jasmine.createSpy('sdSelection');
        comp.valueModel.subscribe(modelChange);
        comp.sdChange.subscribe(sdChange);
        comp.sdSelection.subscribe(sdSelection);
        try {
          await until(fixture, () => comp.display().includes(first.id), 'unresolved UUID label');
          comp.open();
          await until(fixture, () => loader.calls.allArgs().some(([req]) => req.type === 'SEARCH'), 'SEARCH request');
          const others = Array.from({ length: 120 }, (_, index) => ({ id: `other-${index}`, name: `Other ${index}` }));
          resolveSearch([...others, first, second]);
          await until(fixture, () => comp.display() === label && !!comp.selectRef()?.panel, 'recovered label and panel');
          await settle(fixture);
          expect(comp.selectedItems()).toEqual(selected);
          expect(comp.filteredItems().length).toBe(122);
          expect(comp.selectRef()!.options.length).toBeLessThan(122);
          const input = comp.selectRef()!.panel.nativeElement.querySelector('input.c-search-input') as HTMLInputElement;
          const end = new KeyboardEvent('keydown', { key: 'End', bubbles: true, cancelable: true });
          Object.defineProperty(end, 'keyCode', { get: () => 35 });
          input.dispatchEvent(end);
          await until(
            fixture,
            () =>
              comp.virtualActiveIndex() === 121 &&
              !comp.selectRef()!.options.some(option => selected.some(item => item.id === option.value)),
            'selected rows outside viewport'
          );
          await settle(fixture);
          const sentinel = comp.selectRef()!.options.find(option => typeof option.value === 'symbol');
          expect(sentinel?.selected).toBeTrue();
          expect(fixture.nativeElement.querySelector('mat-select-trigger')?.textContent.trim()).toBe(label);
          // Close through the trigger, as a user would: blur the search input before
          // Material detaches its portal so its touched state settles before teardown.
          comp.selectRef()!.focus();
          await settle(fixture);
          comp.selectRef()!.close();
          await settle(fixture);
          expect(fixture.nativeElement.querySelector('mat-select-trigger')?.textContent.trim()).toBe(label);
          expect(comp.valueModel()).toBe(value);
          expect(fixture.componentInstance.value).toBe(value);
          expect(comp.formControl.value).toBe(value);
          expect(comp.readState().channels.VALUE.status).toBe(outcome === 'error' ? 'error' : 'empty');
          expect(modelChange).not.toHaveBeenCalled();
          expect(sdChange).not.toHaveBeenCalled();
          expect(sdSelection).not.toHaveBeenCalled();
        } finally {
          resolveSearch([]);
          fixture.destroy();
        }
      }, 30_000);
    }
  }
});
