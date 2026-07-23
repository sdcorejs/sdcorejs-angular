import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormGroup } from '@angular/forms';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { PagingReq } from '@sdcorejs/utils/models';
import { SdTableFilterRequest } from '@sdcorejs/angular/components/table';
import {
  SdEntityPicker,
  SdEntityPickerDataProvider,
  SdEntityPickerRequest,
  SdEntityPickerSelectedTemplateDirective,
} from './entity-picker.component';

interface User {
  id: number;
  name: string;
}

const USERS: User[] = [
  { id: 1, name: 'Ada' },
  { id: 2, name: 'Grace' },
];

describe('SdEntityPicker', () => {
  let fixture: ComponentFixture<SdEntityPicker<User, number>>;
  let component: SdEntityPicker<User, number>;
  let provider: SdEntityPickerDataProvider<User, number>;

  beforeEach(async () => {
    provider = {
      load: jasmine.createSpy('load').and.resolveTo({ items: USERS, total: USERS.length }),
      hydrate: jasmine
        .createSpy('hydrate')
        .and.callFake((keys: readonly number[]) => Promise.resolve(USERS.filter(user => keys.includes(user.id)))),
    };
    await TestBed.configureTestingModule({ imports: [NoopAnimationsModule, SdEntityPicker] }).compileComponents();
    fixture = TestBed.createComponent(SdEntityPicker<User, number>);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('provider', provider);
    fixture.componentRef.setInput('valueField', 'id');
    fixture.componentRef.setInput('displayField', 'name');
  });

  it('hydrates off-page initial keys and exposes their selected display values', async () => {
    fixture.componentRef.setInput('model', 2);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(provider.hydrate).toHaveBeenCalledWith([2], jasmine.any(AbortSignal));
    expect(component.selectedEntities()).toEqual([USERS[1]]);
    expect(component.displayText()).toBe('Grace');
  });

  it('applies stable-key single and multiple selection without retaining stale page objects', () => {
    fixture.componentRef.setInput('multiple', true);
    fixture.componentRef.setInput('model', [1]);
    fixture.detectChanges();
    component.open();

    component.onTableSelect(USERS[1], [USERS[0], USERS[1]]);
    component.applySelection();

    expect(component.model()).toEqual([1, 2]);

    fixture.componentRef.setInput('multiple', false);
    fixture.componentRef.setInput('model', 1);
    fixture.detectChanges();
    component.open();
    component.onTableSelect(USERS[1], [USERS[1]]);
    component.applySelection();

    expect(component.model()).toBe(2);
  });

  it('applies select-all to the visible page while preserving off-page keys', () => {
    fixture.componentRef.setInput('multiple', true);
    fixture.componentRef.setInput('model', [99]);
    fixture.detectChanges();
    component.open();

    component.onTableSelectAll([USERS[1]], USERS);
    expect(component.draftKeys()).toEqual([99, 2]);

    component.onTableSelectAll([], USERS);
    expect(component.draftKeys()).toEqual([99]);
  });

  it('clears a previous hydration error after a later hydration succeeds', async () => {
    let hydrationCount = 0;
    provider.load = () => new Promise(() => undefined);
    provider.hydrate = () => (hydrationCount++ === 0 ? Promise.reject(new Error('hydrate failed')) : Promise.resolve([USERS[1]]));
    fixture.componentRef.setInput('model', 1);
    fixture.detectChanges();
    await Promise.resolve();
    await Promise.resolve();

    expect(component.loadError()).toEqual(jasmine.any(Error));

    fixture.componentRef.setInput('model', 2);
    fixture.detectChanges();
    await Promise.resolve();
    await Promise.resolve();

    expect(component.loadError()).toBeNull();
  });

  it('aborts the previous server request and ignores stale request errors', async () => {
    const requests: SdEntityPickerRequest<User>[] = [];
    const deferreds = [deferred<{ items: User[]; total: number }>(), deferred<{ items: User[]; total: number }>()];
    provider.load = request => {
      requests.push(request);
      return deferreds[requests.length - 1].promise;
    };
    fixture.detectChanges();

    const first = component.loadPage(filterRequest('a'), pagingReq(0));
    const second = component.loadPage(filterRequest('ad'), pagingReq(1));

    expect(requests[0].signal.aborted).toBeTrue();
    deferreds[1].resolve({ items: [USERS[0]], total: 1 });
    expect(await second).toEqual({ items: [USERS[0]], total: 1 });
    deferreds[0].reject(new Error('stale failure'));
    expect(await first).toEqual({ items: [], total: 0 });
    expect(component.loadError()).toBeNull();
  });

  it('registers with the parent form and honors disabled/viewed presentation', () => {
    const form = new FormGroup({});
    fixture.componentRef.setInput('form', form);
    fixture.componentRef.setInput('name', 'ownerId');
    fixture.componentRef.setInput('disabled', true);
    fixture.detectChanges();

    expect(form.get('ownerId')).toBe(component.formControl);
    expect(component.formControl.disabled).toBeTrue();
    expect((fixture.nativeElement.querySelector('[data-entity-picker-trigger]') as HTMLButtonElement).disabled).toBeTrue();

    fixture.componentRef.setInput('disabled', false);
    fixture.componentRef.setInput('viewed', true);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('[data-entity-picker-trigger]')).toBeNull();
    expect(fixture.nativeElement.querySelector('[data-entity-picker-view]')).not.toBeNull();
  });

  it('restores focus to the trigger after the modal closes', async () => {
    fixture.detectChanges();
    const trigger = fixture.nativeElement.querySelector('[data-entity-picker-trigger]') as HTMLButtonElement;
    component.onModalClosed();
    await Promise.resolve();

    expect(document.activeElement).toBe(trigger);
  });
});

@Component({
  standalone: true,
  imports: [SdEntityPicker, SdEntityPickerSelectedTemplateDirective],
  template: `
    <sd-entity-picker [provider]="provider" valueField="id" displayField="name" [model]="1">
      <ng-template sdEntityPickerSelected let-entities="entities">Selected {{ entities[0]?.name }}</ng-template>
    </sd-entity-picker>
  `,
})
class EntityPickerTemplateHost {
  provider: SdEntityPickerDataProvider<User, number> = {
    load: () => ({ items: USERS, total: USERS.length }),
    hydrate: () => [USERS[0]],
  };
}

describe('SdEntityPicker templates', () => {
  it('renders the custom selected-value template after hydration', async () => {
    await TestBed.configureTestingModule({ imports: [NoopAnimationsModule, EntityPickerTemplateHost] }).compileComponents();
    const fixture = TestBed.createComponent(EntityPickerTemplateHost);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Selected Ada');
  });
});

function filterRequest(search: string): SdTableFilterRequest<User> {
  return {
    columnOperator: {},
    rawColumnFilter: {},
    rawExternalFilter: { search },
    pageNumber: 0,
    pageSize: 10,
    visibledColumns: [],
  } as unknown as SdTableFilterRequest<User>;
}

function pagingReq(pageNumber: number): PagingReq<User> {
  return { pageNumber, pageSize: 10 } as PagingReq<User>;
}

function deferred<T>(): { promise: Promise<T>; resolve(value: T): void; reject(error: unknown): void } {
  let resolve!: (value: T) => void;
  let reject!: (error: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}
