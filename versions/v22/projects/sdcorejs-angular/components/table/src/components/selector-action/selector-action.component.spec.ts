import { ChangeDetectionStrategy as SdAngular22ChangeDetectionStrategy } from '@angular/core';
import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { Utilities } from '@sdcorejs/utils/fns';
import { SelectorActionComponent } from './selector-action.component';
import { SdTableItem } from '../../models/table-item.model';
import { SdTableOption } from '../../models/table-option.model';

const DELETE_ACTION = { title: 'Xóa', icon: 'delete', click: () => {} };
const DELETE_KEY = Utilities.hash(DELETE_ACTION);

/** One selected row that is allowed to run `DELETE_ACTION`. */
function selectedRow(actionKeys: string[]): SdTableItem {
  return { data: { id: 1 }, meta: { id: 'r1', display: {}, selector: { actions: actionKeys } } as any } as SdTableItem;
}

@Component({
  changeDetection: SdAngular22ChangeDetectionStrategy.Eager,
  standalone: true,
  imports: [SelectorActionComponent],
  template: `<selector-action [autoId]="autoId()" [tableOption]="opt()" [selectedTableItems]="selected()"></selector-action>`,
})
class HostComponent {
  autoId = signal<string | undefined | null>('components-table-employees');
  opt = signal<SdTableOption>({ type: 'local', items: () => [], columns: [], selector: { actions: [DELETE_ACTION] } } as any);
  // 1 selected row + 1 runnable action → quick-action opened → action bar (incl. clear button) renders.
  selected = signal<SdTableItem[]>([selectedRow([DELETE_KEY])]);
}

describe('SelectorActionComponent autoId propagation', () => {
  let fixture: ComponentFixture<HostComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [HostComponent, NoopAnimationsModule] });
    fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
  });

  it('renders the clear-selection button autoId derived from the table base', () => {
    const btn = fixture.nativeElement.querySelector('[data-autoid="components-button-components-table-employees-clear-selection"]');
    expect(btn).toBeTruthy();
  });

  it('omits the autoId attribute when no base is provided', () => {
    fixture.componentInstance.autoId.set(undefined);
    fixture.detectChanges();
    const anyClear = fixture.nativeElement.querySelector('[data-autoid$="-clear-selection"]');
    expect(anyClear).toBeNull();
  });

  it('rounds the count badge with the same radius as the quick-action bar', () => {
    const bar = fixture.nativeElement.querySelector('.c-quick-action') as HTMLElement;
    const badge = fixture.nativeElement.querySelector('.c-bg-length') as HTMLElement;
    const barStyle = getComputedStyle(bar);
    const badgeStyle = getComputedStyle(badge);

    expect(badgeStyle.borderTopLeftRadius).toBe(barStyle.borderTopLeftRadius);
    expect(badgeStyle.borderBottomLeftRadius).toBe(barStyle.borderBottomLeftRadius);
    // Cạnh phải của badge nằm giữa thanh nên phải vuông.
    expect(badgeStyle.borderTopRightRadius).toBe('0px');
    expect(badgeStyle.borderBottomRightRadius).toBe('0px');
  });
});

// why: trước đây thanh mở ra với BẤT KỲ selection nào, kể cả bảng không khai `selector.actions` —
// khi đó nó chỉ nổi lên để hiện "Đã chọn N" + nút ✕, che nội dung bảng mà không thêm hành động nào.
describe('SelectorActionComponent quick-action gating', () => {
  let fixture: ComponentFixture<HostComponent>;

  function isOpened(): boolean {
    return !!fixture.nativeElement.querySelector('.c-quick-action.active');
  }

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [HostComponent, NoopAnimationsModule] });
    fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
  });

  it('opens the bar when the selection has at least one runnable action', () => {
    expect(isOpened()).toBeTrue();
  });

  it('stays closed when the table declares no selector actions', () => {
    fixture.componentInstance.opt.set({ type: 'local', items: () => [], columns: [] } as any);
    fixture.detectChanges();

    expect(isOpened()).toBeFalse();
  });

  it('stays closed when the selected rows are not allowed to run any declared action', () => {
    fixture.componentInstance.selected.set([selectedRow([])]);
    fixture.detectChanges();

    expect(isOpened()).toBeFalse();
  });

  it('stays closed when nothing is selected', () => {
    fixture.componentInstance.selected.set([]);
    fixture.detectChanges();

    expect(isOpened()).toBeFalse();
  });
});
