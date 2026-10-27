import { Component, computed, signal } from '@angular/core';
import { ComponentFixture, TestBed, fakeAsync, flushMicrotasks, tick } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { SdViewDefDirective } from '@sdcorejs/angular/forms/directives';
import { SdSearch } from '@sdcorejs/angular/forms/models';
import { SdSelect } from './select.component';

const first = { id: '00000000-0000-4000-8000-000000000001', name: 'First label' };
const second = { id: '00000000-0000-4000-8000-000000000002', name: 'Second label' };

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (error: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

function settle<T>(fixture: ComponentFixture<T>) {
  flushMicrotasks();
  fixture.detectChanges();
  flushMicrotasks();
  tick(600);
  fixture.detectChanges();
  flushMicrotasks();
  fixture.detectChanges();
}

describe('SdSelect async selected-label synchronization', () => {
  beforeEach(() => TestBed.configureTestingModule({ imports: [SdSelect, NoopAnimationsModule] }));

  function setup(
    loader: jasmine.Spy,
    value: string | number | string[] | null = first.id,
    inline = false,
    fields: { valueField: string | undefined; displayField: string | undefined } = { valueField: 'id', displayField: 'name' }
  ) {
    const fixture = TestBed.createComponent(SdSelect);
    fixture.componentRef.setInput('items', loader);
    fixture.componentRef.setInput('valueField', fields.valueField);
    fixture.componentRef.setInput('displayField', fields.displayField);
    fixture.componentRef.setInput('model', value);
    fixture.componentRef.setInput('multiple', Array.isArray(value));
    fixture.componentRef.setInput('viewed', inline ? 'inline' : false);
    const comp = fixture.componentInstance;
    const modelChange = jasmine.createSpy('modelChange');
    const sdChange = jasmine.createSpy('sdChange');
    const sdSelection = jasmine.createSpy('sdSelection');
    comp.valueModel.subscribe(modelChange);
    comp.sdChange.subscribe(sdChange);
    comp.sdSelection.subscribe(sdSelection);
    settle(fixture);
    return { fixture, comp, modelChange, sdChange, sdSelection };
  }

  function expectTrigger<T extends object | string | number>(fixture: ComponentFixture<SdSelect<T>>, label: string) {
    expect(fixture.componentInstance.display()).withContext('display signal').toBe(label);
    expect(fixture.nativeElement.querySelector('mat-select-trigger')?.textContent.trim()).withContext('rendered trigger').toBe(label);
  }

  for (const outcome of ['empty', 'error'] as const) {
    for (const multiple of [false, true]) {
      for (const inline of [false, true]) {
        it(`hydrates the trigger and selected option after VALUE ${outcome} (multiple=${multiple}, inline=${inline})`, fakeAsync(() => {
          const search = deferred<unknown[]>();
          const error = new Error('synthetic VALUE failure');
          const loader = jasmine
            .createSpy('loader')
            .and.callFake(req =>
              req.type === 'SEARCH' ? search.promise : outcome === 'error' ? Promise.reject(error) : Promise.resolve([])
            );
          const value = multiple ? [second.id, first.id] : first.id;
          const { fixture, comp, modelChange, sdChange, sdSelection } = setup(loader, value, inline);
          expect(comp.display()).toBe(multiple ? `${second.id}, ${first.id}` : first.id);
          comp.open();
          settle(fixture);
          search.resolve([first, second]);
          settle(fixture);
          const selected = multiple ? [second, first] : [first];
          expectTrigger(fixture, selected.map(item => item.name).join(', '));
          expect(comp.selectedItems()).toEqual(selected);
          const option = comp.selectRef()!.options.find(item => item.value === first.id)!;
          expect(option.selected).toBeTrue();
          expect(option.viewValue).toBe(first.name);
          expect(comp.valueModel()).toBe(value);
          expect(comp.formControl.value).toBe(value);
          expect(comp.readState().channels.VALUE.status).toBe(outcome === 'error' ? 'error' : 'empty');
          expect(loader.calls.allArgs().filter(([req]) => req.type === 'VALUE').length).toBe(1);
          expect(loader.calls.allArgs().filter(([req]) => req.type === 'SEARCH').length).toBe(1);
          comp.selectRef()!.close();
          tick(600);
          flushMicrotasks();
          expect(comp.focused()).toBeFalse();
          expect(modelChange).not.toHaveBeenCalled();
          expect(sdChange).not.toHaveBeenCalled();
          expect(sdSelection).not.toHaveBeenCalled();
          fixture.destroy();
        }));
      }
    }
  }

  it('refreshes an existing label on subsequent searches without changing the model', fakeAsync(() => {
    const loader = jasmine
      .createSpy('loader')
      .and.callFake(req => Promise.resolve(req.type === 'VALUE' ? [first] : [{ ...first, name: 'Updated label' }]));
    const { fixture, comp, modelChange } = setup(loader);
    expectTrigger(fixture, first.name);
    comp.open();
    settle(fixture);
    expectTrigger(fixture, 'Updated label');
    loader.and.returnValue(Promise.resolve([{ ...first, name: 'Latest label' }]));
    comp.inputControl.setValue('latest');
    settle(fixture);
    expectTrigger(fixture, 'Latest label');
    expect(comp.valueModel()).toBe(first.id);
    expect(modelChange).not.toHaveBeenCalled();
    fixture.destroy();
  }));

  it('hydrates the selected label after a SEARCH retry without retrying VALUE', fakeAsync(() => {
    const loader = jasmine
      .createSpy('loader')
      .and.callFake(req => (req.type === 'VALUE' ? Promise.resolve([]) : Promise.reject(new Error('synthetic SEARCH failure'))));
    const { fixture, comp, modelChange, sdChange, sdSelection } = setup(loader);
    comp.open();
    settle(fixture);
    expect(comp.readState().operation).toBe('SEARCH');
    expect(comp.readState().status).toBe('error');
    const retry = deferred<unknown[]>();
    loader.and.returnValue(retry.promise);
    comp.retryRead();
    comp.retryRead();
    retry.resolve([first]);
    settle(fixture);
    expectTrigger(fixture, first.name);
    expect(comp.selectedItems()).toEqual([first]);
    expect(comp.readState().channels.SEARCH.status).toBe('ready');
    expect(loader.calls.allArgs().filter(([req]) => req.type === 'VALUE').length).toBe(1);
    expect(loader.calls.allArgs().filter(([req]) => req.type === 'SEARCH').length).toBe(2);
    expect(modelChange).not.toHaveBeenCalled();
    expect(sdChange).not.toHaveBeenCalled();
    expect(sdSelection).not.toHaveBeenCalled();
    fixture.destroy();
  }));
  it('keeps multiple order, duplicates, unresolved values and selections beyond the page limit', fakeAsync(() => {
    const search = deferred<unknown[]>();
    const loader = jasmine.createSpy('loader').and.callFake(req => (req.type === 'VALUE' ? Promise.resolve([second]) : search.promise));
    const value = [second.id, first.id, first.id, 'missing'];
    const { fixture, comp } = setup(loader, value);
    fixture.componentRef.setInput('limit', 1);
    comp.open();
    settle(fixture);
    search.resolve([first, { id: 'extra-1', name: 'Extra one' }, { id: 'extra-2', name: 'Extra two' }]);
    settle(fixture);
    expectTrigger(fixture, `${second.name}, ${first.name}, ${first.name}, missing`);
    expect(comp.selectedItems()).toEqual([second, first, first, { id: 'missing', name: 'missing' }]);
    expect(comp.filteredItems().map(item => comp.itemValue(item))).toEqual([second.id, first.id, 'missing', 'extra-1']);
    expect(comp.valueModel()).toBe(value);
    fixture.destroy();
  }));

  it('resolves nested field paths and the numeric zero value', fakeAsync(() => {
    const search = deferred<unknown[]>();
    const loader = jasmine.createSpy('loader').and.callFake(req => (req.type === 'VALUE' ? Promise.resolve([]) : search.promise));
    const { fixture, comp } = setup(loader, 0, false, { valueField: 'record.key', displayField: 'record.title' });
    comp.open();
    settle(fixture);
    const item = { record: { key: 0, title: 'Zero label' } };
    search.resolve([item]);
    settle(fixture);
    expectTrigger(fixture, 'Zero label');
    expect(comp.selectedItems()).toEqual([item]);
    expect(comp.selectRef()!.options.find(option => option.value === 0)!.selected).toBeTrue();
    expect(comp.valueModel()).toBe(0);
    fixture.destroy();
  }));

  it('preserves primitive selections when field mappings are absent', fakeAsync(() => {
    const loader = jasmine.createSpy('loader').and.returnValue(Promise.resolve(['alpha', 'beta']));
    const value = ['beta', 'alpha'];
    const { fixture, comp } = setup(loader, value, false, { valueField: undefined, displayField: undefined });
    comp.open();
    settle(fixture);
    expectTrigger(fixture, 'beta, alpha');
    expect(comp.selectedItems()).toEqual(value);
    expect(comp.valueModel()).toBe(value);
    fixture.destroy();
  }));

  for (const outcome of ['empty', 'unrelated', 'error'] as const) {
    it(`retains resolved and unresolved labels when SEARCH is ${outcome}`, fakeAsync(() => {
      const loader = jasmine.createSpy('loader').and.callFake(req => {
        if (req.type === 'VALUE') return Promise.resolve([first]);
        return outcome === 'error'
          ? Promise.reject(new Error('synthetic error'))
          : Promise.resolve(outcome === 'empty' ? [] : [{ id: 'other', name: 'Other' }]);
      });
      const value = [first.id, second.id];
      const { fixture, comp } = setup(loader, value);
      comp.open();
      settle(fixture);
      expectTrigger(fixture, `${first.name}, ${second.id}`);
      expect(comp.selectedItems()).toEqual([first, { id: second.id, name: second.id }]);
      expect(comp.valueModel()).toBe(value);
      expect(comp.readState().channels.SEARCH.status).toBe(outcome === 'error' ? 'error' : outcome === 'empty' ? 'empty' : 'ready');
      fixture.destroy();
    }));
  }

  for (const outcome of ['empty', 'error'] as const) {
    it(`resolves labels when SEARCH finishes before the pending VALUE ${outcome}`, fakeAsync(() => {
      const value = deferred<unknown[]>();
      const search = deferred<unknown[]>();
      const loader = jasmine.createSpy('loader').and.callFake(req => (req.type === 'VALUE' ? value.promise : search.promise));
      const { fixture, comp } = setup(loader);
      comp.open();
      settle(fixture);
      search.resolve([first]);
      settle(fixture);
      if (outcome === 'error') value.reject(new Error('synthetic VALUE failure'));
      else value.resolve([]);
      settle(fixture);
      expectTrigger(fixture, first.name);
      expect(comp.selectedItems()).toEqual([first]);
      expect(comp.loading()).toBeFalse();
      fixture.destroy();
    }));
  }

  for (const oldFirst of [false, true]) {
    it(`never restores the old selection when model changes during SEARCH (oldFirst=${oldFirst})`, fakeAsync(() => {
      const search = deferred<unknown[]>();
      const replacement = deferred<unknown[]>();
      const loader = jasmine
        .createSpy('loader')
        .and.callFake(req => (req.type === 'SEARCH' ? search.promise : req.value === first.id ? Promise.resolve([]) : replacement.promise));
      const { fixture, comp } = setup(loader);
      comp.open();
      settle(fixture);
      fixture.componentRef.setInput('model', second.id);
      settle(fixture);
      if (oldFirst) {
        search.resolve([first]);
        settle(fixture);
      }
      replacement.resolve([second]);
      settle(fixture);
      if (!oldFirst) {
        search.resolve([first]);
        settle(fixture);
      }
      expectTrigger(fixture, second.name);
      expect(comp.selectedItems()).toEqual([second]);
      expect(comp.valueModel()).toBe(second.id);
      fixture.destroy();
    }));
  }

  for (const empty of [undefined, null, '', []]) {
    it(`does not restore a cleared model (${JSON.stringify(empty)}) after SEARCH resolves`, fakeAsync(() => {
      const search = deferred<unknown[]>();
      const loader = jasmine.createSpy('loader').and.callFake(req => (req.type === 'VALUE' ? Promise.resolve([]) : search.promise));
      const { fixture, comp, modelChange, sdChange, sdSelection } = setup(loader);
      comp.open();
      settle(fixture);
      fixture.componentRef.setInput('model', empty);
      settle(fixture);
      search.resolve([first]);
      settle(fixture);
      expect(comp.display()).toBe('');
      expect(comp.selectedItems()).toEqual([]);
      expect(comp.valueModel()).toBe(empty);
      expect(comp.selectRef()!.options.some(option => option.selected)).toBeFalse();
      expect(modelChange).not.toHaveBeenCalled();
      expect(sdChange).not.toHaveBeenCalled();
      expect(sdSelection).not.toHaveBeenCalled();
      fixture.destroy();
    }));
  }

  for (const context of ['items', 'cacheChecksum', 'displayField', 'valueField']) {
    for (const oldFirst of [false, true]) {
      it(`ignores SEARCH from the old ${context} context (oldFirst=${oldFirst})`, fakeAsync(() => {
        const old = deferred<unknown[]>();
        const current = deferred<unknown[]>();
        let changed = false;
        const loader = jasmine
          .createSpy('loader')
          .and.callFake(req => (req.type === 'VALUE' ? Promise.resolve([]) : changed ? current.promise : old.promise));
        const { fixture, comp } = setup(loader);
        comp.open();
        settle(fixture);
        changed = true;
        fixture.componentRef.setInput(
          context,
          context === 'items'
            ? jasmine.createSpy('replacement').and.callFake(loader)
            : context === 'cacheChecksum'
              ? 'new-context'
              : 'alternate'
        );
        settle(fixture);
        const item =
          context === 'displayField'
            ? { ...first, alternate: 'Current label' }
            : context === 'valueField'
              ? { alternate: first.id, name: 'Current label' }
              : { ...first, name: 'Current label' };
        if (oldFirst) {
          old.resolve([{ ...first, name: 'Stale label' }]);
          settle(fixture);
        }
        current.resolve([item]);
        settle(fixture);
        if (!oldFirst) {
          old.resolve([{ ...first, name: 'Stale label' }]);
          settle(fixture);
        }
        expectTrigger(fixture, 'Current label');
        expect(comp.selectedItems()).toEqual([item]);
        expect(comp.valueModel()).toBe(first.id);
        expect(comp.loading()).toBeFalse();
        fixture.destroy();
      }));
    }
  }

  it('rejects the previous search result even before the new debounce expires', fakeAsync(() => {
    const old = deferred<unknown[]>();
    const current = deferred<unknown[]>();
    const loader = jasmine
      .createSpy('loader')
      .and.callFake(req => (req.type === 'VALUE' ? Promise.resolve([]) : req.searchText ? current.promise : old.promise));
    const { fixture, comp } = setup(loader);
    comp.open();
    settle(fixture);
    comp.inputControl.setValue('new');
    old.resolve([{ ...first, name: 'Stale label' }]);
    flushMicrotasks();
    expect(comp.display()).toBe(first.id);
    settle(fixture);
    current.resolve([first]);
    settle(fixture);
    expectTrigger(fixture, first.name);
    fixture.destroy();
  }));

  it('does not publish the old model after SEARCH waits on its pending VALUE', fakeAsync(() => {
    const oldValue = deferred<unknown[]>();
    const search = deferred<unknown[]>();
    const loader = jasmine
      .createSpy('loader')
      .and.callFake(req =>
        req.type === 'SEARCH' ? search.promise : req.value === first.id ? oldValue.promise : Promise.resolve([second])
      );
    const { fixture, comp } = setup(loader);
    comp.open();
    settle(fixture);
    search.resolve([first]);
    settle(fixture);
    fixture.componentRef.setInput('model', second.id);
    settle(fixture);
    oldValue.resolve([first]);
    settle(fixture);
    expectTrigger(fixture, second.name);
    expect(comp.selectedItems()).toEqual([second]);
    expect(comp.valueModel()).toBe(second.id);
    expect(comp.loading()).toBeFalse();
    fixture.destroy();
  }));

  it('does not publish selection, display or events after destruction', fakeAsync(() => {
    const search = deferred<unknown[]>();
    const loader = jasmine.createSpy('loader').and.callFake(req => (req.type === 'VALUE' ? Promise.resolve([]) : search.promise));
    const { fixture, comp, modelChange, sdChange, sdSelection } = setup(loader);
    comp.open();
    settle(fixture);
    const selected = comp.selectedItems();
    const display = comp.display();
    const readChanges = jasmine.createSpy('readChanges');
    comp.sdReadStateChange.subscribe(readChanges);
    fixture.destroy();
    search.resolve([first]);
    flushMicrotasks();
    tick(600);
    expect(comp.selectedItems()).toBe(selected);
    expect(comp.display()).toBe(display);
    expect(modelChange).not.toHaveBeenCalled();
    expect(sdChange).not.toHaveBeenCalled();
    expect(sdSelection).not.toHaveBeenCalled();
    expect(readChanges).not.toHaveBeenCalled();
  }));
});

@Component({
  standalone: true,
  imports: [SdSelect, SdViewDefDirective],
  template: `
    <sd-select [viewed]="viewed" [items]="items" [model]="value" valueField="id" displayField="name">
      <ng-template #sdSelected let-item let-display="display">
        <span class="selected-label">{{ item?.name }}|{{ display }}</span>
      </ng-template>
      <ng-template sdViewDef let-item="selectedItem" let-items="selectedItems">
        <span class="view-label">{{ item?.name }}|{{ items?.length }}</span>
      </ng-template>
    </sd-select>
  `,
})
class SelectedTemplateHost {
  viewed: boolean | 'inline' = 'inline';
  value = first.id;
  items: SdSearch = () => Promise.resolve([]);
}

@Component({
  standalone: true,
  imports: [SdSelect],
  template: `<sd-select
    [items]="items()"
    [cacheChecksum]="province()"
    [(model)]="ward"
    valueField="id"
    displayField="name"
    (sdChange)="changes.push($event)"
    (sdSelection)="selections.push($event)"></sd-select>`,
})
class DependentSelectHost {
  province = signal('old-province');
  ward: string | null = null;
  changes: unknown[] = [];
  selections: unknown[] = [];
  requests: { province: string; type: string; response: ReturnType<typeof deferred<unknown[]>> }[] = [];
  // why: mô phỏng loader phường được tạo lại khi tỉnh đổi ở màn clone/auto-fill.
  items = computed<SdSearch>(() => {
    const province = this.province();
    return req => {
      const response = deferred<unknown[]>();
      this.requests.push({ province, type: req.type, response });
      return response.promise;
    };
  });
}

describe('SdSelect dependent-filter clone and auto-fill bindings', () => {
  for (const order of ['province-first', 'ward-first', 'same-render'] as const) {
    for (const oldLast of [false, true]) {
      it(`resolves the current ward label with ${order} bindings and old response last=${oldLast}`, fakeAsync(() => {
        TestBed.configureTestingModule({ imports: [DependentSelectHost, NoopAnimationsModule] });
        const fixture = TestBed.createComponent(DependentSelectHost);
        const host = fixture.componentInstance;
        host.ward = first.id;
        settle(fixture);
        const comp = fixture.debugElement.query(By.directive(SdSelect)).componentInstance as SdSelect;
        comp.open();
        settle(fixture);
        const oldRequests = host.requests.filter(request => request.province === 'old-province');
        expect(oldRequests.some(request => request.type === 'VALUE')).toBeTrue();
        expect(oldRequests.some(request => request.type === 'SEARCH')).toBeTrue();
        if (order === 'ward-first') {
          host.ward = second.id;
          settle(fixture);
        }
        host.province.set('new-province');
        if (order === 'province-first') settle(fixture);
        host.ward = second.id;
        settle(fixture);
        const resolveOld = () =>
          host.requests
            .filter(request => request.province === 'old-province')
            .forEach(request => request.response.resolve([{ id: second.id, name: 'Stale province label' }]));
        if (!oldLast) {
          resolveOld();
          settle(fixture);
        }
        host.requests
          .filter(request => request.province === 'new-province' && request.type === 'VALUE')
          .forEach(request => request.response.resolve([]));
        settle(fixture);
        expect(comp.display()).toBe(second.id);
        host.requests
          .filter(request => request.province === 'new-province' && request.type === 'SEARCH')
          .forEach(request => request.response.resolve([second]));
        settle(fixture);
        if (oldLast) {
          resolveOld();
          settle(fixture);
        }
        expect(comp.display()).toBe(second.name);
        expect(fixture.nativeElement.querySelector('mat-select-trigger')?.textContent.trim()).toBe(second.name);
        expect(comp.selectRef()!.options.find(option => option.value === second.id)?.selected).toBeTrue();
        expect(comp.selectedItems()).toEqual([second]);
        expect(host.ward).toBe(second.id);
        expect(host.changes).toEqual([]);
        expect(host.selections).toEqual([]);
        expect(comp.loading()).toBeFalse();
        fixture.destroy();
      }));
    }
  }
});

describe('SdSelect async label rendering in projected templates', () => {
  it('updates selected template, inline/read-only template and tooltip with the same resolved item', fakeAsync(() => {
    TestBed.configureTestingModule({ imports: [SelectedTemplateHost, NoopAnimationsModule] });
    const search = deferred<unknown[]>();
    const fixture = TestBed.createComponent(SelectedTemplateHost);
    fixture.componentInstance.items = req => (req.type === 'VALUE' ? Promise.resolve([]) : search.promise);
    settle(fixture);
    const comp = fixture.debugElement.query(By.directive(SdSelect)).componentInstance as SdSelect;
    comp.open();
    settle(fixture);
    search.resolve([first]);
    settle(fixture);
    expect(fixture.nativeElement.querySelector('.selected-label')?.textContent.trim()).toBe(`${first.name}|${first.name}`);
    expect(fixture.nativeElement.querySelector('.view-label')?.textContent.trim()).toBe(`${first.name}|1`);
    expect(comp.tooltip()).toContain(first.name);
    fixture.componentInstance.viewed = true;
    settle(fixture);
    expect(fixture.nativeElement.querySelector('.view-label')?.textContent.trim()).toBe(`${first.name}|1`);
    expect(comp.valueModel()).toBe(first.id);
    fixture.destroy();
  }));
});
