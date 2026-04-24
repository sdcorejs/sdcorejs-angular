/* eslint-disable @angular-eslint/no-input-rename */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { CommonModule } from '@angular/common';
import { AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, OnDestroy } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatMenuModule } from '@angular/material/menu';
import { SdButton } from '@sdcorejs/angular/components/button';
import { SdSection } from '@sdcorejs/angular/components/section';
import { SdCheckbox, SdDate, SdDateRange, SdDatetime, SdInput, SdInputNumber, SdSelect } from '@sdcorejs/angular/forms';
import { SdUtilities } from '@sdcorejs/angular/utilities/extensions';
import { BehaviorSubject, Subscription } from 'rxjs';
import { startWith } from 'rxjs/operators';
import { FilterValuesPipe } from '../../pipes';
import { SdTableExternalFilter, SdTableOptionFilter, TableFilterRegister } from '../../services/table-filter/table-filter.model';

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
  ],
})
// eslint-disable-next-line @angular-eslint/component-class-suffix
export class ExternalFilterComponent implements AfterViewInit, OnDestroy {
  autoId?: string;
  @Input('autoId') set _autoId(val: string | undefined | null) {
    if (val) {
      this.autoId = `${val}-external-`;
    }
  }

  filter?: Readonly<SdTableOptionFilter>;
  col?: 2 | 3 = 2; // 6 filter per row
  externalFilterPerRow: SdTableOptionFilter['externalFilterPerRow'] = 6;
  @Input('filter') set _filter(filter: SdTableOptionFilter) {
    this.filter = filter;
    if (filter?.externalFilterPerRow === 4) {
      this.col = 3; // 4 filter per row
    }
  }
  externalFilters: SdTableExternalFilter[] = [];
  @Input('externalFilters') set _externalFilters(externalFilters: SdTableExternalFilter[]) {
    this.externalFilters = externalFilters || [];
  }
  filterRegister?: TableFilterRegister;
  @Input('filterRegister') set _filterRegister(value: TableFilterRegister) {
    this.filterRegister = value;
    this.filterRegisterChange.next(this.filterRegister);
  }
  form = new FormGroup({});

  filterRegisterChange = new BehaviorSubject<TableFilterRegister | null>(null);

  externalFilter?: Record<string, any> = {};
  inlineExternal: Record<string, boolean> = {};
  isMobileOrTablet: boolean;
  filtered? = false;
  #subscription = new Subscription();

  constructor(private ref: ChangeDetectorRef) {
    this.isMobileOrTablet = SdUtilities.isMobile();
    this.ref.markForCheck();
  }

  ngAfterViewInit() {
    this.#subscription.add(
      this.filterRegisterChange.pipe(startWith(this.filterRegister)).subscribe(() => {
        if (this.filterRegister) {
          this.#subscription.add(
            this.filterRegister.configuration.observer.subscribe(configuration => {
              const { inlineExternal } = configuration;
              this.inlineExternal = inlineExternal || {};
              this.ref.markForCheck();
            })
          );
          this.#subscription.add(
            this.filterRegister.value.observer.subscribe(value => {
              const { externalFilter } = value;
              this.externalFilter = externalFilter;
              this.filtered = this.#filtered();
              this.ref.markForCheck();
            })
          );
        }
      })
    );

    // Khi values cá»§a form thay Ä‘á»•i thÃ¬ cáº­p nháº­t láº¡i filtered
    this.#subscription.add(
      this.form.valueChanges.subscribe(() => {
        this.filtered = this.#filtered();
        this.ref.markForCheck();
      })
    );
  }

  ngOnDestroy() {
    this.#subscription.unsubscribe();
  }

  // Äá»‘i vá»›i input, khi nháº¥n enter sáº½ submit luÃ´n dÃ¹ lÃ  manual filter hay khÃ´ng
  // NhÆ°ng váº«n kiá»ƒm tra form valid má»›i submit
  onKeyupEnter = () => {
    this.onSubmit();
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onFilter = (externalFilter: SdTableExternalFilter) => {
    externalFilter?.onChange?.(this.externalFilter?.[externalFilter.field]);
    // Náº¿u khÃ´ng pháº£i lÃ  manual filter thÃ¬ khÃ´ng cáº­p nháº­t láº¡i giÃ¡ trá»‹ filter mÃ  chá»‰ Ä‘á»£i khi submit
    if (!this.filter?.manualFilter) {
      this.onSubmit();
    }
  };

  onSubmit = () => {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.filterRegister?.value.set({
      externalFilter: this.externalFilter,
    });
  };

  #filtered = (): boolean => {
    if (
      Object.values({ ...this.externalFilter }).some(val => {
        // Náº¿u lÃ  máº£ng vÃ  máº£ng cÃ³ pháº§n tá»­ thÃ¬ xem nhÆ° lÃ  cÃ³ filter
        if (Array.isArray(val)) {
          return !!val.length;
        }
        // Náº¿u lÃ  object (date) vÃ  cÃ³ from/to thÃ¬ xem nhÆ° lÃ  cÃ³ filter
        if (val && typeof val === 'object') {
          if ('from' in val && !!val.from) {
            return true;
          }
          if ('to' in val && !!val.to) {
            return true;
          }
          return false;
        }
        return val !== undefined && val !== null && val !== '';
      })
    ) {
      return true;
    }
    return false;
  };

  updateFilter = () => {
    this.filterRegister?.value.set({
      externalFilter: this.externalFilter,
      notReload: true,
    });
  };

  clearFilter = (event?: Event) => {
    event?.stopPropagation();
    this.filterRegister?.value.remove();
    this.filter?.onClearFilter?.();
  };

  onCheckboxChange = (event: Event, externalFilter: SdTableExternalFilter) => {
    event?.stopPropagation();
    this.inlineExternal[externalFilter.field] = !this.inlineExternal[externalFilter.field];
    this.filterRegister?.configuration.set({
      inlineExternal: { ...this.inlineExternal },
    });
  };
}

