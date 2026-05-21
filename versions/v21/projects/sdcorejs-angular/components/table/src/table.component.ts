import { animate, state, style, transition, trigger } from '@angular/animations';
import {
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  Injectable,
  OnDestroy,
  OnInit,
  TemplateRef,
  computed,
  contentChild,
  contentChildren,
  effect,
  inject,
  input,
  signal,
  untracked,
  viewChild,
} from '@angular/core';
import { MatPaginator, MatPaginatorIntl, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatTable, MatTableModule } from '@angular/material/table';
import { SdExcelColumn, SdNotifyService } from '@sdcorejs/angular/services';
import { Subject, Subscription, firstValueFrom, isObservable } from 'rxjs';
import { debounceTime, map, startWith, switchMap } from 'rxjs/operators';
import * as uuid from 'uuid';
import { SdTabelCellDefDirective } from './directives/sd-table-cell-def.directive';
import { SdMaterialSubInformationDefDirective } from './directives/sd-table-expand-def.directive';
import { SdTableFilterDefDirective } from './directives/sd-table-filter-def.directive';
import { SdMaterialFooterDefDirective } from './directives/sd-table-footer-def.directive';
import { SdTableTitleDefDirective } from './directives/sd-table-title-def.directive';
import { SdTableColumn, SdTableColumnLazyValues, SdTableColumnValues } from './models/table-column.model';
import { SdTableOption } from './models/table-option.model';
import { SdTableFilterRequest, TableFilterRegister } from './services/table-filter/table-filter.model';

import { CdkColumnDef } from '@angular/cdk/table';
import { CdkDrag, CdkDragDrop, CdkDropList, DragDropModule, moveItemInArray } from '@angular/cdk/drag-drop';
import { CommonModule, DatePipe, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatRadioModule } from '@angular/material/radio';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { SdBaseSecureComponent } from '@sdcorejs/angular/components/base';
import { SdButton } from '@sdcorejs/angular/components/button';
import { SdQuickAction } from '@sdcorejs/angular/components/quick-action';
import { SdDesktopDirective, SdHoverCopyDirective, SdScrollDirective } from '@sdcorejs/angular/directives';
import { SdSafeHtmlPipe } from '@sdcorejs/angular/pipes';

// ÄÃƒ THÃŠM: Import SdUtilities Ä‘á»ƒ dÃ¹ng hÃ m getNestedValue
import { SdOperator, SdPagingReq, SdUtilities } from '@sdcorejs/angular/utilities';
import { ArrayUtilities, DateUtilities, NumberUtilities } from '@sdcorejs/angular/utilities/extensions';

import { ColumnFilterComponent, ColumnTitleComponent, ExternalFilterComponent } from './components';
import { ConfigComponent } from './components/config/config.component';
import { DesktopCellComponent } from './components/desktop-cell/desktop-cell.component';
import { SdDesktopCommand } from './components/desktop-command/desktop-command.component';
import { SdPopupExport } from './components/popup-export/popup-export.component';
import { SelectorActionComponent } from './components/selector-action/selector-action.component';
import { DEFAULT_TABLE_CONFIG, ISdTableConfiguration, SD_TABLE_CONFIGURATION } from './configurations';
import { SdColumnResizeDirective, StickyShadowDirective } from './directives';
import { SdTableItem } from './models/table-item.model';
import { ConfiguredTableResult } from './models/table-option-config.model';
import { SdGroupPipe } from './pipes/sd-group.pipe';
import { SdSelectionDisabledPipe } from './pipes/selection-disabled.pipe';
import { SdSelectionVisibleSelectAllPipe } from './pipes/selection-visible-select-all.pipe';
import { SdSelectionVisiblePipe } from './pipes/selection-visible.pipe';
import { SdTableExportContext, TableExportService, TableFormatService } from './services';
import { ConfigService } from './services/config.service';
import { buildColumnWidthMap } from './services/column-width.util';
import { SdTableFilterService } from './services/table-filter/table-filter.service';
import { I18nService, TranslatePipe } from '@sdcorejs/angular/i18n';

@Injectable()
export class MatPaginatorIntlCro extends MatPaginatorIntl {
  // i18n labels resolved at construction. Reads VI/EN from I18nService.
  readonly #i18n = inject(I18nService);
  override firstPageLabel = this.#i18n.t('core.component.table.paginator.first-page');
  override lastPageLabel = this.#i18n.t('core.component.table.paginator.last-page');
  override itemsPerPageLabel = this.#i18n.t('core.component.table.paginator.items-per-page');
  override nextPageLabel = this.#i18n.t('core.component.table.paginator.next-page');
  override previousPageLabel = this.#i18n.t('core.component.table.paginator.previous-page');

  override getRangeLabel = (page: number, pageSize: number, length: number) => {
    if (length === 0 || pageSize === 0) {
      return '';
    }
    const from = page * pageSize + 1;
    const to = from + (length - page * pageSize > pageSize ? pageSize : length - page * pageSize) - 1;
    return `${from}-${to}/${NumberUtilities.toISO(length)}`;
  };
}

