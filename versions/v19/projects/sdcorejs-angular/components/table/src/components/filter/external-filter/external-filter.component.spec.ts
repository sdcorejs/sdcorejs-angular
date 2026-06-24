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
    expect(section.isCollapsible()).toBeFalse();
  });

  it('still maps deprecated filter.collapsable to the inner sd-section', () => {
    fixture.componentRef.setInput('filter', { collapsable: false });
    fixture.componentRef.setInput('externalFilters', [{ field: 'name', title: 'Tên', type: 'string' }]);
    fixture.detectChanges();

    const section = fixture.debugElement.query(By.directive(SdSection)).componentInstance as SdSection;
    expect(section.collapsible()).toBeFalse();
    expect(section.isCollapsible()).toBeFalse();
  });
});
