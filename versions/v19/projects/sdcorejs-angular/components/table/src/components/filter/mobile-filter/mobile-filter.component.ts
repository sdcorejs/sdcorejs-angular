/* eslint-disable @typescript-eslint/no-explicit-any */
import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, input, signal, viewChild } from '@angular/core';
import { SdButton } from '@sdcorejs/angular/components/button';
import { SdSideDrawer } from '@sdcorejs/angular/components/side-drawer';
import { SdDate, SdDateRange, SdDatetime, SdInput, SdInputNumber, SdSelect } from '@sdcorejs/angular/forms';
import { TranslatePipe } from '@sdcorejs/angular/i18n';
import { Operator } from '@sdcorejs/utils/models';
import { SdTableFilterDefDirective } from '../../../directives/sd-table-filter-def.directive';
import { SdTableColumn } from '../../../models/table-column.model';
import { FilterValuesPipe } from '../../../pipes';
import { SdTableExternalFilter, SdTableOptionFilter, TableFilterRegister } from '../../../services/table-filter/table-filter.model';
import { ColumnFilterComponent } from '../column-filter/column-filter.component';

/**
 * Mobile-filter â€” side-drawer chiáº¿m ~90% width thiáº¿t bá»‹. DÃ¹ng cho table khi
 * render trÃªn mÃ n hÃ¬nh Ä‘iá»‡n thoáº¡i (inline filter bá»‹ áº©n).
 *
 * Layout (má»—i filter 1 hÃ ng, size='sm'):
 *  1. External filter (render inline â€” KHÃ”NG reuse external-filter component
 *     vÃ¬ component Ä‘Ã³ dÃ¹ng grid 2/3 cá»™t + cÃ³ chá»n áº©n/hiá»‡n khÃ´ng phÃ¹ há»£p mobile).
 *  2. filterDefs â€” custom templates do app khai bÃ¡o qua `[sdTableFilterDef]`.
 *  3. Column filter â€” 1 column-filter / column.
 *
 * State: local working copy. Cancel = Ä‘Ã³ng (khÃ´ng ghi). Apply = flush vÃ o
 * filterRegister + Ä‘Ã³ng.
 */
@Component({
  selector: 'mobile-filter',
  templateUrl: './mobile-filter.component.html',
  styleUrls: ['./mobile-filter.component.scss'],
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
  // 3. STATE â€” local working copies; chá»‰ flush khi Apply.
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
    // Local working state â€” khÃ´ng ghi gÃ¬ khi cancel, chá»‰ Ä‘Ã³ng drawer.
    this.drawer().close();
  };
}

