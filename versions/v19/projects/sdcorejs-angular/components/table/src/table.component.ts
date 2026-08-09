import { animate, state, style, transition, trigger } from '@angular/animations';
import {
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  Injectable,
  OnDestroy,
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
import { SdTableCellDefDirective } from './directives/sd-table-cell-def.directive';
import { SdTableExpandDefDirective } from './directives/sd-table-expand-def.directive';
import { SdTableGroupDefDirective, SdTableGroupDefContext } from './directives/sd-table-group-def.directive';
import { SdTableFilterDefDirective } from './directives/sd-table-filter-def.directive';
import { SdMaterialFooterDefDirective } from './directives/sd-table-footer-def.directive';
import { SdTableTitleDefDirective } from './directives/sd-table-title-def.directive';
import { SdTableColumn } from './models/table-column.model';
import { SdTableCommand } from './models/table-command.model';
import { SdTableOption } from './models/table-option.model';
import {
  SdConvertToPagingReq,
  SdTableFilterRequest,
  TableFilterRegister,
  TableFilterValue,
} from './services/table-filter/table-filter.model';

import { CdkColumnDef } from '@angular/cdk/table';
import { CdkDrag, CdkDragDrop, CdkDropList, DragDropModule } from '@angular/cdk/drag-drop';
import { CommonModule, DatePipe, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatRadioModule } from '@angular/material/radio';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { SdButton } from '@sdcorejs/angular/components/button';
import { SdQuickAction } from '@sdcorejs/angular/components/quick-action';
import { SdDesktopDirective, SdHoverCopyDirective, SdMobileDirective, SdScrollDirective } from '@sdcorejs/angular/directives';
import { SdSafeHtmlPipe } from '@sdcorejs/angular/pipes';

import { Operator } from '@sdcorejs/utils/models';
import { Utilities } from '@sdcorejs/utils/fns';
import { ArrayUtilities, NumberUtilities } from '@sdcorejs/angular/utilities/extensions';

import { ColumnFilterComponent, ColumnTitleComponent, ExternalFilterComponent, MobileFilterComponent } from './components';
import { ConfigComponent } from './components/config/config.component';
import { DesktopCellComponent } from './components/desktop-cell/desktop-cell.component';
import { DesktopCommand } from './components/command/desktop-command.component';
import { SdPopupExport } from './components/popup-export/popup-export.component';
import { SelectorActionComponent } from './components/selector-action/selector-action.component';
import { DEFAULT_TABLE_CONFIG, ISdTableConfiguration, SD_TABLE_CONFIGURATION } from './configurations';
import { SdColumnResizeDirective, StickyShadowDirective } from './directives';
import { SdTableItem } from './models/table-item.model';
import { ConfiguredTableResult } from './models/table-option-config.model';
import { SdGroupPipe } from './pipes/sd-group.pipe';
import { SdTreePipe } from './pipes/sd-tree.pipe';
import { SdSelectionDisabledPipe } from './pipes/selection-disabled.pipe';
import { SdSelectionVisiblePipe } from './pipes/selection-visible.pipe';
import { SdTableExportContext, TableExportService, TableFormatService } from './services';
import { ConfigService } from './services/config.service';
import { buildColumnWidthMap } from './services/column-width.util';
import { filterLocalItems } from './services/table-local/table-local.util';
import { canSortReorder, isReorderDisabled as isReorderItemDisabled, reorderTableItems } from './services/table-reorder/table-reorder.util';
import {
  applyDefaultSelected,
  buildGroupHeaderContext,
  getSelectedRowData,
  getSelectionRows,
  resolveSelectAllState,
  restorePreservedSelection,
  SdGroupHeaderHost,
  syncGroupSelectionMeta,
  syncPreservedSelection,
} from './services/table-selection/table-selection.util';
import { resolveSelectAllVisible } from './services/table-selection/selection-action.util';
import { SdTableFilterService } from './services/table-filter/table-filter.service';
import {
  clearTreeChildCache,
  collectFormattedTreeRows,
  flattenDataTree,
  getChildrenFromData,
  getChildrenKey,
  getVisibleChildrenData,
  hasLazyChildren,
  initTreeMeta,
  isLazyTree,
  resolveHasChildren,
  saveTreeExpandState,
} from './services/tree/tree.util';
import { I18nService, TranslatePipe } from '@sdcorejs/angular/i18n';
import { SdIcon } from '@sdcorejs/angular/modules/icon';

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

/** Mảng rỗng dùng chung — tránh cấp phát `[]` mới trong binding mỗi CD pass. */
const EMPTY_COMMANDS: SdTableCommand[] = [];

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
  host: {
    '[attr.data-autoid]': 'autoId()',
    '[attr.data-loading]': 'loading() ? "true" : "false"',
  },
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
    SdIcon,
    CommonModule,
    FormsModule,
    MatMenuModule,
    MatPaginatorModule,
    MatTableModule,
    MatSortModule,
    MatProgressSpinnerModule,
    MatCheckboxModule,
    MatRadioModule,
    DragDropModule,
    SdButton,
    DesktopCommand,
    DesktopCellComponent,
    ColumnTitleComponent,
    ExternalFilterComponent,
    ConfigComponent,
    ColumnFilterComponent,
    MobileFilterComponent,
    SdGroupPipe,
    SdTreePipe,
    SdSelectionVisiblePipe,
    SdSafeHtmlPipe,
    SdSelectionDisabledPipe,
    SdScrollDirective,
    SdDesktopDirective,
    SdMobileDirective,
    SdHoverCopyDirective,
    SelectorActionComponent,
    StickyShadowDirective,
    SdColumnResizeDirective,
    TranslatePipe,
  ],
})
export class SdTable<T = unknown> implements AfterViewInit, OnDestroy {
  // ... (Giữ nguyên toàn bộ phần khai báo biến, constructor, lifecycle hooks và các hàm filter, load, export, v.v...)
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
  mobileFilter = viewChild(MobileFilterComponent);
  paginator = viewChild(MatPaginator);
  sort = viewChild(MatSort);

