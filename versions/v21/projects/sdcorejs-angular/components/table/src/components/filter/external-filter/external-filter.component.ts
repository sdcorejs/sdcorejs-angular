/* eslint-disable @typescript-eslint/no-explicit-any */
import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  computed,
  effect,
  inject,
  input,
  signal,
  untracked,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormGroup } from '@angular/forms';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatMenuModule } from '@angular/material/menu';
import { SdButton } from '@sdcorejs/angular/components/button';
import { SdSection } from '@sdcorejs/angular/components/section';
import { SdCheckbox, SdDate, SdDateRange, SdDatetime, SdInput, SdInputNumber, SdSelect } from '@sdcorejs/angular/forms';
import { TranslatePipe } from '@sdcorejs/angular/i18n';
import { BrowserUtilities } from '@sdcorejs/utils/fns';
import { FilterValuesPipe } from '../../../pipes';
import { SdTableExternalFilter, SdTableOptionFilter, TableFilterRegister } from '../../../services/table-filter/table-filter.model';

@Component({
  selector: 'external-filter',
  templateUrl: './external-filter.component.html',
  styleUrls: ['./external-filter.component.scss'],
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
// eslint-disable-next-line @angular-eslint/component-class-suffix
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
  // FormGroup lÃ  instance, parent Ä‘á»c qua viewChild â€” giá»¯ readonly field.
  readonly form = new FormGroup({});

  // ==========================================
  // 4. COMPUTED
  // ==========================================
  // autoId base = `<input>-external-` â€” template ghÃ©p tiáº¿p `<field>` cho má»—i control.
  autoId = computed(() => {
    const base = this.autoIdInput();
    return base ? `${base}-external-` : '';
  });

  // Layout column: 4 filter/row â†’ 3 cá»™t; máº·c Ä‘á»‹nh 6 filter/row â†’ 2 cá»™t.
  col = computed<2 | 3>(() => (this.filter()?.externalFilterPerRow === 4 ? 3 : 2));

  // Normalize externalFilters vá» máº£ng (input cÃ³ thá»ƒ null/undefined).
  filterItems = computed(() => this.externalFilters() || []);

  constructor() {
    // Subscribe filterRegister observers â€” re-subscribe khi input Ä‘á»•i, cleanup khi Ä‘á»•i/destroy.
    // QUAN TRá»ŒNG: pháº£i wrap untracked(). Observer cÃ³ startWith() â†’ emit Äá»’NG Bá»˜ ngay khi
    // subscribe, callback Ä‘á»c this.externalFilter() (qua #filtered) sáº½ bá»‹ effect track â†’
    // externalFilter.set({}) táº¡o ref má»›i â†’ effect rerun â†’ resubscribe â†’ loop vÃ´ háº¡n â†’ OOM.
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

    // Khi form values Ä‘á»•i â†’ cáº­p nháº­t filtered. takeUntilDestroyed() tá»± láº¥y DestroyRef tá»« injection context.
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
    // Náº¿u khÃ´ng pháº£i manual filter thÃ¬ submit luÃ´n; manual â†’ Ä‘á»£i user báº¥m nÃºt Search.
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

  // Public API â€” table.component gá»i Ä‘á»ƒ commit pending value vÃ o filterRegister mÃ  khÃ´ng trigger reload.
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
      // Máº£ng cÃ³ pháº§n tá»­ â†’ coi nhÆ° cÃ³ filter
      if (Array.isArray(val)) return !!val.length;
      // Object (date) cÃ³ from/to â†’ cÃ³ filter
      if (val && typeof val === 'object') {
        if ('from' in val && !!val.from) return true;
        if ('to' in val && !!val.to) return true;
        return false;
      }
      return val !== undefined && val !== null && val !== '';
    });
  };
}

