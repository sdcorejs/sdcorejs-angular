import { CommonModule } from '@angular/common';
import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  input,
  isSignal,
  model,
  output,
  Signal,
} from '@angular/core';
import { SdBadge } from '@sdcorejs/angular/components/badge';
import { SdOperator } from '@sdcorejs/angular/components/operator';
import { SdDate, SdInput, SdInputNumber, SdSearch, SdSelect } from '@sdcorejs/angular/forms';
import { SdDateRange } from '@sdcorejs/angular/forms/date-range';
import { OPERATORS } from '@sdcorejs/utils/constants';
import { Operator } from '@sdcorejs/utils/models';
import { SdTableColumn } from '../../../models/table-column.model';

@Component({
  selector: 'column-filter',
  templateUrl: './column-filter.component.html',
  styleUrls: ['./column-filter.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [CommonModule, SdOperator, SdInput, SdInputNumber, SdSelect, SdDate, SdDateRange, SdBadge],
})
export class ColumnFilterComponent {
  // ==========================================
  // 1. SIGNAL INPUTS
  // ==========================================
  autoIdInput = input<string | null | undefined>(undefined, { alias: 'autoId' });
  column = input.required<SdTableColumn>();
  columnFilter = input<Record<string, any>>({});
  cacheValues = input<Record<string, any[]> | undefined>(undefined);
  // Parent vẫn truyền `value` vào — giữ input để không phá hợp đồng (template không dùng trực tiếp).
  value = input<any>();
  // 2-way bind từ parent: parent đọc/ghi operator hiện tại của column.
  operator = model<Operator | undefined>(undefined);
  // Khi true (mobile context): gán column.title vào [label] của các control con
  // để parent không phải render <label> riêng. Default false (desktop inline).
  isMobile = input(false, { transform: booleanAttribute });

  // ==========================================
  // 2. SIGNAL OUTPUTS
  // ==========================================
  filterChange = output<void>();
  filterCommit = output<void>();

  // ==========================================
  // 3. COMPUTED
  // ==========================================
  // autoId final = `${base}-inline-${column.field}`
  autoId = computed(() => {
    const base = this.autoIdInput();
    const field = this.column()?.field ?? '';
    return base ? `${base}-inline-${field}` : '';
  });

  // Cho phép parent custom filter qua templateRef (column.filter.filterDef).
  templateRef = computed(() => this.column()?.filter?.filterDef);

  // Label cho control con khi isMobile=true. column.title có thể là string hoặc { title, templateRef }.
  // Trả undefined khi không phải mobile → control không hiển thị label (giữ behavior desktop cũ).
  label = computed<string | undefined>(() => {
    if (!this.isMobile()) return undefined;
    const col = this.column();
    const title = col?.title;
    if (!title) return col?.field;
    return typeof title === 'string' ? title : title.title || col?.field;
  });

  // Danh sách operator hiển thị dựa trên column config
  operators = computed(() => {
    const col = this.column();
    if (!col?.filter?.disabled && col?.filter?.operator?.enable) {
      return OPERATORS.filter(e => col.filter?.operator?.list?.includes?.(e.value));
    }
    return [];
  });

  // Chỉ các Operator value cho phép — truyền vào <sd-operator [operators]>.
  operatorValues = computed(() => this.operators().map(o => o.value));

  // Items cho sd-select khi column type = values / lazy-values
  items = computed<any[] | Signal<any[]> | SdSearch>(() => {
    const col = this.column();
    const cache = this.cacheValues();
    if (col?.type === 'values') {
      const optItems = col.option?.items;
      if (Array.isArray(optItems)) return optItems;
      if (isSignal(optItems)) return optItems as Signal<any[]>;
      return cache?.[col.field] || [];
    }
    if (col?.type === 'lazy-values') {
      return col.option.items;
    }
    return [];
  });

  constructor() {
    // Khởi tạo default { from: null, to: null } cho split-date / split-number / daterange.
    // Chạy trước lần render đầu nên template thấy giá trị đã init — không cần markForCheck.
    effect(() => {
      const col = this.column();
      const filter = this.columnFilter();
      if (!col || !filter) return;
      if (col.type === 'date' || col.type === 'time' || col.type === 'datetime') {
        if (col.filter?.type !== 'date') {
          filter[col.field] = filter[col.field] || { from: null, to: null };
        }
      }
      if (col.type === 'number' && col.filter?.type === 'split-number') {
        filter[col.field] = filter[col.field] || { from: null, to: null };
      }
    });
  }

  // ==========================================
  // 4. HANDLERS
  // ==========================================
  onFilterChange = () => this.filterChange.emit();

  // Blur input: commit giá trị KHÔNG trigger reload.
  onFilterCommit = () => this.filterCommit.emit();
}
