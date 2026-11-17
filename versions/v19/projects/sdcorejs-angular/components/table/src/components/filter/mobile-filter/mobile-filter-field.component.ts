import { NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  effect,
  inject,
  input,
  isSignal,
  output,
  signal,
  untracked,
} from '@angular/core';
import { SdButton, SdButtonItem } from '@sdcorejs/angular/components/button';
import { ɵSdQueryChipLabels, type SdQueryField } from '@sdcorejs/angular/components/query-bar';
import { ɵsdOperatorResolver } from '@sdcorejs/angular/components/operator';
import { SdCheckbox } from '@sdcorejs/angular/forms/checkbox';
import { SdDate } from '@sdcorejs/angular/forms/date';
import { SdDatetime } from '@sdcorejs/angular/forms/datetime';
import { SdInput } from '@sdcorejs/angular/forms/input';
import { SdInputNumber } from '@sdcorejs/angular/forms/input-number';
import { SdRadio } from '@sdcorejs/angular/forms/radio';
import { I18nService, SdTranslatePipe } from '@sdcorejs/angular/i18n';
import { SdIcon } from '@sdcorejs/angular/modules/icon';
import type { Filter, Operator } from '@sdcorejs/utils/models';
import type { SdTableMobileFilterItem } from '../../../services/table-filter/table-mobile-filter.util';
import type { SdTableQueryContext } from '../../../services/table-filter/table-query-bar.util';
import { sdTableQueryChipOf } from '../../../services/table-filter/table-query-bar.util';
import type { TableFilterValue } from '../../../services/table-filter/table-filter.model';
import { ColumnFilterComponent } from '../column-filter/column-filter.component';

/** Options of a values list shown before a search box appears. */
export const SD_TABLE_MOBILE_OPTIONS_WITHOUT_SEARCH = 8;

const NO_DATA: readonly Operator[] = ['NULL', 'NOT_NULL'];

type FieldKind = 'options' | 'boolean' | 'date-range' | 'number-range' | 'date' | 'datetime' | 'text' | 'number' | 'custom';

interface Option {
  value: unknown;
  label: string;
}

/**
 * Controls of one filter on the phone (handoff table-mobile 4–5): the operator line, then a checkbox or radio list,
 * two date or number boxes, or one box. Edits the working copy in place (`value`) and emits `changed`; filters only
 * their own control can edit (`item.custom`) render that control.
 */
@Component({
  selector: 'sd-table-mobile-filter-field',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    NgTemplateOutlet,
    SdButton,
    SdButtonItem,
    SdCheckbox,
    SdDate,
    SdDatetime,
    SdInput,
    SdInputNumber,
    SdRadio,
    SdIcon,
    SdTranslatePipe,
    ColumnFilterComponent,
  ],
  templateUrl: './mobile-filter-field.component.html',
  styleUrl: './mobile-filter-field.component.scss',
})
export class SdTableMobileFilterFieldComponent {
  readonly item = input.required<SdTableMobileFilterItem>();
  /** Working copy; edited in place. */
  readonly value = input.required<TableFilterValue>();
  readonly ctx = input.required<SdTableQueryContext>();
  /** Bumped by the owner when it changed the working copy (Clear, Clear all). */
  readonly revision = input(0);
  readonly cacheValues = input<Record<string, any[]> | undefined>(undefined);
  readonly labels = input<ɵSdQueryChipLabels>(new ɵSdQueryChipLabels());
  readonly autoId = input<string>();
  readonly changed = output<void>();

  readonly #operators = ɵsdOperatorResolver();
  readonly #i18n = inject(I18nService);
  readonly #local = signal(0);
  readonly search = signal('');
  readonly #loaded = signal<readonly unknown[] | undefined>(undefined);
  readonly #found = signal<readonly unknown[]>([]);
  #searchTimer?: ReturnType<typeof setTimeout>;
  #searchRevision = 0;

