import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed, fakeAsync, flush, flushMicrotasks, tick } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { SdConfirmService } from '@sdcorejs/angular/services/confirm';
import { SdViewportService } from '@sdcorejs/angular/services/viewport';
import { ConfigComponent } from './components/config/config.component';
import { SdTableOption } from './models/table-option.model';
import { SdTable } from './table.component';

// The settings button of the table footer carries a primary dot while the table uses a setup of its own
// (handoff table-settings, "Đánh dấu nút Thiết lập").

interface Order {
  id: number;
  code: string;
  total: number;
  status: string;
  phone?: string;
}

type LocalOption = Extract<SdTableOption<Order>, { type: 'local' }>;

@Component({
  standalone: true,
  imports: [SdTable],
  template: `<sd-table [option]="option" autoId="orders" />`,
})
class SettingsHost {
  option!: LocalOption;
}

describe('SdTable settings button indicator', () => {
  let fixture: ComponentFixture<SettingsHost>;
  let table: SdTable<Order>;
  let key: string;
  const mobile = signal(false);

  const buildOption = (overrides: Partial<LocalOption> = {}): LocalOption => ({
    type: 'local',
    key,
    items: () => [{ id: 1, code: 'DH-1', total: 100, status: 'new' }],
    config: { visible: true, resizable: true },
    columns: [
      { field: 'code', title: 'Mã đơn', type: 'string', width: '120px' },
      { field: 'total', title: 'Tổng tiền', type: 'number', width: '140px' },
      { field: 'status', title: 'Trạng thái', type: 'string' },
    ],
    filter: {
      externalFilters: [
        { field: 'status', title: 'Trạng thái', type: 'string', defaultShowing: true },
        { field: 'note', title: 'Ghi chú', type: 'string' },
      ],
    },
    ...overrides,
  });

  const configure = (isMobile = false) => {
    mobile.set(isMobile);
    TestBed.configureTestingModule({
      imports: [SettingsHost, NoopAnimationsModule],
      providers: [
        { provide: SdViewportService, useValue: { isMobile: mobile } },
        // why: Khôi phục mặc định hỏi xác nhận trước; spec bấm "đồng ý" ngay.
        { provide: SdConfirmService, useValue: { confirm: () => Promise.resolve() } },
      ],
    });
  };

  const settle = () => {
    fixture.detectChanges();
    tick(900);
    flush();
    fixture.detectChanges();
  };

  const mount = (option: LocalOption) => {
    fixture = TestBed.createComponent(SettingsHost);
    fixture.componentInstance.option = option;
    settle();
    table = fixture.debugElement.query(By.directive(SdTable)).componentInstance;
  };

  const button = (): HTMLButtonElement | null =>
    fixture.nativeElement.querySelector('[data-autoid="components-button-components-table-orders-config"]');
  const indicator = (): HTMLElement | null => button()?.closest('sd-button')?.querySelector('.sd-button__indicator') ?? null;
  const config = (): ConfigComponent => fixture.debugElement.query(By.directive(ConfigComponent)).componentInstance;

  /** Opens the settings modal, applies `edit` to it and presses Apply. */
  const apply = (edit: (component: ConfigComponent) => void = () => undefined) => {
    config().open();
    settle();
    edit(config());
    config().onSave();
    settle();
  };

  const restoreDefaults = () => {
    config().open();
    settle();
    config().onReset();
    flushMicrotasks();
    settle();
  };

  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    localStorage.setItem('sd-core.language', 'vi');
    key = `indicator-spec-${Math.random().toString(36).slice(2)}`;
  });

  afterEach(() => {
    fixture?.destroy();
    document.body.querySelectorAll('.cdk-overlay-container').forEach(el => (el.innerHTML = ''));
    localStorage.clear();
    sessionStorage.clear();
  });

  describe('desktop', () => {
    beforeEach(() => configure());

    it('is off with the default setup', fakeAsync(() => {
      mount(buildOption());
      expect(button()).not.toBeNull();
      expect(indicator()).toBeNull();
      expect(table.hasCustomSetup()).toBe(false);
    }));

    it('stays off after Apply without a change', fakeAsync(() => {
      mount(buildOption());
      apply();
      expect(indicator()).toBeNull();
    }));

    it('turns on after Apply with a change, as a primary dot with a screen-reader label', fakeAsync(() => {
      mount(buildOption());
      apply(component => component.setShown('total', false));
      const dot = indicator();
      expect(dot).not.toBeNull();
      expect(dot!.classList).toContain('sd-button__indicator--dot');
      expect(dot!.getAttribute('data-color')).toBe('primary');
      const label = button()!.closest('sd-button')!.querySelector<HTMLElement>('.sd-button__indicator-label')!;
      expect(label.textContent!.trim()).toBe('Đang dùng thiết lập riêng');
      expect(button()!.getAttribute('aria-describedby')!.split(' ')).toContain(label.id);
    }));

    it('turns on after a column is resized on the table', fakeAsync(() => {
      mount(buildOption());
      table.onColumnResize('code', '260px');
      settle();
      expect(indicator()).not.toBeNull();
    }));

    it('turns on when the inline external filters differ from defaultShowing', fakeAsync(() => {
      mount(buildOption());
      table.filterRegister!.configuration.set({ inlineExternal: { status: true, note: true } });
      settle();
      expect(indicator()).not.toBeNull();
    }));

    it('turns off right after Restore defaults, inline external filters included', fakeAsync(() => {
      mount(buildOption());
      apply(component => component.setTitle('code', 'Mã'));
      table.filterRegister!.configuration.set({ inlineExternal: { status: false, note: true } });
      settle();
      expect(indicator()).not.toBeNull();

      restoreDefaults();
      expect(indicator()).toBeNull();
      expect(table.filterRegister!.configuration.get().inlineExternal).toEqual({ status: true, note: false });
    }));

    it('does not turn on when a column is added to the option', fakeAsync(() => {
      mount(buildOption());
      apply();
      const columns = buildOption().columns;
      fixture.componentInstance.option = buildOption({
        columns: [columns[0], { field: 'phone', title: 'Điện thoại', type: 'string' }, ...columns.slice(1)],
      });
      settle();
      expect(indicator()).toBeNull();
    }));

    it('keeps the dot after a reload when the option has a key', fakeAsync(() => {
      mount(buildOption());
      apply(component => component.setFixed('total', true));
      fixture.destroy();
      mount(buildOption());
      expect(indicator()).not.toBeNull();
    }));

    it('follows the session storage when the option has no key', fakeAsync(() => {
      mount(buildOption({ key: undefined }));
      expect(indicator()).toBeNull();
      table.onColumnResize('total', '200px');
      settle();
      expect(indicator()).not.toBeNull();
    }));
  });

  describe('mobile', () => {
    beforeEach(() => configure(true));

    it('shows no dot on mobile', fakeAsync(() => {
      mount(buildOption());
      table.onColumnResize('code', '260px');
      settle();
      expect(table.hasCustomSetup()).toBe(true);
      expect(indicator()).toBeNull();
    }));
  });
});