@Component({
  selector: 'sd-table',
  templateUrl: './table.component.html',
  styleUrls: ['./table.component.scss', 'table-sticky-shadow.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: [
    trigger('detailExpand', [
      state('collapsed', style({ height: '0', minHeight: '0', visibility: 'hidden' })),
      state('expanded', style({ height: '*', visibility: 'visible' })),
      transition('expanded <=> collapsed', animate('225ms cubic-bezier(0.4, 0.0, 0.2, 1)')),
    ]),
  ],
  providers: [
    DatePipe,
    DecimalPipe,
    CdkColumnDef,
    SdTableFilterService,
    TableFormatService,
    TableExportService,
    ConfigService,
    {
      provide: MatPaginatorIntl,
      useClass: MatPaginatorIntlCro,
    },
  ],
  imports: [
    CommonModule,
    FormsModule,
    MatMenuModule,
    MatPaginatorModule,
    MatIconModule,
    MatTableModule,
    MatSortModule,
    MatProgressSpinnerModule,
    MatCheckboxModule,
    MatRadioModule,
    DragDropModule,
    SdButton,
    SdDesktopCommand,
    DesktopCellComponent,
    ColumnTitleComponent,
    ExternalFilterComponent,
    ConfigComponent,
    ColumnFilterComponent,
    SdGroupPipe,
    SdSelectionVisiblePipe,
    SdSelectionVisibleSelectAllPipe,
    SdSafeHtmlPipe,
    SdSelectionDisabledPipe,
    SdScrollDirective,
    SdDesktopDirective,
    SdHoverCopyDirective,
    SelectorActionComponent,
    StickyShadowDirective,
    SdColumnResizeDirective,
    TranslatePipe,
  ],
})
export class SdTable<T = unknown> extends SdBaseSecureComponent implements OnInit, AfterViewInit, OnDestroy {
  // ... (Giá»¯ nguyÃªn toÃ n bá»™ pháº§n khai bÃ¡o biáº¿n, constructor, lifecycle hooks vÃ  cÃ¡c hÃ m filter, load, export, v.v...)
  // ==========================================
  // 1. SIGNAL INPUTS
  // ==========================================
  autoIdInput = input<string | undefined | null>(undefined, { alias: 'autoId' });
  autoId = computed(() => (this.autoIdInput() ? `components-table-${this.autoIdInput()}` : undefined));
  option = input.required<SdTableOption<T>>();

  // ==========================================
  // 2. SIGNAL QUERIES
  // ==========================================
  table = viewChild(MatTable);
  configComponent = viewChild(ConfigComponent);
  sdPopupExport = viewChild(SdPopupExport);
  scroll = viewChild(SdScrollDirective);
  quickAction = viewChild(SdQuickAction);
  externalFilter = viewChild(ExternalFilterComponent);
  paginator = viewChild(MatPaginator);
  sort = viewChild(MatSort);

  sdSubInformation = contentChild(SdMaterialSubInformationDefDirective);
  sdCellDefs = contentChildren(SdTabelCellDefDirective);
  sdFooterDefs = contentChildren(SdMaterialFooterDefDirective);
  sdFilterDefs = contentChildren(SdTableFilterDefDirective);
  sdTitleDefs = contentChildren(SdTableTitleDefDirective);

  // ==========================================
  // 3. COMPUTED FROM QUERIES
  // ==========================================
  cellDef = computed(() => {
    const map: Record<string, SdTabelCellDefDirective> = {};
    for (const def of this.sdCellDefs()) {
      const field = def.sdTableCellDef();
      if (field) map[field] = def;
    }
    return map;
  });

  footerDef = computed(() => {
    const map: Record<string, SdMaterialFooterDefDirective> = {};
    for (const def of this.sdFooterDefs()) {
      const field = def.sdTableFooterDef();
      if (field) map[field] = def;
    }
    return map;
  });

  hasFooter = computed(() => Object.keys(this.footerDef()).length > 0);

  titleDef = computed(() => {
    const map: Record<string, SdTableTitleDefDirective> = {};
    for (const def of this.sdTitleDefs()) {
      const field = def.sdTableTitleDef();
      if (field) map[field] = def;
    }
    return map;
  });

  // ==========================================
  // 4. SIGNAL STATE
  // ==========================================
  tableOption = signal<SdTableOption<T> | undefined>(undefined);
  configuration = signal<ConfiguredTableResult | undefined>(undefined);

  items = signal<SdTableItem<T>[]>([]);
  selectedTableItems = signal<SdTableItem<T>[]>([]);
  total = signal<number | undefined>(undefined);

  loading = signal(false);
  isSelectAll = signal(false);

  isFiltered = signal(false);
  requireFiltered = signal(false);

  #tableId = uuid.v4();
  filterRegister!: TableFilterRegister;
  key = uuid.v4();

  columnOperator: Record<string, SdOperator> = {};
  columnFilter?: Record<string, any> = {};

  #localItems: SdTableItem<T>[] = [];
  #subscription = new Subscription();
  #reload = new Subject<{ force: boolean }>();
  #loadCompleted = false;

  cacheValues: Record<string, any[]> = {};
  #cacheObjValues: Record<string, Record<string, string>> = {};
  #itemIndexMap = new WeakMap<SdTableItem<T>, number>();

  // 1. Private Services
  #ref = inject(ChangeDetectorRef);
  #configService = inject(ConfigService);
  #gridFilterService = inject(SdTableFilterService);
  #notifyService = inject(SdNotifyService);
  readonly #i18n = inject(I18nService);
  #tableFormatService = inject(TableFormatService);
  #tableExportService = inject(TableExportService);

