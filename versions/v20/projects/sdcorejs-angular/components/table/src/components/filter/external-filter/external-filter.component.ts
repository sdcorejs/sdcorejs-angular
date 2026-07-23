import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, computed, effect, inject, input, signal, untracked } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormGroup } from '@angular/forms';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatMenuModule } from '@angular/material/menu';
import { SdButton } from '@sdcorejs/angular/components/button';
import { SdSection } from '@sdcorejs/angular/components/section';
import { SdCheckbox } from '@sdcorejs/angular/forms/checkbox';
import { SdDate } from '@sdcorejs/angular/forms/date';
import { SdDateRange } from '@sdcorejs/angular/forms/date-range';
import { SdDatetime } from '@sdcorejs/angular/forms/datetime';
import { SdInput } from '@sdcorejs/angular/forms/input';
import { SdInputNumber } from '@sdcorejs/angular/forms/input-number';
import { SdSelect } from '@sdcorejs/angular/forms/select';
import { TranslatePipe } from '@sdcorejs/angular/i18n';
import { BrowserUtilities } from '@sdcorejs/utils/fns';
import { FilterValuesPipe } from '../../../pipes';
import { SdTableExternalFilter, SdTableOptionFilter, TableFilterRegister } from '../../../services/table-filter/table-filter.model';

@Component({
  selector: 'external-filter',
  templateUrl: './external-filter.component.html',
  styleUrl: './external-filter.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    CommonModule,
    MatMenuModule,
    MatCheckboxModule,
    SdSection,
    SdInput,
    SdInputNumber,
    SdSelect,
    SdDate,
    SdDatetime,
    SdDateRange,
    SdButton,
    FilterValuesPipe,
    SdCheckbox,
    TranslatePipe,
  ],
})
export class ExternalFilterComponent {
  // ==========================================
  // 1. SIGNAL INPUTS
  // ==========================================
  autoIdInput = input<string | null | undefined>(undefined, { alias: 'autoId' });
  filter = input<SdTableOptionFilter | undefined>(undefined);
  externalFilters = input<SdTableExternalFilter[] | null | undefined>([]);
  filterRegister = input<TableFilterRegister | undefined>(undefined);

  // ==========================================
  // 2. INJECT
  // ==========================================
  readonly #ref = inject(ChangeDetectorRef);

  // ==========================================
  // 3. STATE (signals)
  // ==========================================
  externalFilter = signal<Record<string, any>>({});
  inlineExternal = signal<Record<string, boolean>>({});
  filtered = signal<boolean>(false);
  isMobileOrTablet = BrowserUtilities.isMobile();
  // FormGroup là instance, parent đọc qua viewChild — giữ readonly field.
  readonly form = new FormGroup({});

  // ==========================================
  // 4. COMPUTED
  // ==========================================
  // autoId base = `<input>-external-` — template ghép tiếp `<field>` cho mỗi control.
  autoId = computed(() => {
    const base = this.autoIdInput();
    return base ? `${base}-external-` : '';
  });

  // Layout column: 4 filter/row → 3 cột; mặc định 6 filter/row → 2 cột.
  col = computed<2 | 3>(() => (this.filter()?.externalFilterPerRow === 4 ? 3 : 2));

  // Normalize externalFilters về mảng (input có thể null/undefined).
  filterItems = computed(() => this.externalFilters() || []);

  constructor() {
    // Subscribe filterRegister observers — re-subscribe khi input đổi, cleanup khi đổi/destroy.
    // QUAN TRỌNG: phải wrap untracked(). Observer có startWith() → emit ĐỒNG BỘ ngay khi
    // subscribe, callback đọc this.externalFilter() (qua #filtered) sẽ bị effect track →
    // externalFilter.set({}) tạo ref mới → effect rerun → resubscribe → loop vô hạn → OOM.
    effect(onCleanup => {
      const register = this.filterRegister();
      if (!register) return;

      untracked(() => {
        const cfgSub = register.configuration.observer.subscribe(cfg => {
          this.inlineExternal.set(cfg.inlineExternal || {});
        });

        const valSub = register.value.observer.subscribe(val => {
          this.externalFilter.set(val.externalFilter || {});
          this.filtered.set(this.#filtered());
        });

        onCleanup(() => {
          cfgSub.unsubscribe();
          valSub.unsubscribe();
        });
      });
    });

    // Khi form values đổi → cập nhật filtered. takeUntilDestroyed() tự lấy DestroyRef từ injection context.
    this.form.valueChanges.pipe(takeUntilDestroyed()).subscribe(() => {
      this.filtered.set(this.#filtered());
      this.#ref.markForCheck();
    });
  }

  // ==========================================
  // 5. HANDLERS
  // ==========================================
  onKeyupEnter = () => {
    this.onSubmit();
  };

  onFilter = (externalFilter: SdTableExternalFilter) => {
    externalFilter?.onChange?.(this.externalFilter()?.[externalFilter.field]);
    // Nếu không phải manual filter thì submit luôn; manual → đợi user bấm nút Search.
    if (!this.filter()?.manualFilter) {
      this.onSubmit();
    }
  };

  onSubmit = () => {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.filterRegister()?.value.set({
      externalFilter: this.externalFilter(),
    });
  };

  // Public API — table.component gọi để commit pending value vào filterRegister mà không trigger reload.
  updateFilter = () => {
    this.filterRegister()?.value.set({
      externalFilter: this.externalFilter(),
      notReload: true,
    });
  };

  clearFilter = (event?: Event) => {
    event?.stopPropagation();
    this.filterRegister()?.value.remove();
    this.filter()?.onClearFilter?.();
  };

  onCheckboxChange = (event: Event, externalFilter: SdTableExternalFilter) => {
    event?.stopPropagation();
    const next = { ...this.inlineExternal() };
    next[externalFilter.field] = !next[externalFilter.field];
    this.inlineExternal.set(next);
    this.filterRegister()?.configuration.set({
      inlineExternal: next,
    });
  };

  // ==========================================
  // 6. INTERNAL
  // ==========================================
  #filtered = (): boolean => {
    return Object.values({ ...this.externalFilter() }).some(val => {
      // Mảng có phần tử → coi như có filter
      if (Array.isArray(val)) return !!val.length;
      // Object (date) có from/to → có filter
      if (val && typeof val === 'object') {
        if ('from' in val && !!val.from) return true;
        if ('to' in val && !!val.to) return true;
        return false;
      }
      return val !== undefined && val !== null && val !== '';
    });
  };
}
