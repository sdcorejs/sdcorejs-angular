import { OverlayContainer } from '@angular/cdk/overlay';
import { ComponentFixture, TestBed, fakeAsync, flush } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { SdSection } from '@sdcorejs/angular/components/section';
import { BehaviorSubject } from 'rxjs';
import { ExternalFilterComponent } from './external-filter.component';
import { TableFilterConfiguration, TableFilterRegister, TableFilterValue } from '../../../services/table-filter/table-filter.model';

/**
 * Tạo mock TableFilterRegister với observer dùng BehaviorSubject — emit ĐỒNG BỘ giá trị
 * hiện tại ngay khi subscribe (giống startWith trong service thật). Đây chính là điều kiện
 * kích hoạt OOM loop trước đây.
 *
 * `value.externalFilter = undefined` để component chạy `val.externalFilter || {}` → tạo
 * object ref mới mỗi emit (mấu chốt khiến effect rerun nếu externalFilter bị track).
 *
 * Spy đếm số lần subscribe vào value.observer — nếu effect loop, count sẽ tăng vô hạn.
 */
function createMockRegister() {
  const valueSubject = new BehaviorSubject<TableFilterValue>({ externalFilter: undefined });
  const cfgSubject = new BehaviorSubject<TableFilterConfiguration>({ inlineExternal: {} });

  const valueSubscribeSpy = jasmine
    .createSpy('value.subscribe')
    .and.callFake((...args: any[]) => valueSubject.subscribe(...(args as [any])));
  const cfgSubscribeSpy = jasmine.createSpy('cfg.subscribe').and.callFake((...args: any[]) => cfgSubject.subscribe(...(args as [any])));

  const register: TableFilterRegister = {
    configuration: {
      get: () => cfgSubject.value,
      set: (c: any) => c,
      remove: () => {},
      observer: { subscribe: cfgSubscribeSpy } as any,
    },
    value: {
      get: () => valueSubject.value,
      set: (v: any) => v,
      remove: () => {},
      observer: { subscribe: valueSubscribeSpy } as any,
    },
  };

  return { register, valueSubject, cfgSubject, valueSubscribeSpy, cfgSubscribeSpy };
}