  readonly #tick = computed(() => this.revision() + this.#local());
  readonly field = computed<SdQueryField | undefined>(() => this.item().field);
  readonly chip = computed<{ filter: Filter; active: boolean } | undefined>(() => {
    this.#tick();
    const source = this.item().source;
    return source ? sdTableQueryChipOf(source, this.value()) : undefined;
  });
  readonly operator = computed(() => this.chip()?.filter.operator as Operator | undefined);
  readonly operatorItems = computed(() => {
    const operators = this.field()?.operators;
    return this.#operators.items(Array.isArray(operators) ? operators : []);
  });
  readonly operatorLabel = computed(() => this.#operators.label(this.operator()));
  readonly noData = computed(() => NO_DATA.includes(this.operator()!));
  readonly kind = computed<FieldKind>(() => {
    const item = this.item();
    const field = item.field;
    if (item.custom || !field || !item.source) return 'custom';
    if (field.type === 'values' || field.type === 'lazy-values') return 'options';
    if (field.type === 'boolean') return 'boolean';
    if (item.source.shape === 'range') return field.type === 'number' ? 'number-range' : 'date-range';
    if (field.type === 'date') return 'date';
    if (field.type === 'datetime') return 'datetime';
    return field.type === 'number' ? 'number' : 'text';
  });
  readonly multiple = computed(() => this.item().source?.shape === 'multi');
  readonly raw = computed<any>(() => {
    this.#tick();
    return this.#read();
  });

  /** values: the option list (array, signal, or loaded once); lazy-values: the last search, selected values first. */
  readonly options = computed<Option[]>(() => {
    const field = this.field();
    if (field?.type !== 'values' && field?.type !== 'lazy-values') return [];
    const option = (field as any).option;
    const toOption = (item: any): Option => ({ value: item?.[option.valueField], label: String(item?.[option.displayField] ?? '') });
    if (field.type === 'values') {
      const items = Array.isArray(option.items) ? option.items : isSignal(option.items) ? option.items() : this.#loaded();
      return (items ?? []).map(toOption);
    }
    const found = this.#found().map(toOption);
    const labels = this.labels().get(field.key as string);
    const selected = this.#selectedValues()
      .filter(value => !found.some(entry => entry.value === value))
      .map(value => ({ value, label: labels?.get(value) ?? String(value) }));
    return [...selected, ...found];
  });
  readonly showSearch = computed(
    () =>
      this.field()?.type === 'lazy-values' ||
      (this.field()?.type === 'values' && this.options().length > SD_TABLE_MOBILE_OPTIONS_WITHOUT_SEARCH)
  );
  readonly shownOptions = computed(() => {
    const term = this.search().trim().toLocaleLowerCase();
    if (!term || this.field()?.type === 'lazy-values') return this.options();
    return this.options().filter(option => option.label.toLocaleLowerCase().includes(term));
  });
  readonly booleanOptions = computed<Option[]>(() => {
    const field = this.field() as { trueLabel?: string; falseLabel?: string } | undefined;
    const flag = this.item().source?.shape === 'flag';
    return [
      { value: flag ? '1' : true, label: field?.trueLabel ?? this.#i18n.t('core.component.query-bar.boolean.true') },
      { value: flag ? '0' : false, label: field?.falseLabel ?? this.#i18n.t('core.component.query-bar.boolean.false') },
    ];
  });

  constructor() {
    // values with an items function: load once per field; lazy-values: first page, and labels of the selection.
    effect(() => {
      const field = this.field();
      untracked(() => {
        this.#loaded.set(undefined);
        this.#found.set([]);
        this.search.set('');
        if (field?.type === 'values') {
          const items = (field as any).option.items;
          if (typeof items === 'function' && !isSignal(items)) {
            Promise.resolve()
              .then(() => items())
              .then(list => this.field() === field && this.#loaded.set(Array.isArray(list) ? list : []))
              .catch(() => this.#loaded.set([]));
          }
        }
        if (field?.type === 'lazy-values') {
          this.#runSearch('');
          const chip = this.chip();
          if (chip) this.labels().resolve(chip.filter, field);
        }
      });
    });
    inject(DestroyRef).onDestroy(() => clearTimeout(this.#searchTimer));
  }

  onSearch(term: string): void {
    this.search.set(term ?? '');
    if (this.field()?.type !== 'lazy-values') return;
    clearTimeout(this.#searchTimer);
    this.#searchTimer = setTimeout(() => this.#runSearch(this.search()), 300);
  }

  isChecked(value: unknown): boolean {
    return this.#selectedValues().includes(value);
  }

  toggle(value: unknown, checked: unknown): void {
    const current = this.#selectedValues();
    this.setRaw(checked ? [...current.filter(entry => entry !== value), value] : current.filter(entry => entry !== value));
  }

  setRange(end: 'from' | 'to', value: unknown): void {
    const range = this.raw();
    this.setRaw({ from: range?.from ?? null, to: range?.to ?? null, [end]: value ?? null });
  }

  setRaw(raw: unknown): void {
    const item = this.item();
    const value = this.value();
    if (item.source?.source === 'external') (value.externalFilter ??= {})[item.source.field] = raw;
    else if (item.source) (value.columnFilter ??= {})[item.source.field] = raw;
    this.#changed();
  }

  /** Operator menu. `NULL` / `NOT_NULL` clear the value; leaving them restores the column default. */
  setOperator(operator: Operator): void {
    const source = this.item().source;
    if (!source || source.source !== 'column' || source.operatorMode === 'none') return;
    const operators = (this.value().columnOperator ??= {});
    const columns = (this.value().columnFilter ??= {});
    if (NO_DATA.includes(operator)) {
      operators[source.field] = operator;
      columns[source.field] = source.shape === 'range' ? { from: null, to: null } : source.shape === 'multi' ? [] : null;
    } else if (source.operatorMode === 'chip') {
      operators[source.field] = operator;
    } else {
      const fallback = this.ctx().defaultColumnOperator?.[source.field] ?? source.column?.filter?.operator?.default;
      if (fallback && !NO_DATA.includes(fallback)) operators[source.field] = fallback;
      else delete operators[source.field];
    }
    this.#changed();
  }

  /** External date / datetime filter the bar leaves out: the raw value only. */
  setExternal(field: string, raw: unknown): void {
    (this.value().externalFilter ??= {})[field] = raw;
    this.#changed();
  }

  /** Custom controls (column-filter, templates) edit the working copy themselves. */
  onCustomChange(): void {
    this.#changed();
  }

  #selectedValues(): unknown[] {
    this.#tick();
    const raw = this.#read();
    if (Array.isArray(raw)) return raw;
    return raw === null || raw === undefined || raw === '' ? [] : [raw];
  }

  #read(): any {
    const item = this.item();
    const value = this.value();
    if (item.source?.source === 'external') return value.externalFilter?.[item.source.field];
    if (item.source) return value.columnFilter?.[item.source.field];
    return undefined;
  }

  #changed(): void {
    this.#local.update(value => value + 1);
    this.changed.emit();
  }

  #runSearch(term: string): void {
    const field = this.field();
    if (field?.type !== 'lazy-values') return;
    const revision = ++this.#searchRevision;
    Promise.resolve()
      .then(() => (field as any).option.search({ type: 'SEARCH', searchText: term }))
      .then(list => {
        if (revision === this.#searchRevision) this.#found.set(Array.isArray(list) ? list : []);
      })
      .catch(() => {
        if (revision === this.#searchRevision) this.#found.set([]);
      });
  }
}