  // Expose state signals tá»« TableExportService cho template binding.
  exporting = this.#tableExportService.exporting;
  exportTitle = this.#tableExportService.exportTitle;

  // 2. Public & Optional Token
  tableConfiguration = inject<ISdTableConfiguration>(SD_TABLE_CONFIGURATION, { optional: true });

  constructor() {
    super();

    effect(() => {
      const option = this.option();
      if (option) {
        untracked(() => {
          const initOpt = this.#initConfiguration({ ...option });
          this.tableOption.set(initOpt);
          this.#loadCompleted = false;

          const storage = this.#configService.init(initOpt);
          this.#subscription.add(
            storage.observer.pipe(startWith(storage.subject.getValue())).subscribe(() => {
              const configurationResult = this.#configService.loadConfigurationResult(initOpt, storage.get());
              const displayColumns = configurationResult.displayedColumns || [];
              this.#ref.detectChanges();
              this.#tableFormatService
                .loadValues(
                  initOpt.columns.filter(column => displayColumns.includes(column.field)),
                  this.cacheValues,
                  this.#cacheObjValues
                )
                .then(() => {
                  this.configuration.set(configurationResult);
                  this.#loadFilterRegister();
                  if (this.filterRegister) {
                    this.#reload.next({ force: true });
                  }
                })
                .finally(() => {
                  this.#ref.detectChanges();
                });
            })
          );
        });
      }
    });

    effect(() => {
      const paginator = this.paginator();
      if (paginator) {
        untracked(() => {
          this.#subscription.add(paginator.page.subscribe(() => this.#reload.next({ force: false })));
        });
      }
    });

    effect(() => {
      const sort = this.sort();
      if (sort) {
        untracked(() => {
          this.#subscription.add(sort.sortChange.subscribe(() => this.#reload.next({ force: false })));
        });
      }
    });