describe('ExternalFilterComponent — OOM regression (effect + startWith)', () => {
  let fixture: ComponentFixture<ExternalFilterComponent>;
  let component: ExternalFilterComponent;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [ExternalFilterComponent] });
    fixture = TestBed.createComponent(ExternalFilterComponent);
    component = fixture.componentInstance;
  });

  it('subscribe value.observer ĐÚNG 1 lần — không loop vô hạn khi externalFilter undefined', fakeAsync(() => {
    const { register, valueSubscribeSpy, cfgSubscribeSpy } = createMockRegister();

    fixture.componentRef.setInput('filterRegister', register);
    fixture.detectChanges();
    flush();

    // Nếu effect bị track externalFilter → rerun → resubscribe nhiều lần.
    // Fix untracked() đảm bảo mỗi observer chỉ subscribe 1 lần.
    expect(valueSubscribeSpy).toHaveBeenCalledTimes(1);
    expect(cfgSubscribeSpy).toHaveBeenCalledTimes(1);
  }));

  it('emit lại value (externalFilter undefined) KHÔNG gây resubscribe', fakeAsync(() => {
    const { register, valueSubject, valueSubscribeSpy } = createMockRegister();

    fixture.componentRef.setInput('filterRegister', register);
    fixture.detectChanges();
    flush();
    expect(valueSubscribeSpy).toHaveBeenCalledTimes(1);

    // Emit thêm vài lần với externalFilter undefined (mỗi lần component tạo {} ref mới).
    valueSubject.next({ externalFilter: undefined });
    valueSubject.next({ externalFilter: undefined });
    flush();

    // Vẫn 1 subscribe — effect không rerun do externalFilter không bị track.
    expect(valueSubscribeSpy).toHaveBeenCalledTimes(1);
    // externalFilter signal cập nhật bình thường từ emit.
    expect(component.externalFilter()).toEqual({});
  }));

  it('đổi filterRegister input → resubscribe đúng 1 lần cho register mới', fakeAsync(() => {
    const first = createMockRegister();
    fixture.componentRef.setInput('filterRegister', first.register);
    fixture.detectChanges();
    flush();
    expect(first.valueSubscribeSpy).toHaveBeenCalledTimes(1);

    const second = createMockRegister();
    fixture.componentRef.setInput('filterRegister', second.register);
    fixture.detectChanges();
    flush();

    // Register mới subscribe 1 lần; register cũ không subscribe thêm.
    expect(second.valueSubscribeSpy).toHaveBeenCalledTimes(1);
    expect(first.valueSubscribeSpy).toHaveBeenCalledTimes(1);
  }));

  it('maps filter.collapsible to the inner sd-section', () => {
    fixture.componentRef.setInput('filter', { collapsible: false });
    fixture.componentRef.setInput('externalFilters', [{ field: 'name', title: 'Tên', type: 'string' }]);
    fixture.detectChanges();

    const section = fixture.debugElement.query(By.directive(SdSection)).componentInstance as SdSection;
    expect(section.collapsible()).toBeFalse();
  });

  it('keeps explicit non-collapsible external filter sections', () => {
    fixture.componentRef.setInput('filter', { collapsible: false });

    fixture.componentRef.setInput('externalFilters', [{ field: 'name', title: 'Tên', type: 'string' }]);
    fixture.detectChanges();

    const section = fixture.debugElement.query(By.directive(SdSection)).componentInstance as SdSection;
    expect(section.collapsible()).toBeFalse();
  });

  describe('MM-01 settings menu', () => {
    const filters = [
      { field: 'name', title: 'Name', type: 'string' as const, required: true },
      { field: 'age', title: 'Age', type: 'number' as const },
      { field: 'birthday', title: 'Birthday', type: 'date' as const },
    ];
    let configuration: jasmine.Spy;
    const overlay = () => TestBed.inject(OverlayContainer).getContainerElement();
    const trigger = () => fixture.nativeElement.querySelector('[data-autoid="components-button-t-external-setting"]') as HTMLButtonElement;
    const item = (field: string) => overlay().querySelector<HTMLButtonElement>(`[data-autoid="t-external-setting-${field}"]`)!;

    beforeEach(() => {
      const { register } = createMockRegister();
      configuration = spyOn(register.configuration, 'set').and.callThrough();
      component.isMobileOrTablet = false;
      fixture.componentRef.setInput('autoId', 't');
      fixture.componentRef.setInput('filter', {});
      fixture.componentRef.setInput('externalFilters', filters);
      fixture.componentRef.setInput('filterRegister', register);
      fixture.detectChanges();
      component.inlineExternal.set({ name: true, age: true, birthday: false });
      fixture.detectChanges();
    });

    it('MM-01 is an Action Popover on the settings sd-button: every field, in order, with the autoIds kept', () => {
      expect(trigger().getAttribute('aria-haspopup')).toBe('menu');
      expect(trigger().querySelector('sd-icon')?.textContent?.trim()).toBe('settings');
      trigger().click();
      fixture.detectChanges();

      expect(overlay().querySelector('.sd-action-popover')).not.toBeNull();
      const items = Array.from(overlay().querySelectorAll<HTMLButtonElement>('.sd-action-item'));
      expect(items.map(entry => entry.getAttribute('data-autoid'))).toEqual(filters.map(entry => 't-external-setting-' + entry.field));
      expect(items.map(entry => entry.querySelector('.sd-action-label')?.textContent?.trim())).toEqual(['Name', 'Age', 'Birthday']);
      for (const entry of filters) {
        expect(item(entry.field).querySelector(`[data-autoid$="t-external-setting-${entry.field}-checkbox"]`))
          .withContext(entry.field)
          .not.toBeNull();
      }
      // A required field is always shown, so its entry is locked.
      expect(item('name').disabled).toBeTrue();
      expect(item('age').disabled).toBeFalse();
    });

    it('MM-01 clicking a checkbox row toggles the field and keeps the menu open, like the old menu', () => {
      trigger().click();
      fixture.detectChanges();

      item('birthday').querySelector<HTMLElement>('.sd-external-filter-setting')!.click();
      fixture.detectChanges();
      expect(component.inlineExternal()['birthday']).toBeTrue();
      expect(configuration).toHaveBeenCalledWith({ inlineExternal: { name: true, age: true, birthday: true } });
      expect(overlay().querySelector('.sd-action-popover')).not.toBeNull();

      item('age').querySelector<HTMLElement>('.sd-external-filter-setting')!.click();
      fixture.detectChanges();
      expect(component.inlineExternal()['age']).toBeFalse();
      expect(fixture.nativeElement.querySelector('sd-input-number')).toBeNull();
      expect(fixture.nativeElement.querySelector('sd-date')).not.toBeNull();
    });

    it('MM-01 activating an entry from the keyboard toggles once and closes; a required field never changes', () => {
      trigger().click();
      fixture.detectChanges();
      // Enter / Space on a menu item reach the item button itself, not the checkbox row.
      item('age').click();
      fixture.detectChanges();
      expect(component.inlineExternal()['age']).toBeFalse();
      expect(configuration).toHaveBeenCalledTimes(1);
      expect(overlay().querySelector('.sd-action-popover')).toBeNull();

      component.onCheckboxChange(new Event('click'), filters[0]);
      expect(component.inlineExternal()['name']).toBeTrue();
      expect(configuration).toHaveBeenCalledTimes(1);
    });
  });

  it('opts string, number, date and datetime controls into clearable behavior', () => {
    component.isMobileOrTablet = false;
    const filters = [
      { field: 'name', title: 'Name', type: 'string' as const },
      { field: 'age', title: 'Age', type: 'number' as const },
      { field: 'birthday', title: 'Birthday', type: 'date' as const },
      { field: 'createdAt', title: 'Created at', type: 'datetime' as const },
    ];
    fixture.componentRef.setInput('filter', {});
    fixture.componentRef.setInput('externalFilters', filters);
    component.inlineExternal.set(Object.fromEntries(filters.map(item => [item.field, true])));
    fixture.detectChanges();

    for (const selector of ['sd-input', 'sd-input-number', 'sd-date', 'sd-datetime']) {
      const control = fixture.debugElement.query(By.css(selector));
      expect(control).withContext(`${selector} rendered`).toBeTruthy();
      expect(control.componentInstance.clearable()).withContext(`${selector} opts into clear`).toBeTrue();
    }
  });
});