  sdSubInformation = contentChild(SdTableExpandDefDirective);
  sdGroupDef = contentChild(SdTableGroupDefDirective);
  sdCellDefs = contentChildren(SdTableCellDefDirective);
  sdFooterDefs = contentChildren(SdMaterialFooterDefDirective);
  sdFilterDefs = contentChildren(SdTableFilterDefDirective);
  sdTitleDefs = contentChildren(SdTableTitleDefDirective);

  // ==========================================
  // 3. COMPUTED FROM QUERIES
  // ==========================================
  cellDef = computed(() => {
    const map: Record<string, SdTableCellDefDirective> = {};
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

  /**
   * Checkbox "chọn tất cả" ở header có hiển thị không.
   *
   * why: trước đây là `_items | selectionVisibleSelectAll: … | async` — pipe `async`
   * với `await setTimeout(500)` bên trong. Sleep đó CHE một vấn đề thứ tự
   * change-detection: pipe đọc `meta.selector.actions`, mảng chỉ được `SdSelectionVisiblePipe`
   * ghi khi cell BODY render, mà CDK dựng header TRƯỚC body → pass đầu luôn đọc ra rỗng.
   * Hệ quả: checkbox hiện trễ 500ms, và vì `transform` là `async` nên MỖI lần re-eval lại
   * trả một Promise mới + đặt thêm một timer không ai dọn. Computed tự tính từ
   * `items()` + `selector` nên không phụ thuộc pipe nào chạy trước → bỏ hẳn timer.
   */
  visibleSelectAll = computed(() => resolveSelectAllVisible(this.items(), this.tableOption()?.selector));

  /**
   * Danh sách command của row, memoize theo option.
   * why: template cũ bind `_tableOption.command?.commands || _tableOption.commands || []`
   * — nhánh `[]` cấp phát mảng MỚI mỗi CD pass và đẩy vào `input()` của `desktop-command`,
   * làm child OnPush bị đánh dấu dirty mỗi pass cho từng dòng.
   */
  rowCommands = computed(() => {
    const opt = this.tableOption();
    return opt?.command?.commands || opt?.commands || EMPTY_COMMANDS;
  });

  isFiltered = signal(false);
  requireFiltered = signal(false);

  #tableId = Utilities.generateUuid();
  filterRegister!: TableFilterRegister;
  key = Utilities.generateUuid();

  columnOperator: Record<string, Operator> = {};
  columnFilter?: NonNullable<TableFilterValue['columnFilter']> = {};

  #localItems: SdTableItem<T>[] = [];
  #subscription = new Subscription();
  #configurationSubscription?: Subscription;
  #filterRegisterSubscription?: Subscription;
  #optionInstance?: SdTableOption<T>;
  #optionRevision = 0;
  #reload = new Subject<{ force: boolean; revision: number }>();
  #loadCompleted = false;

  cacheValues: Record<string, unknown[]> = {};
  #cacheObjValues: Record<string, Record<string, string>> = {};
  #itemIndexMap = new WeakMap<SdTableItem<T>, number>();
  #treeExpandState = new Map<string, boolean>();
  treeRevision = signal(0);
  // Search ở cấp con (static tree + type 'local'): predicate khớp 1 dòng theo
  // column filter hiện hành. Set ở #filterLocal khi có filter active, đọc lại ở
  // #render/#ensureChildItemsFormatted dùng predicate này để prune + auto-expand các
  // nhánh có node con khớp. undefined = không search → cây render bình thường.
  #treeSearchPredicate?: (data: T) => boolean;
  // Lần render trước có đang ở chế độ search hay không (để xử lý chuyển trạng thái).
  #treeSearchActive = false;

  // 1. Private Services
  #ref = inject(ChangeDetectorRef);
  #configService = inject(ConfigService);
  #gridFilterService = inject(SdTableFilterService);
  #notifyService = inject(SdNotifyService);
  readonly #i18n = inject(I18nService);
  #tableFormatService = inject(TableFormatService);
  #tableExportService = inject(TableExportService);

  // Expose state signals từ TableExportService cho template binding.
  exporting = this.#tableExportService.exporting;
  exportTitle = this.#tableExportService.exportTitle;

  // 2. Public & Optional Token
  tableConfiguration = inject<ISdTableConfiguration>(SD_TABLE_CONFIGURATION, { optional: true });

  constructor() {
    effect(() => {
      const option = this.option();
      if (option) {
        untracked(() => {
          if (this.#optionInstance !== option) {
            this.#optionInstance = option;
            this.#resetStateForNewOption();
          }
          const optionRevision = this.#optionRevision;
          const initOpt = this.#initConfiguration({ ...option });
          this.tableOption.set(initOpt);
          this.#loadCompleted = false;

          const storage = this.#configService.init(initOpt);
          this.#configurationSubscription?.unsubscribe();
          this.#configurationSubscription = storage.observer.pipe(startWith(storage.subject.getValue())).subscribe(() => {
            if (optionRevision !== this.#optionRevision) return;
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
                if (optionRevision !== this.#optionRevision) return;
                this.configuration.set(configurationResult);
                this.#loadFilterRegister();
                if (this.filterRegister) {
                  this.#requestReload(true);
                }
              })
              .finally(() => {
                if (optionRevision !== this.#optionRevision) return;
                this.#ref.detectChanges();
              });
          });
          this.#subscription.add(this.#configurationSubscription);
        });
      }
    });

    effect(() => {
      const paginator = this.paginator();
      if (paginator) {
        untracked(() => {
          this.#subscription.add(paginator.page.subscribe(() => this.#requestReload(false)));
        });
      }
    });

    effect(() => {
      const sort = this.sort();
      if (sort) {
        untracked(() => {
          this.#subscription.add(sort.sortChange.subscribe(() => this.#requestReload(false)));
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
        // Update configuration signal local — KHÔNG gọi loadValues/reload
        const conf = this.configuration();
        if (!conf) return;
        const firstColumns = conf.firstColumns.map(c => (c.field === field ? { ...c, width } : c));
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

  ngAfterViewInit() {
    this.#subscription.add(
      this.#reload
        .pipe(
          debounceTime(200),
          switchMap(async data => {
            if (data.revision !== this.#optionRevision || !this.filterRegister) return undefined;
            const filterInfo = this.getFilterRequest();
            const result = await this.#load(filterInfo, !this.#loadCompleted || data.force);
            if (data.revision !== this.#optionRevision) return undefined;
            this.#loadCompleted = true;
            return {
              result,
              revision: data.revision,
            };
          })
        )
        .subscribe(loadResult => {
          if (!loadResult || loadResult.revision !== this.#optionRevision) return;
          this.#render(loadResult.result);
        })
    );
  }

  ngOnDestroy() {
    this.#subscription.unsubscribe();
  }

  // --- GIỮ NGUYÊN TẤT CẢ CÁC HÀM FILTER VÀ EXPORT CŨ CỦA BẠN ---
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

  #requestReload = (force: boolean) => {
    this.#reload.next({ force, revision: this.#optionRevision });
  };

  #resetStateForNewOption = () => {
    this.#optionRevision += 1;
    this.#configurationSubscription?.unsubscribe();
    this.#configurationSubscription = undefined;
    this.#filterRegisterSubscription?.unsubscribe();
    this.#filterRegisterSubscription = undefined;
    this.filterRegister = undefined!;

    this.#tableId = Utilities.generateUuid();
    this.key = Utilities.generateUuid();
    this.#loadCompleted = false;

    this.tableOption.set(undefined);
    this.configuration.set(undefined);
    this.items.set([]);
    this.selectedTableItems.set([]);
    this.total.set(undefined);
    this.loading.set(false);
    this.isSelectAll.set(false);
    this.isFiltered.set(false);
    this.requireFiltered.set(false);

    this.columnOperator = {};
    this.#syncColumnFilterInPlace({});
    this.#localItems = [];
    this.cacheValues = {};
    this.#cacheObjValues = {};
    this.#itemIndexMap = new WeakMap();
    this.#treeExpandState.clear();
    this.#treeSearchPredicate = undefined;
    this.#treeSearchActive = false;
    this.groupExpandState.clear();
    this.#preservedSelectedMap.clear();
    this.treeRevision.update(n => n + 1);

    if (this.paginator()) {
      this.paginator()!.pageIndex = 0;
    }
    const sort = this.sort();
    if (sort) {
      sort.active = '';
      sort.direction = '';
    }
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

        const defaultOperator = this.tableConfiguration?.filter?.operator?.default?.[column.type];
        if (defaultOperator) {
          this.columnOperator[column.field] = defaultOperator;
        }
        if (column.filter.operator.default && column.filter.operator.list?.some(el => el === column.filter?.operator?.default)) {
          this.columnOperator[column.field] = column.filter.operator.default;
        }
      }
    }
    return option;
  };

  #loadFilterRegister = () => {
    const opt = this.tableOption();
    if (!opt || this.filterRegister) return;

    this.filterRegister = this.#gridFilterService.register(opt?.filter, {
      id: this.#tableId,
      columns: opt?.columns,
      externalFilters: opt?.filter?.externalFilters,
      filterDefs: [...this.sdFilterDefs()],
      columnOperator: this.columnOperator,
      force: true,
    });

    const { columnOperator, columnFilter } = this.filterRegister.value.get();
    this.columnOperator = columnOperator || {};
    this.#syncColumnFilterInPlace(columnFilter || {});

    this.#filterRegisterSubscription?.unsubscribe();
    this.#filterRegisterSubscription = this.filterRegister.value.observer
      .pipe(
        debounceTime(500),
        map(filterValue => {
          const { columnOperator, columnFilter, notReload } = filterValue;
          this.columnOperator = columnOperator || {};
          // Sync IN PLACE — không gán object clone mới. column-filter chia sẻ
          // reference this.columnFilter qua [columnFilter] input; nếu gán clone
          // mới, cf giữ ref cũ (do OnPush + reload async lag) → ghi clear vào
          // object orphan → giá trị cũ persist. Giữ ref ổn định để cf + table
          // luôn trỏ cùng 1 object.
          this.#syncColumnFilterInPlace(columnFilter || {});
          if (!notReload) {
            if (this.paginator()) {
              this.paginator()!.pageIndex = 0;
            }
            this.#requestReload(false);
          }
        })
      )
      .subscribe();
    this.#subscription.add(this.#filterRegisterSubscription);
  };

  // Đồng bộ this.columnFilter với `next` mà GIỮ NGUYÊN reference object.
  // column-filter chia sẻ ref này qua [columnFilter] — reassign clone mới sẽ
  // orphan ref cũ (cf vẫn ghi vào đó do CD lag) khiến clear/giá trị stale.
  #syncColumnFilterInPlace = (next: NonNullable<TableFilterValue['columnFilter']>) => {
    const cur = this.columnFilter ?? (this.columnFilter = {});
    if (cur === next) return;
    for (const key of Object.keys(cur)) {
      if (!(key in next)) delete cur[key];
    }
    Object.assign(cur, next);
  };

  #filterLocal = <TItem extends SdTableItem<T> | T>(localItems: TItem[], filterInfo: SdTableFilterRequest<T>) => {
    const result = filterLocalItems(localItems, this.tableOption()!, filterInfo);
    this.#treeSearchPredicate = result.treeSearchPredicate;
    return {
      items: result.items,
      total: result.total,
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
      const pagingReq = SdConvertToPagingReq(filterReq, {
        columns: opt.columns,
        externalFilters: opt.filter?.externalFilters,
      });
      const data = await items(filterReq, pagingReq).catch(err => {
        console.error(err);
        return {
          items: [] as T[],
          total: 0,
        };
      });
      return {
        items: await this.#tableFormatService
          .format(data?.items, opt.columns, this.cacheValues, this.#cacheObjValues, opt.rowKey)
          .finally(() => {
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
      this.#localItems = await this.#tableFormatService.format(data, opt.columns, this.cacheValues, this.#cacheObjValues, opt.rowKey);
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

    const treeOpt = this.tableOption()?.tree;
    const searchNow = !!this.#treeSearchPredicate;
    if (treeOpt) {
      // why: KHÔNG persist trạng thái bung bị ÉP trong lúc search (tránh nhánh
      // tự bung do search bị ghi nhầm thành lựa chọn của user sau khi clear).
      if (!this.#treeSearchActive) {
        saveTreeExpandState(this.items(), this.#treeExpandState);
      }
      // why: search vừa tắt → childItems đang là tập đã prune theo từ khoá cũ;
      // xoá cache để dựng lại đầy đủ children ở chế độ thường.
      if (this.#treeSearchActive && !searchNow) {
        clearTreeChildCache(this.#localItems);
      }
    }

    this.items.set(args?.items || []);
    this.total.set(args?.total || 0);

    if (treeOpt) {
      initTreeMeta(this.items(), treeOpt, {
        expandState: this.#treeExpandState,
        treeSearchPredicate: this.#treeSearchPredicate,
      });
      await this.#expandDefaultBranches(this.items(), treeOpt);
      this.treeRevision.update(n => n + 1);
    }
    this.#treeSearchActive = searchNow;

    // Restore selection từ preservedSelectedMap (chỉ khi preserveSelection bật).
    // Phải chạy TRƯỚC applyDefaultSelected để user-selection ưu tiên hơn default.
    this.#restorePreservedSelection();

    // Áp dụng defaultSelected: pre-select các item thỏa predicate
    this.#applyDefaultSelected();

    // Resolve style.rowCss 1 lần/row cho lần render này (xem #applyRowStyles).
    this.#applyRowStyles();

    await this.tableOption()?.reload?.onReload?.(this.items(), additionArgs);
    this.#updateSelectedItems();
    this.#syncSelectAllState();

    setTimeout(() => {
      this.table()?.updateStickyColumnStyles();
    }, 0);
  };

  reload = async (force = true, scrollTop = true) => {
    this.externalFilter()?.updateFilter?.();
    // Commit pending column filter value (input/input-number gõ dở chưa enter/blur)
    // vào filterRegister trước khi đọc filter request — tránh storage stale.
    this.filterRegister?.value.set({
      columnOperator: this.columnOperator || {},
      columnFilter: this.columnFilter,
      notReload: true,
    });
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
        result = firstValueFrom(result) as typeof result;
      }
      if (isObservable(result)) {
        result = firstValueFrom(result) as typeof result;
      }
      return await result;
    } else {
      const filterReq = this.#filterExportInfo(pageNumber, pageSize);
      if (opt.type === 'server') {
        const pagingReq = SdConvertToPagingReq(filterReq, {
          columns: opt.columns,
          externalFilters: opt.filter?.externalFilters,
        });
        const result = opt.items(filterReq, pagingReq);
        return await result;
      } else {
        let exportedItems: T[] = [];
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
        if (opt.tree) {
          exportedItems = flattenDataTree(exportedItems, opt.tree);
        }
        return this.#filterLocal(exportedItems, filterReq);
      }
    }
  };

  // Helper tạo Context truyền cho Service
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

  #ensureChildItemsFormatted = async (row: SdTableItem<T>) => {
    const opt = this.tableOption()!;
    const treeOpt = opt.tree!;
    const searchActive = !!this.#treeSearchPredicate;
    // Bình thường cache childItems. Khi search, LUÔN dựng lại theo tập đã prune
    // vì tập này phụ thuộc từ khoá (đổi mỗi lần gõ) nên không thể cache.
    if (!searchActive && row.meta.tree?.childItems?.length) return;
    const raw = getVisibleChildrenData(row.data, treeOpt, this.#treeSearchPredicate);
    if (!raw.length) {
      if (searchActive && row.meta.tree) row.meta.tree.childItems = [];
      return;
    }
    const formatted = await this.#tableFormatService.format(raw, opt.columns, this.cacheValues, this.#cacheObjValues, opt.rowKey);
    row.meta.tree!.childItems = formatted;
    initTreeMeta(formatted, treeOpt, {
      level: (row.meta.tree!.level ?? 0) + 1,
      parentId: row.meta.id,
      expandState: this.#treeExpandState,
      treeSearchPredicate: this.#treeSearchPredicate,
    });
  };

  #expandDefaultBranches = async (rows: SdTableItem<T>[], option: NonNullable<SdTableOption<T>['tree']>) => {
    const maxDepth = option.maxDepth;
    for (const row of rows) {
      if (!row.meta.tree?.isExpanded || !row.meta.tree.hasChildren) continue;
      const level = row.meta.tree.level ?? 0;
      const depthOk = maxDepth === undefined || level < maxDepth;
      if (!depthOk) continue;
      await this.#ensureChildItemsFormatted(row);
      const children = row.meta.tree.childItems ?? [];
      if (children.length) {
        await this.#expandDefaultBranches(children, option);
      }
    }
  };

  onTreeToggle = async (row: SdTableItem<T>) => {
    const treeOpt = this.tableOption()?.tree;
    if (!treeOpt || !row.meta.tree?.hasChildren || row.meta.tree.isExpanding) return;

    if (row.meta.tree.isExpanded) {
      row.meta.tree.isExpanded = false;
      this.#treeExpandState.delete(row.meta.id);
      // why: `rowCss` nhận ctx `{ level, hasChildren, isExpanded }`, nên style của row PHẢI được
      // tính lại khi collapse — không chỉ khi expand. Thiếu dòng này thì `meta.rowStyle` giữ mãi
      // style của trạng thái đang mở.
      this.#applyRowStyles();
      this.treeRevision.update(n => n + 1);
      this.#ref.markForCheck();
      return;
    }

    try {
      // isLazyTree() narrow treeOpt về TableOptionTreeLazy → truy cập onExpandChildren an toàn.
      if (isLazyTree(treeOpt) && hasLazyChildren(row, treeOpt)) {
        row.meta.tree.isExpanding = true;
        this.#ref.markForCheck();
        const key = getChildrenKey(treeOpt);
        const result = await Promise.resolve(treeOpt.onExpandChildren(row.data));
        (row.data as Record<string, unknown>)[key] = Array.isArray(result) ? result : [];
        row.meta.tree.hasChildren = resolveHasChildren(row, treeOpt);
      }
      await this.#ensureChildItemsFormatted(row);
      if (!row.meta.tree.childItems?.length && getChildrenFromData(row.data, treeOpt).length === 0) {
        row.meta.tree.hasChildren = false;
        return;
      }
      row.meta.tree.isExpanded = true;
      this.#treeExpandState.set(row.meta.id, true);
      const maxDepth = treeOpt.maxDepth;
      const level = row.meta.tree.level ?? 0;
      if (maxDepth === undefined || level + 1 < maxDepth) {
        await this.#expandDefaultBranches(row.meta.tree.childItems ?? [], treeOpt);
      }
    } catch (err) {
      console.error(err);
      this.#notifyService.warning(this.#i18n.t('core.component.table.error-occurred'));
    } finally {
      if (row.meta.tree) {
        row.meta.tree.isExpanding = false;
      }
      // Children mới format + level/isExpanded vừa đổi → refresh cache rowStyle.
      this.#applyRowStyles();
      this.treeRevision.update(n => n + 1);
      this.#ref.markForCheck();
    }
  };

  onFilterChange = () => {
    this.externalFilter()?.updateFilter?.();
    this.filterRegister.value.set({
      columnOperator: this.columnOperator || {},
      columnFilter: this.columnFilter,
    });
  };

  // Blur input filter: chỉ commit giá trị vào filterRegister, KHÔNG trigger reload.
  // Reload chỉ chạy khi user enter hoặc bấm nút tải lại.
  onFilterCommit = () => {
    this.filterRegister?.value.set({
      columnOperator: this.columnOperator || {},
      columnFilter: this.columnFilter,
      notReload: true,
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
    const selectedData = () => this.#getSelectedRowData();
    if (rowData.meta.group?.items?.length) {
      rowData.meta.group.items.forEach(e => (e.meta.selector!.isSelected = rowData.meta.selector!.isSelected));
      opt.selector?.onSelect?.(rowData.data, selectedData());
      this.#updateSelectedItems();
      this.#syncSelectAllState();
    } else {
      if (opt.selector?.single) {
        this.#getSelectionRows()
          .filter(e => e !== rowData)
          .forEach(e => (e.meta.selector!.isSelected = false));
        // single + preserve: chỉ giữ MỘT item trong map (item vừa chọn nếu isSelected,
        // hoặc empty nếu vừa bỏ chọn). Off-page items có thể đã ở trong map → xoá hết
        // trước khi #updateSelectedItems sync entry mới.
        if (this.#preserveEnabled()) {
          this.#preservedSelectedMap.clear();
        }
        opt.selector?.onSelect?.(rowData.data, selectedData());
        this.isSelectAll.set(false);
        this.#updateSelectedItems();
        return;
      }
      opt.selector?.onSelect?.(rowData.data, selectedData());
      this.#updateSelectedItems();
      this.#syncSelectAllState();
    }
  };

  onSelectAll = () => {
    const opt = this.tableOption();
    const isSelected = this.isSelectAll();
    this.#getSelectionRows().forEach(e => {
      if (e.meta.selector!.selectable && (!opt?.selector?.actions?.length || e.meta.selector!.actions?.length)) {
        e.meta.selector!.isSelected = isSelected;
      }
    });
    opt?.selector?.onSelectAll?.(this.#getSelectedRowData());
    this.#updateSelectedItems();
    this.#syncSelectAllState();
  };

  onClearSelection = (items?: SdTableItem<T>[]) => {
    items = items || this.items();
    this.isSelectAll.set(false);
    items?.forEach(e => (e.meta.selector!.isSelected = false));
    // User explicit X — clear toàn bộ preserved map (bao gồm cả off-page items).
    if (this.#preserveEnabled()) {
      this.#preservedSelectedMap.clear();
    }
    this.#updateSelectedItems();
  };

  #getSelectionRows = (): SdTableItem<T>[] => {
    return getSelectionRows(this.items(), this.tableOption()?.tree);
  };

  #getSelectedRowData = (): T[] => getSelectedRowData(this.#getSelectionRows());

  #applyDefaultSelected = () => {
    applyDefaultSelected(this.items(), this.tableOption()?.tree, this.tableOption()?.selector?.defaultSelected);
  };

  #syncSelectAllState = () => {
    this.isSelectAll.set(resolveSelectAllState(this.#getSelectionRows()));
  };

  // ==========================================
  // GROUP HELPERS — sync selection + expand state cho group header rows
  // ==========================================

  /** Children selectable của 1 group header (lọc bỏ children không selectable). */
  #groupSelectableChildren = (header: SdTableItem<T>): SdTableItem<T>[] => {
    const children = header.meta.group?.items || [];
    return children.filter(c => c.meta.selector?.selectable !== false);
  };

  /** true nếu MỌI selectable child trong group đều selected. Group rỗng (không child) → false. */
  isGroupAllSelected = (header: SdTableItem<T>): boolean => {
    const sel = this.#groupSelectableChildren(header);
    return sel.length > 0 && sel.every(c => c.meta.selector!.isSelected);
  };

  /** true nếu CÓ MỘT VÀI selectable child selected nhưng KHÔNG phải tất cả. */
  isGroupIndeterminate = (header: SdTableItem<T>): boolean => {
    const sel = this.#groupSelectableChildren(header);
    if (sel.length === 0) return false;
    const some = sel.some(c => c.meta.selector!.isSelected);
    const all = sel.every(c => c.meta.selector!.isSelected);
    return some && !all;
  };

  /** Toggle select-all cho 1 group: set isSelected cho mọi selectable child, sync state. */
  onSelectGroup = (header: SdTableItem<T>, checked: boolean) => {
    const sel = this.#groupSelectableChildren(header);
    sel.forEach(c => (c.meta.selector!.isSelected = checked));
    const opt = this.tableOption();
    opt?.selector?.onSelectAll?.(this.#getSelectedRowData());
    this.#updateSelectedItems();
    this.#syncSelectAllState();
  };

  // Map<groupKey, isExpanded> — table own state, pass vào SdGroupPipe arg 3.
  // why: pipe stateless, persist toggle qua các lần re-eval bằng Map external. Mutate Map
  // KHÔNG tự re-trigger pipe (default pure: true) — gọi items.update để invalidate input.
  groupExpandState = new Map<string, boolean>();

  /**
   * Cầu nối tới SdGroupPipe (arg 4) — object DUY NHẤT, tạo một lần.
   * why: pipe sinh group header nhưng component mới là nơi biết selection đổi. Pipe đổ
   * header vào `headers` để `#syncGroupSelectionState` cập nhật `meta.group.isSelected` /
   * `indeterminate`, thay cho việc template gọi `isGroupAllSelected()`/`isGroupIndeterminate()`
   * (duyệt toàn bộ children) ở MỖI CD pass.
   */
  readonly groupHost: SdGroupHeaderHost<T> = {
    headers: [],
    toggleExpand: header => this.toggleGroupExpand(header),
    // why: hướng toggle phải tính LIVE. Đọc `meta.group.isSelected` (cache do pipe ghi lúc
    // dựng header, trước khi `selectable` của children được đặt) làm click đầu tiên sau mỗi
    // lần render toggle ngược chiều.
    toggleSelect: header => this.onSelectGroup(header, !this.isGroupAllSelected(header)),
  };

  /**
   * Tính lại selection state cho mọi group header của lần render gần nhất.
   *
   * why: giữ `meta.group.isSelected`/`indeterminate` đúng cho consumer đọc meta trực tiếp.
   * Template và `groupContext()` KHÔNG dựa vào nó (chúng tính live) — vì hàm này chạy trong
   * `#render`, trước khi CD kế tiếp cho `SdGroupPipe` dựng lại `groupHost.headers`, nên nó
   * luôn thao tác trên danh sách header của lần render TRƯỚC (rỗng ở lần render đầu).
   */
  #syncGroupSelectionState = () => {
    for (const header of this.groupHost.headers) {
      syncGroupSelectionMeta(header);
    }
  };

  /** Toggle expand/collapse cho 1 group (chỉ ý nghĩa khi option.group.collapsible). */
  toggleGroupExpand = (header: SdTableItem<T>) => {
    if (!header.meta.group?.key) return;
    const key = header.meta.group.key;
    const defaultExpanded = !this.tableOption()?.group?.defaultCollapsed;
    const current = this.groupExpandState.has(key) ? !!this.groupExpandState.get(key) : defaultExpanded;
    this.groupExpandState.set(key, !current);
    header.meta.group.isExpanded = !current;
    // why: trigger pipe re-eval — Map mutation không thay đổi reference items() nên cần update.
    this.items.update(arr => [...arr]);
  };

  /**
   * Predicate cho matRowDef.when — phân biệt group header row vs data row.
   * Group header row dùng matRowDef riêng với column list ['sdGroupHeader'] (1 cell duy nhất).
   * Data row dùng displayedColumns nguyên vẹn.
   */
  isGroupHeaderRow = (_idx: number, row: SdTableItem<T>): boolean => row?.meta?.group?.isGroupHeader === true;
  isDataRow = (_idx: number, row: SdTableItem<T>): boolean => row?.meta?.group?.isGroupHeader !== true;

  /**
   * Colspan cho cell sdGroupHeader trên group row = displayedColumns.length.
   * Span TOÀN BỘ width data row vì group row chỉ có 1 cell.
   */
  sdGroupColspan = computed(() => this.configuration()?.displayedColumns?.length || 1);

  /**
   * Context truyền vào template `sdTableGroupDef`.
   *
   * why: bản cũ dựng object MỚI (kèm `items.map(i => i.data)` mới và 2 lần duyệt children
   * qua `isGroupAllSelected`/`isGroupIndeterminate`) ở MỖI CD pass, cho MỖI group row —
   * `ngTemplateOutlet` thấy context đổi reference nên phải dựng lại embedded view. Giờ
   * context được `SdGroupPipe` precompute và cache trên `meta.group`; ở đây chỉ đọc ra
   * (fallback `??=` cho header không do pipe sinh) nên reference ổn định qua các pass.
   *
   * why: 3 field selection/expand thì phải làm TƯƠI mỗi lần đọc — `SdGroupPipe` dựng context
   * lúc header được sinh ra, thời điểm đó `selector.selectable` của children vẫn còn là mặc
   * định `false` (chỉ `SdSelectionVisiblePipe` ở cell BODY mới đặt đúng, mà CDK dựng header
   * trước body). Cache lại giá trị tính ở thời điểm đó là khoá cứng `isSelected = false`.
   * Mutate TẠI CHỖ để `ngTemplateOutlet` vẫn thấy cùng một reference và không dựng lại view.
   */
  groupContext = (header: SdTableItem<T>): SdTableGroupDefContext<T> => {
    const group = header.meta.group;
    if (!group) return buildGroupHeaderContext(header, this.groupHost);
    const context = (group.context ??= buildGroupHeaderContext(header, this.groupHost));
    context.isSelected = this.isGroupAllSelected(header);
    context.indeterminate = this.isGroupIndeterminate(header);
    context.isExpanded = group.isExpanded ?? true;
    return context;
  };

  rowStyle = (row: SdTableItem<T>, index?: number): Record<string, string> | null => {
    const fn = this.tableOption()?.style?.rowCss;
    if (!fn) return null;
    const tree = row.meta?.tree;
    const ctx =
      this.tableOption()?.tree && tree ? { level: tree.level, hasChildren: tree.hasChildren, isExpanded: tree.isExpanded } : undefined;
    return fn(row.data, index, ctx);
  };

  /**
   * Resolve `style.rowCss` MỘT LẦN cho mỗi row và cache vào `meta.rowStyle`.
   *
   * why: template cũ bind `[ngStyle]="rowStyle(row)"` — mỗi CD pass là một lần gọi callback
   * của consumer cho TỪNG dòng, và callback trả object MỚI nên `NgStyle` phải chạy
   * KeyValueDiffer trên mọi dòng ở mọi pass. Gọi ở cuối `#render` và sau mỗi lần tree
   * toggle (level / isExpanded / children mới format đều là input của `rowCss`).
   */
  #applyRowStyles = () => {
    const hasRowCss = !!this.tableOption()?.style?.rowCss;
    const roots = this.items();
    const rows = this.tableOption()?.tree ? collectFormattedTreeRows(roots) : roots;
    for (const row of rows) {
      row.meta.rowStyle = hasRowCss ? this.rowStyle(row) : null;
    }
  };

  // why: khi preserveSelection bật, giữ map nội bộ id → SdTableItem để selection
  // không mất qua filter / paginate / sort / reload (kể cả server re-fetch tạo refs mới).
  // Map chỉ bị clear khi user gọi onClearSelection (nút X) hoặc bỏ chọn từng item.
  #preservedSelectedMap = new Map<string, SdTableItem<T>>();

  #preserveEnabled = () => this.tableOption()?.selector?.preserveSelection === true;

  // Restore isSelected cho item visible nào id đã có trong preserved map.
  // Đồng thời update reference trong map sang SdTableItem mới (cần thiết khi server
  // re-fetch tạo refs mới, ta muốn map giữ ref hiện hành để các tham chiếu downstream OK).
  #restorePreservedSelection = () => {
    if (!this.#preserveEnabled()) return;
    restorePreservedSelection(this.#getSelectionRows(), this.#preservedSelectedMap);
  };

  #updateSelectedItems = () => {
    const rows = this.#getSelectionRows();
    // Selection vừa đổi → cập nhật checkbox state cache của mọi group header.
    this.#syncGroupSelectionState();
    if (this.#preserveEnabled()) {
      // Sync map theo state visible: add nếu selected, remove nếu deselected.
      // Off-page items giữ nguyên trong map (không bị visit ở đây).
      this.selectedTableItems.set(syncPreservedSelection(rows, this.#preservedSelectedMap));
    } else {
      this.selectedTableItems.set(rows.filter(item => item.meta.selector!.isSelected));
    }
    this.#ref.detectChanges();
  };

  clearFilter = () => {
    this.filterRegister.value.remove();
  };

  setFilter = (args?: Pick<TableFilterValue, 'columnFilter' | 'externalFilter'>) => {
    const { columnFilter, externalFilter } = args || {};
    if (columnFilter) {
      // Giữ reference ổn định cho column-filter (xem #syncColumnFilterInPlace).
      this.#syncColumnFilterInPlace(columnFilter);
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
    // persistColumnWidth ghi storage (silent) và emit widthChange$,
    // subscriber trong constructor đã update configuration() signal đồng bộ.
    this.#configService.persistColumnWidth(field, width);

    const onResize = this.tableOption()?.config?.onResize;
    if (!onResize) return;
    onResize(field, width, buildColumnWidthMap(this.configuration()?.column));
  };

  onOperatorChange = (column: SdTableColumn, operator: Operator | undefined) => {
    if (operator == null) return;
    this.tableOption()?.filter?.operatorChange?.(column, operator);
  };

  trackBy = (index: number, item: SdTableItem) => {
    return item.meta.id;
  };

  // Offset STT theo paging — computed memoize, không tính lại trừ khi paginator đổi.
  // Template chỉ cần đọc pageOffset() rồi cộng `i + 1` (rẻ hơn gọi function).
  pageOffset = computed(() => {
    const p = this.paginator();
    return (p?.pageIndex ?? 0) * (p?.pageSize ?? 0);
  });

  isReorderDisabled(item: SdTableItem<T>): boolean {
    const opt = this.tableOption()?.rowReorder;
    const idx = this.#itemIndexMap.get(item) ?? -1;
    return isReorderItemDisabled(item, opt, idx);
  }

  reorderSortPredicate = (index: number, drag: CdkDrag<SdTableItem<T>>, drop: CdkDropList<SdTableItem<T>[]>): boolean => {
    const opt = this.tableOption()?.rowReorder;
    return canSortReorder({
      enabled: opt?.enabled,
      index,
      dragItem: drag.data,
      allItems: drop.data,
      hasGroup: !!this.tableOption()?.group,
    });
  };

  onReorderDrop(event: CdkDragDrop<SdTableItem<T>[]>): void {
    const { previousIndex, currentIndex } = event;
    if (previousIndex === currentIndex) return;
    const result = reorderTableItems({
      items: this.items(),
      renderedItems: event.container.data,
      previousRenderedIndex: previousIndex,
      currentRenderedIndex: currentIndex,
      localItems: this.tableOption()?.type === 'local' ? this.#localItems : undefined,
    });
    this.items.set(result.items);
    if (this.tableOption()?.type === 'local' && result.localItems) {
      this.#localItems = result.localItems;
    }
    this.table()?.renderRows();
    this.tableOption()?.rowReorder?.onChange?.(
      result.items.map(i => i.data),
      event.item.data.data,
      result.fromIndex,
      result.toIndex
    );
  }
}
