/* eslint-disable @typescript-eslint/no-explicit-any */
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
  // Parent váº«n truyá»n `value` vÃ o â€” giá»¯ input Ä‘á»ƒ khÃ´ng phÃ¡ há»£p Ä‘á»“ng (template khÃ´ng dÃ¹ng trá»±c tiáº¿p).
  value = input<any>();
  // 2-way bind tá»« parent: parent Ä‘á»c/ghi operator hiá»‡n táº¡i cá»§a column.
  operator = model<Operator | undefined>(undefined);
  // Khi true (mobile context): gÃ¡n column.title vÃ o [label] cá»§a cÃ¡c control con
  // Ä‘á»ƒ parent khÃ´ng pháº£i render <label> riÃªng. Default false (desktop inline).
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

  // Cho phÃ©p parent custom filter qua templateRef (column.filter.filterDef).
  templateRef = computed(() => this.column()?.filter?.filterDef);

  // Label cho control con khi isMobile=true. column.title cÃ³ thá»ƒ lÃ  string hoáº·c { title, templateRef }.
  // Tráº£ undefined khi khÃ´ng pháº£i mobile â†’ control khÃ´ng hiá»ƒn thá»‹ label (giá»¯ behavior desktop cÅ©).
  label = computed<string | undefined>(() => {
    if (!this.isMobile()) return undefined;
    const col = this.column();
    const title = col?.title;
    if (!title) return col?.field;
    return typeof title === 'string' ? title : title.title || col?.field;
  });

  // Danh sÃ¡ch operator hiá»ƒn thá»‹ dá»±a trÃªn column config
  operators = computed(() => {
    const col = this.column();
    if (!col?.filter?.disabled && col?.filter?.operator?.enable) {
      return OPERATORS.filter(e => col.filter?.operator?.list?.includes?.(e.value));
    }
    return [];
  });

  // Chá»‰ cÃ¡c Operator value cho phÃ©p â€” truyá»n vÃ o <sd-operator [operators]>.
  operatorValues = computed(() => this.operators().map(o => o.value));

  // Margin wrapper operator: sá»‘ + Ä‘ang chá»n operator â†’ thÃªm mb-4 (canh baseline vá»›i sd-input-number).
  operatorWrapperClass = computed(() => (this.column()?.type === 'number' && this.operator() ? 'mb-4 mr-2' : 'mr-2'));

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
    // Khá»Ÿi táº¡o default { from: null, to: null } cho split-date / split-number / daterange.
    // Cháº¡y trÆ°á»›c láº§n render Ä‘áº§u nÃªn template tháº¥y giÃ¡ trá»‹ Ä‘Ã£ init â€” khÃ´ng cáº§n markForCheck.
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

  // Blur input: commit giÃ¡ trá»‹ KHÃ”NG trigger reload.
  onFilterCommit = () => this.filterCommit.emit();
}