    effect(() => {
      const items = this.items();
      this.#itemIndexMap = new WeakMap();
      items.forEach((item, idx) => this.#itemIndexMap.set(item, idx));
    });

    this.#subscription.add(
      this.#configService.widthChange$.subscribe(({ field, width }) => {
        // Update configuration signal local â€” KHÃ”NG gá»i loadValues/reload
        const conf = this.configuration();
        if (!conf) return;
        const firstColumns = conf.firstColumns.map(c =>
          c.field === field ? { ...c, width } : c
        );
        const column = { ...conf.column };
        if (column[field]) {
          column[field] = { ...column[field], width };
        }
        const fixedColumn = { ...conf.fixedColumn };
        if (fixedColumn[field]) {
          fixedColumn[field] = { ...fixedColumn[field], width };
        }
        this.configuration.set({ ...conf, firstColumns, column, fixedColumn });
      })
    );
  }

  ngOnInit() {}

  ngAfterViewInit() {
    this.#subscription.add(
      this.#reload
        .pipe(
          debounceTime(200),
          switchMap(async data => {
            const filterInfo = this.getFilterRequest();
            const result = await this.#load(filterInfo, !this.#loadCompleted || data.force);
            this.#loadCompleted = true;
            return result;
          })
        )
        .subscribe(this.#render)
    );
  }

  ngOnDestroy() {
    this.#subscription.unsubscribe();
  }

  // --- GIá»® NGUYÃŠN Táº¤T Cáº¢ CÃC HÃ€M FILTER VÃ€ EXPORT CÅ¨ Cá»¦A Báº N ---
  #filterExportInfo = (pageNumber: number, pageSize: number): SdTableFilterRequest => {
    const { columnOperator, columnFilter, externalFilter } = this.filterRegister.value.get();
    return {
      columnOperator: columnOperator || {},
      rawColumnFilter: columnFilter || {},
      rawExternalFilter: externalFilter || {},
      orderBy: this.sort()?.active || '',
      orderDirection: this.sort()?.direction === 'asc' ? 'ASC' : this.sort()?.direction === 'desc' ? 'DESC' : undefined,
      pageNumber,
      pageSize,
      isExported: true,
    };
  };

  #initConfiguration = (option: SdTableOption): SdTableOption => {
    option.paginate = {
      hidden: option?.paginate?.hidden,
      pageSize: option?.paginate?.pageSize ?? this.tableConfiguration?.paginate?.pageSize ?? DEFAULT_TABLE_CONFIG.paginate?.pageSize,
      pages: option?.paginate?.pages ?? this.tableConfiguration?.paginate?.pages ?? DEFAULT_TABLE_CONFIG.paginate?.pages,
      showFirstLastButtons: option?.paginate?.showFirstLastButtons ?? this.tableConfiguration?.paginate?.showFirstLastButtons ?? false,
      hidePageSize: option?.paginate?.hidePageSize ?? false,
    };
    option.filter = option.filter || {};
    option.filter.hideInlineFilter = option?.filter?.hideInlineFilter ?? this.tableConfiguration?.filter?.hideInlineFilter;
    option.filter.externalFilterPerRow = option?.filter?.externalFilterPerRow ?? this.tableConfiguration?.filter?.externalFilterPerRow;
    option.filter.manualFilter = option?.filter?.manualFilter ?? this.tableConfiguration?.filter?.manualFilter;
    option.filter.hideExternalFilterToolbar =
      option?.filter?.hideExternalFilterToolbar ?? this.tableConfiguration?.filter?.hideExternalFilterToolbar;
    for (const column of option.columns || []) {
      if (column.filter?.operator?.enable) {
        if (!column.filter?.operator?.list?.length) {
          column.filter.operator.list = this.tableConfiguration?.filter?.operator?.list?.[column.type] || [];
        }

        this.columnOperator[column?.field] = this.tableConfiguration?.filter?.operator?.default?.[column.type]!;
        if (column.filter.operator.default && column.filter.operator.list?.some(el => el === column.filter?.operator?.default)) {
          this.columnOperator[column.field] = column.filter.operator.default;
        }
      }
    }
    return option;
  };

  #loadFilterRegister = () => {
    const opt = this.tableOption();
    if (opt && !this.filterRegister) {
      this.filterRegister = this.#gridFilterService.register(opt?.filter, {
        id: this.#tableId,
        columns: opt?.columns,
        externalFilters: opt?.filter?.externalFilters,
        filterDefs: [...this.sdFilterDefs()],
        columnOperator: this.columnOperator,
      });

      this.#subscription.add(
        this.filterRegister.value.observer
          .pipe(
            debounceTime(500),
            map(filterValue => {
              const { columnOperator, columnFilter, notReload } = filterValue;
              this.columnOperator = columnOperator || {};
              this.columnFilter = columnFilter;
              if (!notReload) {
                if (this.paginator()) {
                  this.paginator()!.pageIndex = 0;
                }
                this.#reload.next({ force: false });
              }
            })
          )
          .subscribe()
      );
    }
  };

  #filterLocal = (localItems: SdTableItem<T>[], filterInfo: SdTableFilterRequest) => {
    const opt = this.tableOption()!;
    const { columns } = opt;
    const { rawColumnFilter, orderBy, orderDirection, pageSize, pageNumber } = filterInfo;
    const items = localItems.filter(tableItem => {
      const item = tableItem.data;
      for (const column of columns) {
        const { field, type } = column;
        const filterValue: string = (rawColumnFilter[field] || '').toString().trim().toLowerCase();

        // Sá»¬A: DÃ¹ng getNestedValue Ä‘á»ƒ há»— trá»£ nested field trong filterLocal
        const rawColVal = SdUtilities.getNestedValue(item, field);
        const columnValue: string = (rawColVal || '').toString().trim().toLowerCase();

        if (filterValue) {
          if (!columnValue && type !== 'datetime' && type !== 'date' && type !== 'time') {
            return false;
          }
          if (type === 'string') {
            if (columnValue.indexOf(filterValue) === -1) {
              return false;
            }
          } else if (type === 'values' || type === 'lazy-values') {
            const columnType = column as SdTableColumnValues<T> | SdTableColumnLazyValues<T>;
            const isMultiple = columnType.option.selection === 'MULTIPLE';
            if (isMultiple && Array.isArray(rawColVal)) {
              const columnValues: string[] =
                rawColVal.map((i: any) =>
                  (SdUtilities.getNestedValue(i, columnType.option.valueField) ?? '').toString().trim().toLowerCase()
                ) ?? [];
              const filterValues: string[] = rawColumnFilter[field]?.map((v: any) => (v ?? '').toString().trim().toLowerCase());
              if (filterValues?.length && filterValues.every(fv => !columnValues.includes(fv))) {
                return false;
              }
            } else {
              if (columnValue !== filterValue) {
                return false;
              }
            }
          } else if (type === 'number') {
            const fValue = +filterValue.replace('>=', '').replace('<=', '').replace('>', '').replace('<', '');
            const cValue = +columnValue;
            if (fValue || fValue === 0) {
              if (!cValue && cValue !== 0) {
                return false;
              }
              if (filterValue.indexOf('>=') > -1 && cValue < fValue) {
                return false;
              } else if (filterValue.indexOf('<=') > -1 && cValue > fValue) {
                return false;
              } else if (filterValue.indexOf('<') > -1 && cValue >= fValue) {
                return false;
              } else if (filterValue.indexOf('>') > -1 && cValue <= fValue) {
                return false;
              } else if (cValue !== fValue) {
                return false;
              }
            }
          } else if (type === 'boolean') {
            if ((filterValue === '1' || filterValue === 'true') && columnValue !== '1' && columnValue !== 'true') {
              return false;
            } else if ((filterValue === '0' || filterValue === 'false') && columnValue !== '0' && columnValue !== 'false') {
              return false;
            }
          } else if (type === 'datetime' || type === 'date' || type === 'time') {
            const from = rawColumnFilter[field]?.from ?? rawColumnFilter[field];
            const to = rawColumnFilter[field]?.to ?? rawColumnFilter[field];
            const fromDate = DateUtilities.begin(from);
            const toDate = DateUtilities.end(to);
            if (fromDate || toDate) {
              if (!columnValue) {
                return false;
              }

              const columnTime = new Date(columnValue).getTime();
              const fromDateTime = fromDate?.getTime() || null;
              const toDateTime = toDate?.getTime() || null;

              if (fromDateTime && fromDateTime > columnTime) {
                return false;
              }
              if (toDateTime && columnTime > toDateTime) {
                return false;
              }
            }
          }
        }
      }
      return true;
    });
    // Sort
    if (orderBy && orderDirection) {
      const column = columns.find(e => e.field === orderBy);
      if (column) {
        const { type, field } = column;
        items.sort((tableItemCurrent, tableItemNext) => {
          const data = tableItemCurrent.data;
          const next = tableItemNext.data;
          // Sá»¬A: DÃ¹ng getNestedValue cho sorting
          const dataVal = SdUtilities.getNestedValue(data, field);
          const nextVal = SdUtilities.getNestedValue(next, field);

          if (type === 'number') {
            return (dataVal || 0) - (nextVal || 0);
          }
          if (type === 'date' || type === 'datetime' || type === 'time') {
            const d1 = new Date(dataVal || '').getTime();
            const d2 = new Date(nextVal || '').getTime();
            return d1 - d2;
          }
          const s1 = (dataVal || '').toString();
          const s2 = (nextVal || '').toString();
          if (s1 > s2) {
            return 1;
          }
          if (s1 < s2) {
            return -1;
          }
          return 0;
        });
        if (orderDirection === 'DESC') {
          items.reverse();
        }
      }
    }
    return {
      items: items.filter((item, index) => {
        return index >= pageNumber * pageSize && index < (pageNumber + 1) * pageSize;
      }),
      total: items.length,
    };
  };

  getFilterRequest = (): SdTableFilterRequest => {
    const { columnOperator, columnFilter, externalFilter } = this.filterRegister.value.get();
    return {
      columnOperator: columnOperator || {},
      rawColumnFilter: columnFilter || {},
      rawExternalFilter: externalFilter || {},
      orderBy: this.sort()?.active || '',
      orderDirection: this.sort()?.direction === 'asc' ? 'ASC' : this.sort()?.direction === 'desc' ? 'DESC' : undefined,
      pageNumber: this.paginator()?.pageIndex || 0,
      pageSize: this.paginator()?.pageSize || this.tableOption()?.paginate?.pageSize || 50,
      visibledColumns: ArrayUtilities.union('field', this.configuration()?.firstColumns || [], this.configuration()?.secondColumns || []),
    };
  };

  #isFiltered = (filterReq: SdTableFilterRequest) => {
    const { pageNumber, rawColumnFilter, rawExternalFilter } = filterReq;
    if (pageNumber !== 0) {
      return true;
    }
    if (
      Object.values({ ...rawColumnFilter }).some(val => {
        if (Array.isArray(val)) {
          return !!val.length;
        }
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
    if (
      Object.values({ ...rawExternalFilter }).some(val => {
        if (Array.isArray(val)) {
          return !!val.length;
        }
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

  #checkFilter = (filterReq: SdTableFilterRequest) => {
    this.isFiltered.set(this.#isFiltered(filterReq));
    this.requireFiltered.set(!!this.tableOption()?.filter?.externalFilters?.some(e => e.required));
  };

  #load = async (
    filterReq: SdTableFilterRequest,
    force = true
  ): Promise<{
    items: SdTableItem<T>[];
    total: number;
  }> => {
    this.loading.set(true);
    this.#ref.detectChanges();
    this.#checkFilter(filterReq);

    const opt = this.tableOption()!;
    if (opt.type === 'server') {
      const { items, onFilter } = opt;
      try {
        onFilter?.(filterReq, {
          externalFilterValid: !this.externalFilter()?.form?.invalid,
        });
      } catch (err) {
        console.error(err);
      }
      if (this.externalFilter()?.form?.invalid) {
        this.loading.set(false);
        this.#ref.detectChanges();
        return {
          items: [],
          total: 0,
        };
      }
      const pagingReq = this.#convertPagingReq(filterReq);
      const data = await items(filterReq, pagingReq).catch(err => {
        console.error(err);
        return {
          items: [] as T[],
          total: 0,
        };
      });
      return {
        items: await this.#tableFormatService.format(data?.items, opt.columns, this.cacheValues, this.#cacheObjValues).finally(() => {
          this.loading.set(false);
          this.#ref.detectChanges();
        }),
        total: data?.total || 0,
      };
    }
    if (force) {
      const { items } = opt;
      const results = items();
      let data: T[] = [];
      if (results instanceof Promise) {
        data = await results.catch(err => {
          this.#notifyService.warning(this.#i18n.t('core.component.table.error-occurred'));
          console.error(err);
          return [];
        });
      } else {
        data = results;
      }
      if (!Array.isArray(data)) {
        this.#notifyService.warning(this.#i18n.t('core.component.table.not-an-array'));
        data = [];
      }
      this.#localItems = await this.#tableFormatService.format(data, opt.columns, this.cacheValues, this.#cacheObjValues);
    }
    this.loading.set(false);
    this.#ref.detectChanges();
    return this.#filterLocal(this.#localItems, filterReq);
  };

  #render = async (
    args: { items: SdTableItem<T>[]; total: number },
    scrollTop = true,
    additionArgs?: { fromSource?: 'PAGING' | 'RELOAD' }
  ) => {
    if (scrollTop) {
      this.scroll()?.scrollTop();
    }
    this.items.set(args?.items || []);
    this.total.set(args?.total || 0);

    // Ãp dá»¥ng defaultSelected: pre-select cÃ¡c item thá»a predicate
    const defaultSelected = this.tableOption()?.selector?.defaultSelected;
    if (defaultSelected) {
      this.items().forEach(item => {
        item.meta.selector!.isSelected = defaultSelected(item.data);
      });
    }

    await this.tableOption()?.reload?.onReload?.(this.items(), additionArgs);
    this.isSelectAll.set(this.items().every(e => e.meta.selector?.isSelected));
    this.#updateSelectedItems();

    setTimeout(() => {
      this.table()?.updateStickyColumnStyles();
    }, 0);
  };

  reload = async (force = true, scrollTop = true) => {
    this.externalFilter()?.updateFilter?.();
    const data = await this.#load(this.getFilterRequest(), force);
    this.#render(data, scrollTop, { fromSource: 'RELOAD' });
  };

  #exportedItems = async (pageNumber = 0, pageSize = 100) => {
    const opt = this.tableOption()!;
    if (opt.export?.type === 'default' && opt.export?.items) {
      let result = opt.export?.items(this.#filterExportInfo(pageNumber, pageSize));
      if (Array.isArray(result)) {
        return result;
      }
      if (isObservable(result)) {
        result = firstValueFrom(result) as any;
      }
      if (isObservable(result)) {
        result = firstValueFrom(result) as any;
      }
      return await result;
    } else {
      const filterReq = this.#filterExportInfo(pageNumber, pageSize);
      if (opt.type === 'server') {
        const pagingReq = this.#convertPagingReq(filterReq);
        const result = opt.items(filterReq, pagingReq);
        return await result;
      } else {
        let exportedItems: any[] = [];
        if (typeof opt.items === 'function') {
          const results = opt.items();
          if (results instanceof Promise) {
            exportedItems = await results;
          } else {
            exportedItems = results;
          }
        } else {
          exportedItems = opt.items;
        }
        return this.#filterLocal(exportedItems, filterReq);
      }
    }
  };

  // Helper táº¡o Context truyá»n cho Service
  #createExportContext = (): SdTableExportContext => {
    return {
      option: this.tableOption()!,
      configuration: this.configuration(),
      total: this.total() || 0,
      cacheObjValues: this.#cacheObjValues,
      getFilterInfo: () => this.getFilterRequest(),
      fetchChunk: (pageNumber: number, pageSize: number) => this.#exportedItems(pageNumber, pageSize),
    };
  };

  exportExcel = (columns?: SdExcelColumn[]) => {
    this.#tableExportService.exportExcel(this.#createExportContext(), columns);
  };

  exportCSV = (columns?: SdExcelColumn[]) => {
    this.#tableExportService.exportCSV(this.#createExportContext(), columns);
  };

  exportCustom = () => {
    this.#tableExportService.exportCustom(this.#createExportContext());
  };

  onFilterChange = () => {
    this.externalFilter()?.updateFilter?.();
    this.filterRegister.value.set({
      columnOperator: this.columnOperator || {},
      columnFilter: this.columnFilter,
    });
  };

  onExpand = async (rowData: SdTableItem<T>) => {
    const opt = this.tableOption()!;
    if (opt.expand?.always || rowData.meta.expand?.isExpanding) {
      return;
    }
    if (rowData.meta.expand?.isExpanded) {
      rowData.meta.expand.isExpanded = false;
      return;
    }
    const data = opt.expand?.onExpand?.(rowData.data);
    if (!opt.expand?.multiple) {
      this.items().forEach(item => (item.meta.expand!.isExpanding = item.meta.expand!.isExpanded = false));
    }
    if (data instanceof Promise) {
      rowData.meta.expand!.isExpanding = true;
      data
        .then(res => {
          rowData.meta.expand!.data = res;
          rowData.meta.expand!.isExpanded = true;
        })
        .finally(() => (rowData.meta.expand!.isExpanding = false));
    } else {
      rowData.meta.expand!.data = data;
      rowData.meta.expand!.isExpanded = true;
    }
  };

  onSelect = (rowData: SdTableItem<T>) => {
    const opt = this.tableOption()!;
    if (rowData.meta.group?.items?.length) {
      rowData.meta.group.items.forEach(e => (e.meta.selector!.isSelected = rowData.meta.selector!.isSelected));
      opt.selector?.onSelect?.(
        rowData.data,
        this.items()
          .filter(e => e.meta.selector!.isSelected)
          .map(e => e.data)
      );
      this.isSelectAll.set(this.items().every(e => e.meta.selector!.isSelected));
      this.#updateSelectedItems();
    } else {
      if (opt.selector?.single) {
        this.items()
          .filter(e => e !== rowData)
          .forEach(e => (e.meta.selector!.isSelected = false));
        opt.selector?.onSelect?.(
          rowData.data,
          this.items()
            .filter(e => e.meta.selector!.isSelected)
            .map(e => e.data)
        );
        this.isSelectAll.set(false);
        this.#updateSelectedItems();
        return;
      }
      opt.selector?.onSelect?.(
        rowData.data,
        this.items()
          .filter(e => e.meta.selector!.isSelected)
          .map(e => e.data)
      );
      this.isSelectAll.set(this.items().every(e => e.meta.selector!.isSelected));
      this.#updateSelectedItems();
    }
  };

  onSelectAll = () => {
    const opt = this.tableOption();
    const isSelected = this.isSelectAll();
    this.items()?.forEach(e => {
      if (e.meta.selector!.selectable && (!opt?.selector?.actions?.length || e.meta.selector!.actions?.length)) {
        e.meta.selector!.isSelected = isSelected;
      }
    });
    opt?.selector?.onSelectAll?.(
      this.items()
        .filter(e => e.meta.selector!.isSelected)
        .map(e => e.data)
    );
    this.#updateSelectedItems();
  };

  onClearSelection = (items?: SdTableItem<T>[]) => {
    items = items || this.items();
    this.isSelectAll.set(false);
    items?.forEach(e => (e.meta.selector!.isSelected = false));
    this.#updateSelectedItems();
  };

  #updateSelectedItems = () => {
    this.selectedTableItems.set(this.items().filter(item => item.meta.selector!.isSelected));
    this.#ref.detectChanges();
  };

  clearFilter = () => {
    this.filterRegister.value.remove();
  };

  setFilter = (args: { columnFilter?: Record<string, any>; externalFilter?: Record<string, any> }) => {
    const { columnFilter, externalFilter } = args || {};
    if (columnFilter) {
      this.columnFilter = columnFilter;
    }
    this.filterRegister.value.set({
      columnFilter,
      externalFilter,
    });
  };

  get dataItems(): T[] {
    return this.items().map(item => item.data);
  }

  get selectedItems(): T[] {
    return this.selectedTableItems().map(item => item.data);
  }

  detectChanges = () => this.#ref.detectChanges();

  onColumnResize = (field: string, width: string) => {
    // persistColumnWidth ghi storage (silent) vÃ  emit widthChange$,
    // subscriber trong constructor Ä‘Ã£ update configuration() signal Ä‘á»“ng bá»™.
    this.#configService.persistColumnWidth(field, width);

    const onResize = this.tableOption()?.config?.onResize;
    if (!onResize) return;
    onResize(field, width, buildColumnWidthMap(this.configuration()?.column));
  };

  onOperatorChange = (column: SdTableColumn, operator: SdOperator) => {
    this.tableOption()?.filter?.operatorChange?.(column, operator);
  };

  trackBy = (index: number, item: SdTableItem) => {
    return item.meta.id;
  };

  isReorderDisabled(item: SdTableItem<T>): boolean {
    const opt = this.tableOption()?.rowReorder;
    if (!opt?.disabled || item.meta?.group?.items?.length) return false;
    const idx = this.#itemIndexMap.get(item) ?? -1;
    return opt.disabled(item.data, idx);
  }

  #sameGroup(a: SdTableItem<T>, b: SdTableItem<T>, allItems: SdTableItem<T>[]): boolean {
    const groupOf = (item: SdTableItem<T>): number => {
      let lastGroupIdx = -1;
      for (let i = 0; i < allItems.length; i++) {
        if (allItems[i].meta?.group?.items?.length) lastGroupIdx = i;
        if (allItems[i] === item) return lastGroupIdx;
      }
      return -1;
    };
    return groupOf(a) === groupOf(b);
  }

  reorderSortPredicate = (index: number, drag: CdkDrag<SdTableItem<T>>, drop: CdkDropList<SdTableItem<T>[]>): boolean => {
    const opt = this.tableOption()?.rowReorder;
    if (!opt?.enabled) return false;
    const allItems = drop.data;
    const targetItem = allItems?.[index];
    if (!targetItem) return false;
    if (targetItem.meta?.group?.items?.length) return false;
    if (this.tableOption()?.group) {
      return this.#sameGroup(drag.data, targetItem, allItems);
    }
    return true;
  };

  onReorderDrop(event: CdkDragDrop<SdTableItem<T>[]>): void {
    const { previousIndex, currentIndex } = event;
    if (previousIndex === currentIndex) return;
    const groupedItems = event.container.data;
    const toItemsIndex = (domIdx: number): number => {
      let count = 0;
      for (let i = 0; i < domIdx; i++) {
        if (!groupedItems[i]?.meta?.group?.items?.length) count++;
      }
      return count;
    };
    const fromIdx = toItemsIndex(previousIndex);
    const toIdx = toItemsIndex(currentIndex);
    const current = [...this.items()];
    const localPositions = current.map(item => this.#localItems.indexOf(item));
    moveItemInArray(current, fromIdx, toIdx);
    this.items.set(current);
    if (this.tableOption()?.type === 'local' && localPositions.every(p => p >= 0)) {
      const newLocal = [...this.#localItems];
      current.forEach((item, i) => {
        newLocal[localPositions[i]] = item;
      });
      this.#localItems = newLocal;
    }
    this.table()?.renderRows();
    this.tableOption()?.rowReorder?.onChange?.(
      current.map(i => i.data),
      event.item.data.data,
      fromIdx,
      toIdx
    );
  }

  #convertPagingReq = (filterReq: SdTableFilterRequest): SdPagingReq => {
    const opt = this.tableOption()!;
    const { columns, filter } = opt;
    const externalFilters = filter?.externalFilters || [];
    const req: SdPagingReq = {
      filters: [],
      orders: [],
      pageNumber: filterReq.pageNumber,
      pageSize: filterReq.pageSize,
    };
    const { filters, orders } = req;
    const { rawColumnFilter, columnOperator, rawExternalFilter, orderBy, orderDirection } = filterReq;

    for (const externalFilter of externalFilters || []) {
      const { field } = externalFilter;
      const value = rawExternalFilter?.[field];
      if (value !== undefined && value !== null && value !== '') {
        if (externalFilter.type === 'string') {
          if (externalFilter.defaultOperator === 'EQUAL' && value?.includes(',')) {
            filters!.push({
              field,
              operator: 'IN',
              data: (value as string).split(',').map(val => val.trim()),
            });
          } else {
            filters!.push({
              field,
              operator: externalFilter.defaultOperator || 'CONTAIN',
              data: value,
            });
          }
        } else if (externalFilter.type === 'boolean') {
          filters!.push({
            field,
            operator: 'EQUAL',
            data: value === true || value === 1 || value === 'true' || value === '1',
          });
        } else if (externalFilter.type === 'daterange') {
          if (typeof value === 'object' && 'from' in value && 'to' in value) {
            if (value?.from) {
              filters!.push({
                field,
                operator: 'GREATER_OR_EQUAL',
                data: DateUtilities.begin(value?.from)!.toISOString(),
              });
            }
            if (value?.to) {
              filters!.push({
                field,
                operator: 'LESS_THAN',
                data: DateUtilities.begin(DateUtilities.addDays(value?.to, 1))!.toISOString(),
              });
            }
          }
        } else if (externalFilter.type === 'date' || externalFilter.type === 'datetime') {
          if (DateUtilities.isDate(value)) {
            if (externalFilter.type === 'date') {
              if (externalFilter.defaultOperator === 'GREATER_OR_EQUAL') {
                filters!.push({
                  field,
                  operator: 'GREATER_OR_EQUAL',
                  data: DateUtilities.begin(value)!.toISOString(),
                });
              }
              if (externalFilter.defaultOperator === 'LESS_OR_EQUAL') {
                filters!.push({
                  field,
                  operator: 'LESS_THAN',
                  data: DateUtilities.begin(DateUtilities.addDays(value, 1))!.toISOString(),
                });
              }
            } else {
              if (externalFilter.defaultOperator === 'GREATER_OR_EQUAL') {
                filters!.push({
                  field,
                  operator: 'GREATER_OR_EQUAL',
                  data: new Date(value).toISOString(),
                });
              }
              if (externalFilter.defaultOperator === 'LESS_OR_EQUAL') {
                filters!.push({
                  field,
                  operator: 'LESS_OR_EQUAL',
                  data: new Date(value).toISOString(),
                });
              }
            }
          }
        } else {
          if (Array.isArray(value)) {
            if (value.length) {
              filters!.push({
                field,
                operator: 'IN',
                data: value,
              });
            }
          } else if (typeof value === 'object' && 'from' in value && 'to' in value) {
            if (value?.from) {
              filters!.push({
                field,
                operator: 'GREATER_OR_EQUAL',
                data: DateUtilities.begin(value?.from)!.toISOString(),
              });
            }
            if (value?.to) {
              filters!.push({
                field,
                operator: 'LESS_THAN',
                data: DateUtilities.begin(DateUtilities.addDays(value?.to, 1))!.toISOString(),
              });
            }
          } else {
            filters!.push({
              field,
              operator: externalFilter.defaultOperator || 'EQUAL',
              data: value,
            });
          }
        }
      }
    }

    for (const column of columns || []) {
      const { field } = column;
      const value: any = rawColumnFilter?.[field];
      const operator = columnOperator?.[field] || column.filter?.operator?.default;
      if (value !== undefined && value !== null && value !== '') {
        if (column.type === 'string') {
          filters!.push({
            field: field,
            operator: operator || 'CONTAIN',
            data: value,
          });
        } else if (column.type === 'boolean') {
          filters!.push({
            field: field,
            operator: 'EQUAL',
            data: value === true || value === 1 || value === 'true' || value === '1',
          });
        } else if (column.type === 'date' || column.type === 'datetime') {
          if (value && typeof value === 'object' && 'from' in value && 'to' in value) {
            if (value?.from && value?.to) {
              filters!.push({
                field: field,
                operator: 'BETWEEN',
                data: {
                  from: DateUtilities.begin(value?.from)!.toISOString(),
                  to: DateUtilities.end(value?.to)!.toISOString(),
                },
              });
            } else if (value?.from) {
              filters!.push({
                field: field,
                operator: 'GREATER_OR_EQUAL',
                data: DateUtilities.begin(value?.from)!.toISOString(),
              });
            } else if (value?.to) {
              filters!.push({
                field: field,
                operator: 'LESS_THAN',
                data: DateUtilities.begin(DateUtilities.addDays(value?.to, 1))!.toISOString(),
              });
            }
          } else {
            if (DateUtilities.isDate(value)) {
              filters!.push({
                field: field,
                operator: 'BETWEEN',
                data: {
                  from: DateUtilities.begin(value)!.toISOString(),
                  to: DateUtilities.end(value)!.toISOString(),
                },
              });
            }
          }
        } else {
          if (Array.isArray(value)) {
            if (value.length) {
              filters!.push({
                field: field,
                operator: 'IN',
                data: value,
              });
            }
          } else {
            filters!.push({
              field: field,
              operator: operator || 'EQUAL',
              data: value,
            });
          }
        }
      }
    }

    if (orderBy && orderDirection) {
      orders!.push({
        field: orderBy,
        direction: orderDirection,
      });
    }
    return req;
  };
}

