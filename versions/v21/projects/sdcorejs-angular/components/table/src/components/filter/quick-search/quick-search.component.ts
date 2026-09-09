import { AsyncPipe, NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  isSignal,
  output,
  signal,
  TemplateRef,
  untracked,
} from '@angular/core';
import { MatTooltipModule } from '@angular/material/tooltip';
import { SdViewportService } from '@sdcorejs/angular/services/viewport';
import { SdSelect } from '@sdcorejs/angular/forms/select';
import { SdTranslatePipe } from '@sdcorejs/angular/i18n';
import { SdIcon } from '@sdcorejs/angular/modules/icon';
import { Utilities } from '@sdcorejs/utils/fns';
import { FilterValuesPipe } from '../../../pipes';
import {
  SdTableOptionQuickSearch,
  SdTableQuickSearchFilter,
  SdTableQuickSearchFilterValue,
  SdTableQuickSearchValue,
} from '../../../services/table-filter/table-quick-search.model';
import { quickSearchValid, sameQuickSearchValue } from '../../../services/table-filter/table-quick-search.util';

@Component({
  selector: 'sd-table-quick-search',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [AsyncPipe, NgTemplateOutlet, MatTooltipModule, SdSelect, SdIcon, SdTranslatePipe, FilterValuesPipe],
  templateUrl: './quick-search.component.html',
  styleUrl: './quick-search.component.scss',
})
export class TableQuickSearchComponent {
  readonly option = input.required<SdTableOptionQuickSearch>();
  readonly value = input.required<SdTableQuickSearchValue>();
  readonly autoId = input<string | undefined | null>();
  readonly rightTemplate = input<TemplateRef<unknown> | undefined>();
  readonly valueChange = output<SdTableQuickSearchValue>();
  readonly term = signal('');
  readonly isMobile = inject(SdViewportService).isMobile;
  readonly valid = computed(() => quickSearchValid(this.option(), this.value()));
  readonly controls = computed(() =>
    (this.option().filters || [])
      .filter(item => !(isSignal(item.hidden) ? item.hidden() : item.hidden))
      .map(item => ({ item, disabled: !!(isSignal(item.disabled) ? item.disabled() : item.disabled) }))
  );
  readonly #id = Utilities.generateUuid();
  readonly inputId = computed(() => `${this.autoId() || this.#id}-quick-search-term`);
  #appliedTerm: string | undefined;

  constructor() {
    effect(() => {
      const term = this.value().term;
      // why: đổi dropdown hoặc shared tenant không được submit/xóa phần từ khóa đang gõ dở.
      if (term !== this.#appliedTerm) {
        this.#appliedTerm = term;
        untracked(() => this.term.set(term));
      }
    });
  }

  onInput(event: Event): void {
    this.term.set((event.target as HTMLInputElement).value);
  }

  onKeydown(event: KeyboardEvent): void {
    if (event.key !== 'Enter' || event.isComposing || event.keyCode === 229 || !this.valid()) return;
    event.preventDefault();
    const term = this.term().trim();
    this.term.set(term);
    this.valueChange.emit({ ...this.value(), term });
  }

  clear(input: HTMLInputElement): void {
    this.term.set('');
    this.valueChange.emit({ ...this.value(), term: '' });
    input.focus();
  }

  onFilterChange(item: SdTableQuickSearchFilter, value: SdTableQuickSearchFilterValue): void {
    if (sameQuickSearchValue(this.value().filters[item.field], value)) return;
    this.valueChange.emit({ ...this.value(), filters: { ...this.value().filters, [item.field]: value } });
    item.onChange?.(value);
  }
}
