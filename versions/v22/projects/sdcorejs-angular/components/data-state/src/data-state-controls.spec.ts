import { ChangeDetectionStrategy as SdAngular22ChangeDetectionStrategy } from '@angular/core';
import { Component, viewChild } from '@angular/core';
import { TestBed, fakeAsync, tick, flushMicrotasks } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { SdDataStateTemplateDirective } from '@sdcorejs/angular/components/data-state';
import { SdTable } from '../../table/src/table.component';
import { SdTableOption } from '../../table/src/models/table-option.model';
import { SdSelect } from '../../../forms/select/src/select.component';
import { SdAutocomplete } from '../../../forms/autocomplete/src/autocomplete.component';

@Component({
  changeDetection: SdAngular22ChangeDetectionStrategy.Eager,
  standalone: true,
  imports: [SdTable, SdSelect, SdAutocomplete, SdDataStateTemplateDirective],
  template: `
    <sd-table [option]="option" [hideReadError]="hide">
      <ng-template sdDataStateTemplate let-current let-state="state" let-retry="retry" let-action="action">
        <span class="custom-table">{{ current }} / {{ state }}</span>
        <button type="button" class="table-retry" (click)="retry()">Retry table</button>
        <button type="button" (click)="action()">Action</button>
      </ng-template>
    </sd-table>
    <sd-select [items]="selectLoader" valueField="id" displayField="name" [hideReadError]="hide">
      <ng-template sdDataStateTemplate let-current let-state="state" let-retry="retry" let-action="action">
        <span class="custom-select">{{ current }} / {{ state }}</span>
        <button type="button" class="select-retry" (click)="retry()">Retry select</button>
        <button type="button" (click)="action()">Action</button>
      </ng-template>
    </sd-select>
    <sd-autocomplete [items]="autoLoader" valueField="id" displayField="name" [hideReadError]="hide">
      <ng-template sdDataStateTemplate let-current let-state="state" let-retry="retry" let-action="action">
        <span class="custom-auto">{{ current }} / {{ state }}</span>
        <button type="button" class="auto-retry" (click)="retry()">Retry autocomplete</button>
        <button type="button" (click)="action()">Action</button>
      </ng-template>
    </sd-autocomplete>
  `,
})
class ControlsHost {
  readonly table = viewChild.required(SdTable);
  readonly select = viewChild.required(SdSelect);
  readonly auto = viewChild.required(SdAutocomplete);
  hide = false;
  readonly tableLoader = jasmine.createSpy('table').and.callFake(() => Promise.reject('failed'));
  readonly selectLoader = jasmine.createSpy('select').and.callFake(() => Promise.reject('failed'));
  readonly autoLoader = jasmine.createSpy('auto').and.callFake(() => Promise.reject('failed'));
  readonly option: SdTableOption = { type: 'server', items: this.tableLoader, columns: [{ field: 'id', title: 'ID', type: 'string' }] };
}

describe('Control template forwarding through public directive', () => {
  beforeEach(() => TestBed.configureTestingModule({ imports: [ControlsHost, NoopAnimationsModule] }));

  it('forwards state strings and retry, and hides the complete custom error region', fakeAsync(() => {
    const f = TestBed.createComponent(ControlsHost);
    const host = f.componentInstance;
    f.detectChanges();
    host.select().focused.set(true);
    tick(600);
    host.select().open();
    tick(600);
    f.detectChanges();
    host.auto().autocompleteTrigger()!.openPanel();
    f.detectChanges();
    for (const name of ['table', 'select', 'auto']) {
      expect(document.querySelector(`.custom-${name}`)?.textContent).toBe('error / error');
    }
    host.hide = true;
    f.detectChanges();
    for (const name of ['table', 'select', 'auto']) expect(document.querySelector(`.custom-${name}`)).toBeNull();
    expect(host.table().readState().status).toBe('error');
    expect(host.select().readState().status).toBe('error');
    expect(host.auto().readState().status).toBe('error');
    host.hide = false;
    f.detectChanges();
    host.tableLoader.and.returnValue(Promise.resolve({ items: [], total: 0 }));
    host.selectLoader.and.returnValue(Promise.resolve([]));
    host.autoLoader.and.returnValue(Promise.resolve([]));
    const before = [host.tableLoader, host.selectLoader, host.autoLoader].map(loader => loader.calls.count());
    for (const name of ['table', 'select', 'auto']) {
      const button = document.querySelector<HTMLButtonElement>(`.${name}-retry`)!;
      expect(button.closest('mat-option')).toBeNull();
      button.click();
    }
    flushMicrotasks();
    tick();
    f.detectChanges();
    [host.tableLoader, host.selectLoader, host.autoLoader].forEach((loader, index) => expect(loader.calls.count()).toBe(before[index] + 1));
    expect(host.table().readState().status).toBe('empty');
    expect(host.select().readState().status).toBe('empty');
    expect(host.auto().readState().status).toBe('empty');
    f.destroy();
  }));
});
