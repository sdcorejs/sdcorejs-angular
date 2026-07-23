import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, input, signal, viewChild } from '@angular/core';
import { SdButton } from '@sdcorejs/angular/components/button';
import { SdSideDrawer } from '@sdcorejs/angular/components/side-drawer';
import { SdDate } from '@sdcorejs/angular/forms/date';
import { SdDateRange } from '@sdcorejs/angular/forms/date-range';
import { SdDatetime } from '@sdcorejs/angular/forms/datetime';
import { SdInput } from '@sdcorejs/angular/forms/input';
import { SdInputNumber } from '@sdcorejs/angular/forms/input-number';
import { SdSelect } from '@sdcorejs/angular/forms/select';
import { TranslatePipe } from '@sdcorejs/angular/i18n';
import { Operator } from '@sdcorejs/utils/models';
import { SdTableFilterDefDirective } from '../../../directives/sd-table-filter-def.directive';
import { SdTableColumn } from '../../../models/table-column.model';
import { FilterValuesPipe } from '../../../pipes';
import { SdTableExternalFilter, SdTableOptionFilter, TableFilterRegister } from '../../../services/table-filter/table-filter.model';
import { ColumnFilterComponent } from '../column-filter/column-filter.component';

/**
 * Mobile-filter — side-drawer chiếm ~90% width thiết bị. Dùng cho table khi
 * render trên màn hình điện thoại (inline filter bị ẩn).
 *
 * Layout (mỗi filter 1 hàng, size='sm'):
 *  1. External filter (render inline — KHÔNG reuse external-filter component
 *     vì component đó dùng grid 2/3 cột + có chọn ẩn/hiện không phù hợp mobile).
 *  2. filterDefs — custom templates do app khai báo qua `[sdTableFilterDef]`.
 *  3. Column filter — 1 column-filter / column.
 *
 * State: local working copy. Cancel = đóng (không ghi). Apply = flush vào
 * filterRegister + đóng.
 */
@Component({
  selector: 'mobile-filter',
  templateUrl: './mobile-filter.component.html',
  styleUrl: './mobile-filter.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    CommonModule,
    SdSideDrawer,
    SdButton,
    ColumnFilterComponent,
    SdInput,
    SdInputNumber,
    SdSelect,
    SdDate,
    SdDatetime,
    SdDateRange,
    FilterValuesPipe,
    TranslatePipe,
  ],
})
export class MobileFilterComponent {
  // ==========================================
  // 1. SIGNAL INPUTS
  // ==========================================
  autoIdInput = input<string | null | undefined>(undefined, { alias: 'autoId' });
  filter = input<SdTableOptionFilter | undefined>(undefined);
  externalFilters = input<SdTableExternalFilter[] | null | undefined>([]);
  columns = input<SdTableColumn[] | null | undefined>([]);
  filterDefs = input<readonly SdTableFilterDefDirective[] | null | undefined>([]);
  filterRegister = input<TableFilterRegister | undefined>(undefined);
  cacheValues = input<Record<string, any[]> | undefined>(undefined);

  // ==========================================
  // 2. VIEW QUERY
  // ==========================================
  drawer = viewChild.required(SdSideDrawer);

  // ==========================================
  // 3. STATE — local working copies; chỉ flush khi Apply.
  // ==========================================
  workingColumnFilter = signal<Record<string, any>>({});
  workingColumnOperator = signal<Record<string, Operator>>({});
  workingExternalFilter = signal<Record<string, any>>({});

  // ==========================================
  // 4. COMPUTED
  // ==========================================
  autoId = computed(() => {
    const base = this.autoIdInput();
    return base ? `${base}-mobile-filter-` : '';
  });

  externalFilterItems = computed(() => this.externalFilters() || []);
  columnItems = computed(() => this.columns() || []);
  filterDefItems = computed(() => this.filterDefs() || []);

  // ==========================================
  // 5. PUBLIC API
  // ==========================================
  open = () => {
    const reg = this.filterRegister();
    const val = reg?.value.get();
    const cloned = (o: any) => (o ? JSON.parse(JSON.stringify(o)) : {});
    this.workingColumnFilter.set(cloned(val?.columnFilter));
    this.workingColumnOperator.set(cloned(val?.columnOperator));
    this.workingExternalFilter.set(cloned(val?.externalFilter));
    this.drawer().open();
  };

  close = () => this.drawer().close();

  // ==========================================
  // 6. HANDLERS
  // ==========================================
  onApply = () => {
    this.filterRegister()?.value.set({
      columnFilter: this.workingColumnFilter(),
      columnOperator: this.workingColumnOperator(),
      externalFilter: this.workingExternalFilter(),
    });
    this.drawer().close();
  };

  onCancel = () => {
    // Local working state — không ghi gì khi cancel, chỉ đóng drawer.
    this.drawer().close();
  };
}
