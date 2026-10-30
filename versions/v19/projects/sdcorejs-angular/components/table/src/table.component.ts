import { animate, state, style, transition, trigger } from '@angular/animations';
import {
  AfterViewInit,
  booleanAttribute,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  Directive,
  ElementRef,
  Injectable,
  Injector,
  Input,
  NgZone,
  OnDestroy,
  OnInit,
  afterNextRender,
  computed,
  contentChild,
  contentChildren,
  effect,
  inject,
  input,
  isDevMode,
  isSignal,
  output,
  signal,
  untracked,
  viewChild,
} from '@angular/core';
import { MatPaginator, MatPaginatorIntl, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortable, MatSortModule, SortDirection } from '@angular/material/sort';
import { MatTable, MatTableModule } from '@angular/material/table';
import { SdExcelColumn, SdNotifyService } from '@sdcorejs/angular/services';
import { EMPTY, Subject, Subscription, firstValueFrom, isObservable, timer } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { SdTableCellDefDirective } from './directives/sd-table-cell-def.directive';
import { SdTableExpandDefDirective } from './directives/sd-table-expand-def.directive';
import { SdTableGroupDefDirective, SdTableGroupDefContext } from './directives/sd-table-group-def.directive';
import { SdTableFilterDefDirective } from './directives/sd-table-filter-def.directive';
import { SdMaterialFooterDefDirective } from './directives/sd-table-footer-def.directive';
import { SdTableTitleDefDirective } from './directives/sd-table-title-def.directive';
import { SdTableCommandHeaderDefDirective } from './directives/sd-table-command-header-def.directive';
import { SdTableQuickSearchRightDefDirective } from './directives/sd-table-quick-search-right-def.directive';
import { TableQuickSearchComponent } from './components/filter/quick-search/quick-search.component';
import { SdTableQuickSearchFilterValue, SdTableQuickSearchValue } from './services/table-filter/table-quick-search.model';
import { hasQuickSearchValue, quickSearchValid, sameQuickSearchValue } from './services/table-filter/table-quick-search.util';
import { SdQuery, SdQueryBar, SdQueryBarOption } from '@sdcorejs/angular/components/query-bar';
import {
  mergeQueryDraft,
  queryToTableFilter,
  SdTableQueryChange,
  SdTableQueryContext,
  sdTableActiveQueryKeys,
  sdTableQueryFields,
  tableFilterToQuery,
} from './services/table-filter/table-query-bar.util';
import { SdTableRowMobileDefDirective } from './directives/sd-table-row-mobile-def.directive';
import { SdTableMobileActionsComponent } from './components/mobile-cards/mobile-actions.component';
import { SdTableMobileAction } from './components/mobile-cards/mobile-action.model';
import { SdTableMobileCardsComponent } from './components/mobile-cards/mobile-cards.component';
import { SdDateTimeService } from '@sdcorejs/angular/services/date-time';
import { SdViewportService } from '@sdcorejs/angular/services/viewport';
import { SdTableColumn, SdTableColumnNormal } from './models/table-column.model';
import { SdTableCommand } from './models/table-command.model';
import { SdTableOption } from './models/table-option.model';
import {
  SdTableUnknownTotalPageEvent,
  SdTableUnknownTotalPagerState,
  SdTableUnknownTotalPaginator,
} from './components/unknown-total-paginator/unknown-total-paginator.component';
import {
  isUnknownTotal,
  readUnknownTotalPage,
  samePagePosition,
  SdTablePagePosition,
  SdTableShownPage,
} from './services/table-paging/unknown-total.util';
import {
  buildTableSkeleton,
  resolveTableLoading,
  SdTableLoadingView,
  pixelLength,
  skeletonFillRows,
  TABLE_GENERIC_SKELETON,
  TABLE_SKELETON_ROWS,
  TableRefreshTimer,
  tableLoadingView,
  TableSkeletonCell,
} from './services/table-loading/table-loading.util';
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
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatRadioModule } from '@angular/material/radio';
import { SdButton, SdButtonItem } from '@sdcorejs/angular/components/button';
import { SdDataState, SdDataStateTemplateDirective } from '@sdcorejs/angular/components/data-state';
import { cloneReadRequest, SdReadChannel, SdReadState } from '@sdcorejs/angular/utilities/read-state';
import { SdQuickAction } from '@sdcorejs/angular/components/quick-action';
import { SdHoverCopyDirective, SdScrollDirective } from '@sdcorejs/angular/directives';
import { SdSafeHtmlPipe, SdFormatDatePipe, SdFormatDatetimePipe, SdFormatNumberPipe } from '@sdcorejs/angular/pipes';
import { EMPTY_STR } from '@sdcorejs/utils/constants';
import { AggregateRenderHost, SdAggregateRowsPipe } from './pipes/sd-aggregate-rows.pipe';
import { AggregateSnapshot, buildAggregateSnapshot } from './services/table-aggregate.util';
import { SdTableAggregateOperation, SdTableAggregateResult } from './models/table-aggregate.model';
import { SdAggregateLayoutDirective, SdTableFooterRowDefDirective } from './directives/sd-aggregate-layout.directive';

import { Filter, Operator } from '@sdcorejs/utils/models';
import { Utilities } from '@sdcorejs/utils/fns';
import { ArrayUtilities, NumberUtilities } from '@sdcorejs/utils/fns';

import { ColumnFilterComponent, ColumnTitleComponent, ExternalFilterComponent, MobileFilterComponent } from './components';
import { ConfigComponent } from './components/config/config.component';
import { DesktopCellComponent } from './components/desktop-cell/desktop-cell.component';
import { DesktopCommand } from './components/command/desktop-command.component';
import { SdPopupExport } from './components/popup-export/popup-export.component';
import { SelectorActionComponent } from './components/selector-action/selector-action.component';
import { DEFAULT_TABLE_CONFIG, ISdTableConfiguration, SD_TABLE_CONFIGURATION, SD_TABLE_LAYOUT } from './configurations';
import { SdColumnResizeDirective, StickyShadowDirective } from './directives';
import { SdTableItem } from './models/table-item.model';
import { ConfiguredTable, ConfiguredTableResult } from './models/table-option-config.model';
import { SdGroupPipe } from './pipes/sd-group.pipe';
import { SdTreePipe } from './pipes/sd-tree.pipe';
import { SdTableExportContext, TableExportService, TableFormatService } from './services';
import { ConfigService } from './services/config.service';
import { sdTableHasCustomSetup } from './services/config-custom.util';
import { buildColumnWidthMap } from './services/column-width.util';
import { leafColumns } from './services/column-leaf.util';
import { filterLocalItems, hasActiveColumnFilter } from './services/table-local/table-local.util';
import { isNoDataColumnOperator } from './services/table-filter/table-filter-operator.util';
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
import { prepareTableSelection, resolveSelectAllVisible } from './services/table-selection/selection-action.util';
import { SdTableFilterService } from './services/table-filter/table-filter.service';
import {
  clearTreeChildCache,
  collectFormattedTreeRows,
  countVisibleTreeRows,
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
import { I18nService, SdTranslatePipe } from '@sdcorejs/angular/i18n';
import { SdIcon } from '@sdcorejs/angular/modules/icon';

/** Internal title-only sort control. The semantic header cell owns aria-sort. */
@Directive({
  selector: '[sdTableSortHeader]',
  standalone: true,
  host: {
    class: 'sd-table-sort-header',
    role: 'button',
    '[attr.data-sort-id]': 'id',
    '[attr.tabindex]': 'sort.disabled ? -1 : 0',
    '[attr.aria-disabled]': 'sort.disabled ? "true" : null',
    '(click)': 'activate()',
    '(keydown)': 'onKeydown($event)',
  },
})
class SdTableSortHeaderDirective implements MatSortable, OnInit, OnDestroy {
  @Input({ required: true, alias: 'sdTableSortHeader' }) id!: string;
  start!: SortDirection;
  disableClear!: boolean;
  readonly sort = inject(MatSort);

  ngOnInit(): void {
    this.sort.register(this);
  }

  ngOnDestroy(): void {
    this.sort.deregister(this);
  }

  activate(): void {
    if (!this.sort.disabled) this.sort.sort(this);
  }

  onKeydown(event: KeyboardEvent): void {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    event.preventDefault();
    this.activate();
  }
}

// why: tên cũ `MatPaginatorIntlCro` là vết copy-paste từ ví dụ locale Croatia — lớp này chỉ phục vụ
// nhãn phân trang của `<sd-table>` (VI/EN), không liên quan gì tới tiếng Croatia. Tên cũ lại còn
// mang tiền tố `Mat`, dễ bị hiểu nhầm là API của Angular Material thay vì export public của lib này.
interface ServerReadRequest<T> {
  filter: SdTableFilterRequest;
  paging: Parameters<Extract<SdTableOption<T>, { type: 'server' }>['items']>[1];
  option: Extract<SdTableOption<T>, { type: 'server' }>;
  valid: () => boolean;
}

interface TableReadResult<T> {
  items: SdTableItem<T>[];
  filteredItems?: SdTableItem<T>[];
  aggregateComplete?: boolean;
  total: number;
  /** Unknown-total mode: whether the loader proved a next page. */
  hasMore?: boolean;
  /** Page the read asked for; committed as the shown page by a successful unknown-total render. */
  page?: SdTablePagePosition;
  readRevision?: number;
}

interface ScheduledTableRead {
  force: boolean;
  revision: number;
  delay: number;
  source: 'filter' | 'read';
}

/** A raw filter value that filters something — the rule of `#isFiltered`: a non-empty array, a range with an end, a value. */
const isRawFilterSet = (value: unknown): boolean => {
  if (Array.isArray(value)) return value.length > 0;
  if (value && typeof value === 'object' && ('from' in value || 'to' in value)) {
    const range = value as { from?: unknown; to?: unknown };
    return !!range.from || !!range.to;
  }
  return value !== undefined && value !== null && value !== '';
};

const isNoDataOperator = (operator: Operator | undefined): boolean => operator === 'NULL' || operator === 'NOT_NULL';

@Injectable()
export class SdTablePaginatorIntl extends MatPaginatorIntl {
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
    tabindex: '0',
    '[attr.data-loading]': 'loading() ? "true" : "false"',
    '[attr.data-loading-view]': 'loadingView()',
    '[attr.data-filter-mode]': 'effectiveFilterMode()',
    '[class.sd-table--fill]': 'fill()',
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
      useClass: SdTablePaginatorIntl,
    },
  ],
  imports: [
    SdIcon,
    SdDataState,
    SdDataStateTemplateDirective,
    CommonModule,
    FormsModule,

    MatPaginatorModule,
    MatTableModule,
    MatSortModule,
    MatButtonModule,
    MatCheckboxModule,
    MatRadioModule,
    DragDropModule,
    SdButton,
    SdButtonItem,
    DesktopCommand,
    DesktopCellComponent,
    ColumnTitleComponent,
    ExternalFilterComponent,
    TableQuickSearchComponent,
    SdQueryBar,
    ConfigComponent,
    ColumnFilterComponent,
    MobileFilterComponent,
    SdGroupPipe,
    SdTreePipe,
    SdAggregateRowsPipe,
    SdAggregateLayoutDirective,
    SdTableFooterRowDefDirective,
    SdSafeHtmlPipe,
    SdScrollDirective,
    SdHoverCopyDirective,
    SelectorActionComponent,
    StickyShadowDirective,
    SdColumnResizeDirective,
    SdTableSortHeaderDirective,
    SdTranslatePipe,
    SdTableMobileCardsComponent,
    SdTableMobileActionsComponent,
    SdTableUnknownTotalPaginator,
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
  /** Hide the integrated error region while retaining read state, events and retry. */
  readonly hideReadError = input(false, { transform: booleanAttribute });
  readonly sdReadStateChange = output<SdReadState>();
  readonly #read = new SdReadChannel('TABLE', state => {
    if (!this.#destroyed) {
      this.loadError.set(state.status === 'error');
      this.sdReadStateChange.emit(state);
    }
  });
  readonly readState = this.#read.state;
  readonly dataStateTemplate = contentChild(SdDataStateTemplateDirective);
  #destroyed = false;
  #failedRead?: ServerReadRequest<T>;

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
  /** Nội dung tuỳ chọn cho ô header của cột command (mặc định ô này để trống). */
  sdCommandHeaderDef = contentChild(SdTableCommandHeaderDefDirective);
  readonly sdQuickSearchRightDef = contentChild(SdTableQuickSearchRightDefDirective);
  sdFooterDefs = contentChildren(SdMaterialFooterDefDirective);
  sdFilterDefs = contentChildren(SdTableFilterDefDirective);
  sdTitleDefs = contentChildren(SdTableTitleDefDirective);
  readonly sdRowMobileDef = contentChild<SdTableRowMobileDefDirective<T>>(SdTableRowMobileDefDirective, { descendants: false });
  readonly isMobile = inject(SdViewportService).isMobile;
  readonly mobileCards = computed(() => this.isMobile() && !!this.sdRowMobileDef());
  /**
   * The footer settings button carries a dot while the table uses a setup of its own: stored columns that differ from
   * the option (settings modal or a resize on the table) or inline external filters that differ from `defaultShowing`.
   */
  readonly hasCustomSetup = computed(() =>
    sdTableHasCustomSetup({
      option: this.tableOption(),
      configuration: this.#configuredTable(),
      inlineExternal: this.#inlineExternalSetup(),
    })
  );

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
  readonly mobileColumns = computed<SdTableColumn[]>(() => {
    const config = this.configuration();
    return [...(config?.firstColumns ?? []), ...(config?.secondColumns ?? [])].filter(column => column.type !== 'children');
  });
  readonly mobileFooterColumns = computed(() => {
    const config = this.configuration();
    const footers = this.footerDef();
    return [...(config?.firstColumns ?? []), ...(config?.secondColumns ?? [])].filter(
      column => !!footers[column.field] && config?.displayedFooters.includes(column.field)
    );
  });

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
  /** Record count of a known-total table; stays `undefined` with `paginate.total: 'unknown'`. */
  total = signal<number | undefined>(undefined);

  loading = signal(false);
  loadError = signal(false);

  /** `paginate.total: 'unknown'` on a server table. */
  readonly unknownTotal = computed(() => isUnknownTotal(this.tableOption()));
  // why: unknown-total paging separates the page a read asks for from the page whose rows are on
  // screen. Requests use the target; range, row numbers and Next only use the shown page, which a
  // successful render alone may write, so a failed or stale read can never relabel the rows.
  readonly #pageTarget = signal<SdTablePagePosition | undefined>(undefined);
  readonly #shownPage = signal<SdTableShownPage | undefined>(undefined);
  /** A read is waiting in the schedule (debounce) and has not started loading yet. */
  readonly #readScheduled = signal(false);

  /** `option.loading`, then `SD_TABLE_CONFIGURATION.loading`, then the defaults, field by field. */
  readonly loadingSettings = computed(() => resolveTableLoading(this.tableOption()?.loading, this.tableConfiguration?.loading));
  readonly #refresh = new TableRefreshTimer((callback, ms) => {
    // why: a waiting timer outside the zone keeps it stable (whenStable, hydration); the callback runs inside it,
    // so its signal write also renders in zone apps that ignore changes outside the zone.
    const id = this.#zone.runOutsideAngular(() => setTimeout(() => this.#zone.run(callback), ms));
    return () => clearTimeout(id);
  });
  /** The skeleton showed for a read that a scheduled read now replaces (sort, page, filter during the read). */
  readonly #skeletonHeld = signal(false);
  /**
   * Nothing to show yet but something is on its way: the configuration (column lookups) is not ready, the first
   * read of the option waits in the schedule, or a read replaces one that showed the skeleton. Without it the
   * empty-state block shows during that debounce.
   */
  readonly #readPending = computed(
    () =>
      this.readState().status !== 'error' &&
      (!this.configuration() ||
        (this.#readScheduled() && ((this.total() === undefined && this.#shownPage() === undefined) || this.#skeletonHeld())))
  );
  /**
   * What the loading layer draws (host `data-loading-view`). Derived only; `loading()`, `data-loading` and
   * `aria-busy` keep following every read at once.
   */
  readonly loadingView = computed<SdTableLoadingView>(() =>
    tableLoadingView({
      skeleton: this.loadingSettings().skeleton,
      loading: this.loading(),
      pending: this.#readPending(),
      scheduled: this.#readScheduled(),
      rows: this.items().length > 0,
      refresh: this.#refresh.shown(),
    })
  );
  readonly #liveMessage = signal('');
  /** Text of the `.sd-table-live` status region: "loading" once the loading layer shows, then the result. */
  protected readonly liveMessage = this.#liveMessage.asReadonly();
  #liveLoading = false;
  /**
   * i18n key of the empty block on screen, for the status region: the title of the default block, also under a
   * custom `sdDataStateTemplate`; `undefined` while rows, a read, the loading layer or an error region show.
   */
  readonly #emptyKey = computed(() => {
    const status = this.readState().status;
    const noRows = status !== 'error' && !this.loading() && !this.total() && !this.items().length && this.loadingView() === 'none';
    if (!noRows || (this.loadError() && !(status === 'empty' && this.dataStateTemplate()))) return undefined;
    if (this.isFiltered()) return 'core.component.table.no-results';
    return this.requireFiltered() ? 'core.component.table.choose-filter-hint' : 'core.component.table.no-data';
  });
  /** Rows that fill a table with a fixed height, measured when the skeleton shows. */
  readonly #skeletonFill = signal<number | undefined>(undefined);
  /** Skeleton rows of the desktop table (`matNoDataRow`) while `loadingView()` is `skeleton`; empty otherwise. */
  protected readonly skeleton = computed<TableSkeletonCell[][]>(() => {
    const config = this.configuration();
    if (!config || this.loadingView() !== 'skeleton') return [];
    const columns = new Map([...config.firstColumns, ...config.secondColumns].map(column => [column.field, column]));
    const cellDef = this.cellDef();
    const pageSize = this.tableOption()?.paginate?.pageSize;
    const rows =
      this.loadingSettings().skeletonRows ??
      this.#skeletonFill() ??
      Math.min(TABLE_SKELETON_ROWS, pageSize && pageSize > 0 ? pageSize : TABLE_SKELETON_ROWS);
    return buildTableSkeleton(
      config.displayedColumns.map(field => {
        const column = columns.get(field);
        return {
          field,
          type: column?.type,
          align: column?.align,
          badge: !!column && 'useBadge' in column && !!column.useBadge,
          template: !!column?.cell?.templateRef || !!cellDef[field],
        };
      }),
      rows
    );
  });
  /** What the table shows before its configuration is ready: 5 rows × 4 bars, without a header. */
  protected readonly genericSkeleton = TABLE_GENERIC_SKELETON;
  readonly unknownTotalPager = computed<SdTableUnknownTotalPagerState | undefined>(() => {
    if (!this.unknownTotal()) return undefined;
    const target = this.#unknownTarget();
    const shown = this.#shownPage();
    const busy = this.loading() || this.#readScheduled();
    const settled = this.readState().status !== 'error' && samePagePosition(shown, target);
    const offset = shown ? shown.pageIndex * shown.pageSize : 0;
    return {
      pageIndex: target.pageIndex,
      pageSize: target.pageSize,
      // why: rows stay on screen while the next page loads and are removed when it fails, so the
      // range follows the rendered rows of the shown page, never the target.
      range: shown?.count && this.items().length ? { from: offset + 1, to: offset + shown.count } : undefined,
      hasPrevious: !busy && target.pageIndex > 0,
      hasNext: !busy && settled && !!shown?.hasMore,
      busy,
    };
  });
  /** Hidden until a page has loaded, and while the first page is the only page (same rule as `total <= pageSize`). */
  readonly unknownTotalPagerVisible = computed(() => !!this.#shownPage() && this.knownRowCount() === undefined);
  /**
   * Size of the whole result when it is known: the total, or an unknown-total result whose first page is
   * the only page. Drives `filter.hideInlineFilter: 'auto'`.
   */
  readonly knownRowCount = computed(() => {
    if (!this.unknownTotal()) return this.total();
    const shown = this.#shownPage();
    return shown && shown.pageIndex === 0 && !shown.hasMore && this.#unknownTarget().pageIndex === 0 ? shown.count : undefined;
  });
  /** Rows of a single-page unknown-total result, for the "Đang hiển thị" summary. */
  readonly unknownTotalSingleCount = computed(() =>
    this.unknownTotal() && !this.unknownTotalPagerVisible() && this.items().length ? (this.#shownPage()?.count ?? 0) : 0
  );
  readonly aggregateSnapshot = signal<AggregateSnapshot<T>>({ groups: new Map(), branches: new Map() });
  readonly aggregateRenderHost: AggregateRenderHost<T> = { rows: new WeakMap(), indices: new WeakMap() };
  #aggregateFilteredItems: SdTableItem<T>[] = [];
  #aggregateReady = false;
  #aggregateScopeComplete = false;
  readonly #aggregateLoadedChildren = new Set<T>();
  readonly #layoutColumns = computed(() => {
    const config = this.configuration();
    if (!config) return [];
    const commandRight = this.tableOption()?.command?.align === 'right';
    const columns = new Map([...config.firstColumns, ...config.secondColumns].map(column => [column.field, column]));
    return config.displayedColumns.map(field => ({
      field,
      column: columns.get(field),
      hidden: columns.get(field)?.type === 'children',
      sticky: !!config.fixedColumn[field] || field === 'sdSelection' || field === 'sdIndex' || (field === 'sdCommand' && !commandRight),
      stickyEnd: field === 'sdSubInformationAction' || (field === 'sdCommand' && commandRight),
    }));
  });
  readonly aggregateColumns = computed(() => this.#layoutColumns().map(column => ({ ...column, id: `sdAggregate-${column.field}` })));
  readonly aggregateColumnIds = computed(() => this.aggregateColumns().map(column => column.id));
  // why: filter có hàng riêng để title rowspan căn giữa mà không kéo control lệch theo.
  readonly headerFilterColumns = computed(() =>
    this.#layoutColumns()
      .filter(column => !column.hidden)
      .map(column => ({ ...column, id: `sdFilter-${column.field}` }))
  );
  readonly headerFilterColumnIds = computed(() => this.headerFilterColumns().map(column => column.id));
  isSelectAll = signal(false);
  isSelectIndeterminate = signal(false);
  readonly sortState = signal<{ active: string; direction: SortDirection }>({ active: '', direction: '' });
  readonly mobileSortColumns = computed(() => {
    const config = this.configuration();
    const state = this.sortState();
    return [...(config?.firstColumns ?? []), ...(config?.secondColumns ?? [])]
      .filter(column => column.type !== 'children' && column.sortable)
      .map(column => ({
        field: column.field,
        title: typeof column.title === 'string' ? column.title : column.title.title,
        direction: state.active === column.field ? state.direction : '',
      }));
  });

  readonly mobileToolsActions = computed<SdTableMobileAction[]>(() => {
    const option = this.tableOption();
    if (!option) return [];
    const t = (key: string) => this.#i18n.t('core.component.table.' + key);
    const actions: SdTableMobileAction[] = [];
    if (option.reload?.visible) actions.push({ key: 'tool-reload', title: t('reload'), icon: 'refresh', run: () => this.reload() });
    const exporting = option.export;
    if (exporting && this.items().length) {
      if (exporting.type === 'custom')
        actions.push({ key: 'tool-export', title: this.exportTitle(), icon: 'download', run: () => this.exportCustom() });
      else if (exporting.visible) {
        const children: SdTableMobileAction[] = [];
        if (exporting.visible === 'ALL' || exporting.visible === 'EXCEL')
          children.push({ key: 'tool-export-excel', title: t('export-excel'), icon: 'table_view', run: () => this.exportExcel() });
        if (exporting.visible === 'ALL' || exporting.visible === 'CSV')
          children.push({ key: 'tool-export-csv', title: t('export-csv'), icon: 'description', run: () => this.exportCSV() });
        actions.push({ key: 'tool-export', title: this.exportTitle(), disabled: this.exporting(), children });
      }
    }
    if (!option.filter?.disabled && this.mobileFilter())
      actions.push({
        key: 'tool-filter',
        title: t('filter'),
        icon: 'filter_alt',
        closeBeforeRun: true,
        run: () => this.mobileFilter()?.open(),
      });
    if (option.sort?.enable && this.mobileSortColumns().length)
      actions.push({
        key: 'tool-sort',
        title: t('mobile.sort'),
        children: this.mobileSortColumns().map(column => ({
          key: 'tool-sort-' + column.field,
          title: column.title,
          icon: column.direction === 'asc' ? 'arrow_upward' : column.direction === 'desc' ? 'arrow_downward' : 'sort',
          run: () => this.sort()?.sort({ id: column.field, start: 'asc', disableClear: false }),
        })),
      });
    if (this.configComponent())
      actions.push({
        key: 'tool-config',
        title: t('setup-short'),
        icon: 'settings',
        closeBeforeRun: true,
        run: () => this.configComponent()?.open(),
      });
    return actions;
  });

  readonly pageRevision = signal(0);
  readonly dataRevision = signal(0);

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
  visibleSelectAll = computed(() => {
    this.selectedTableItems();
    this.treeRevision();
    return resolveSelectAllVisible(
      this.#getSelectionRows().filter(row => row.meta.selector?.selectable),
      this.tableOption()?.selector
    );
  });

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
  readonly quickSearchOption = computed(() => (this.tableOption()?.filter?.disabled ? undefined : this.tableOption()?.filter?.quickSearch));
  readonly quickSearchValue = signal<SdTableQuickSearchValue>({ term: '', filters: {} });
  private readonly quickSearchControl = viewChild(TableQuickSearchComponent);
  readonly quickSearchValid = computed(() => quickSearchValid(this.quickSearchOption(), this.quickSearchValue()));
  readonly #filterRegisterRevision = signal(0);

  // ==========================================
  // QUERY BAR (`filter.mode: 'query-bar'`) — một lớp hiển thị trên cùng TableFilterValue (handoff table-query-bar)
  // ==========================================
  /** `filter.mode` sau khi gộp `SD_TABLE_CONFIGURATION.filter.mode`. */
  readonly filterMode = computed(() => this.tableOption()?.filter?.mode ?? 'default');
  /** Giao diện lọc đang hiển thị: mobile luôn dùng giao diện mặc định; giá trị lọc không đổi khi đổi viewport. */
  readonly effectiveFilterMode = computed(() => (this.isMobile() ? 'default' : this.filterMode()));
  /** Thanh query bar thay quick search, external filter và filter dưới cột. */
  readonly queryBarMode = computed(() => this.effectiveFilterMode() === 'query-bar' && !this.tableOption()?.filter?.disabled);
  readonly queryBar = viewChild(SdQueryBar);
  /** Chip trên thanh (nháp của thanh) và ô tìm — gắn hai chiều với `sd-query-bar`. */
  readonly barFilters = signal<Filter[]>([]);
  readonly barSearch = signal('');
  readonly queryBarHintId = `sd-table-${Utilities.generateUuid()}-query-bar-hint`;
  /** Giá trị lọc đã áp dụng, theo lần phát gần nhất của filter register. */
  readonly #appliedFilter = signal<TableFilterValue | undefined>(undefined);
  readonly #inlineExternal = signal<Record<string, boolean>>({});
  // why: tách khỏi #inlineExternal (mặc định {}) — trước khi filter register phát lần đầu thì chưa biết, không được
  // coi là "khác defaultShowing" mà bật chấm trên nút Thiết lập.
  readonly #inlineExternalSetup = signal<Record<string, boolean> | undefined>(undefined);
  /** Column setup the table reads from storage; the settings button dot compares it with the option. */
  readonly #configuredTable = signal<ConfiguredTable | undefined>(undefined);
  #configStorage?: { get: () => ConfiguredTable };
  #filterConfigurationSubscription?: Subscription;
  /** Chip dựng từ giá trị đã áp dụng ở lần đồng bộ trước — để phân biệt nháp với giá trị đã áp dụng. */
  #barDerived: Filter[] = [];
  /** Mảng ghi vào `barFilters` lần cuối; khác mảng đang có nghĩa là người dùng đã sửa thanh. */
  #barWritten: Filter[] = this.barFilters();
  #barTerm?: string;
  #barActive = false;
  #barPending = false;
  #barApplying = false;
  /** The last bar apply left out the search text being typed (a chip change): keep that text in the box. */
  #barKeepSearch = false;
  #barWarned = false;

  /** Cột bị ẩn qua cấu hình mà vẫn còn giá trị lọc: chip của nó ở lại thanh tới khi bị xoá. */
  readonly #hiddenFilteredColumns = computed(
    () => {
      const config = this.configuration();
      const value = this.#appliedFilter();
      const option = this.tableOption();
      if (!config || !value || !option || !this.queryBarMode()) return [] as string[];
      const shown = new Set(leafColumns([...config.firstColumns, ...config.secondColumns]).map(column => column.field));
      return leafColumns(option.columns)
        .filter(
          column =>
            !column.hidden &&
            !shown.has(column.field) &&
            (isRawFilterSet(value.columnFilter?.[column.field]) || isNoDataOperator(value.columnOperator?.[column.field]))
        )
        .map(column => column.field);
    },
    { equal: (a, b) => a.length === b.length && a.every((field, index) => field === b[index]) }
  );

  /** Field của thanh và bảng tra nguồn; `undefined` khi không ở mode query-bar. */
  readonly queryBarModel = computed<SdTableQueryContext | undefined>(() => {
    if (!this.queryBarMode()) return undefined;
    const option = this.tableOption();
    const config = this.configuration();
    if (!option || !config) return undefined;
    this.#filterRegisterRevision();
    const filter = option.filter ?? {};
    const hidden = new Set(this.#hiddenFilteredColumns());
    const fields = sdTableQueryFields({
      columns: [...config.firstColumns, ...leafColumns(option.columns).filter(column => hidden.has(column.field))],
      externalFilters: filter.externalFilters,
      quickSearch: this.quickSearchOption(),
      inlineExternal: this.#inlineExternal(),
      queryBar: filter.queryBar,
      hideColumns: filter.hideInlineFilter === true,
      labels: {
        filters: this.#i18n.t('core.component.table.query-bar.filters'),
        columns: this.#i18n.t('core.component.table.query-bar.columns'),
      },
      filterDefs: this.sdFilterDefs().map(def => def.sdTableFilterDef()),
      cacheValues: this.cacheValues,
    });
    return { ...fields, defaultColumnOperator: untracked(() => this.filterRegister?.value.default?.().columnOperator) };
  });

  /** Giá trị đã áp dụng khác default (so trên các field của thanh) — bật nút Xoá lọc. */
  readonly #queryBarDirty = computed(() => {
    const ctx = this.queryBarModel();
    const value = this.#appliedFilter();
    const defaults = this.filterRegister?.value.default?.();
    if (!ctx || !value || !defaults) return false;
    const snapshot = (input: TableFilterValue): string => {
      const query = tableFilterToQuery(input, ctx);
      return Utilities.canonicalStringify({
        filters: query.filters.map(filter => [(filter as { field: string }).field, filter.operator, (filter as { data?: unknown }).data]),
        search: query.search ?? '',
      });
    };
    return snapshot(value) !== snapshot(defaults);
  });

  readonly queryBarOption = computed<SdQueryBarOption | undefined>(() => {
    const ctx = this.queryBarModel();
    const filter = this.tableOption()?.filter;
    if (!ctx || !filter) return undefined;
    const autoId = this.autoId();
    return {
      autoId: autoId ? `${autoId}-query-bar` : undefined,
      fields: ctx.fields,
      mode: filter.queryBar?.editor ?? 'inline',
      density: 'compact',
      showSearch: ctx.search,
      searchPlaceholder: this.quickSearchOption()?.placeholder,
      showOperatorOnChip: 'auto',
      applyOn: filter.manualFilter ? 'search' : 'commit',
      appearance: 'flush',
      onClearAll: this.#clearQueryBar,
      clearDisabled: !this.#queryBarDirty(),
      invalidHintId: this.queryBarHintId,
    };
  });

  /** Khoá thanh của các field đang lọc theo giá trị đã áp dụng — icon lọc ở header của chúng luôn hiện. */
  readonly queryBarActiveKeys = computed(() => {
    const ctx = this.queryBarModel();
    const value = this.#appliedFilter();
    return ctx && value ? sdTableActiveQueryKeys(value, ctx) : new Set<string>();
  });

  /** `aria-label` của icon lọc ở header: "Lọc theo …" / "Đang lọc theo …". */
  filterTriggerLabel(column: SdTableColumn, active: boolean): string {
    const title = typeof column.title === 'string' ? column.title : column.title?.title || column.field;
    return this.#i18n.t(active ? 'core.component.table.filtering-by' : 'core.component.table.filter-by', { title });
  }

  /** Icon lọc ở header: mở chip của field trên thanh (tạo chip nếu chưa có); đóng popover thì focus về icon. */
  openQueryBarField(key: string, trigger: EventTarget | null): void {
    this.queryBar()?.openField(key, trigger instanceof HTMLElement ? trigger : undefined);
  }

  /** Dòng nhắc dưới thanh: field bắt buộc còn rỗng, kể cả quick filter bị ẩn (vẫn chặn đọc). */
  readonly queryBarHint = computed(() => {
    const labels = (this.queryBar()?.invalidFields() ?? []).map(field => field.label);
    const value = this.quickSearchValue();
    for (const item of this.quickSearchOption()?.filters ?? []) {
      const hidden = isSignal(item.hidden) ? item.hidden() : item.hidden;
      if (item.required && hidden && !hasQuickSearchValue(value.filters?.[item.field])) labels.push(item.title);
    }
    // why: external bắt buộc mà thanh không hiện được (custom, filterDef, exclude…) vẫn chặn đọc — phải nói ra.
    const sources = this.queryBarModel()?.sources;
    const external = this.#appliedFilter()?.externalFilter;
    for (const item of this.tableOption()?.filter?.externalFilters ?? []) {
      if (item.required && sources && !sources.has(`external:${item.field}`) && !isRawFilterSet(external?.[item.field])) {
        labels.push(item.title);
      }
    }
    return labels.length ? this.#i18n.t('core.component.query-bar.required', { label: labels.join(', ') }) : '';
  });
  key = Utilities.generateUuid();

  columnOperator: Record<string, Operator> = {};
  columnFilter?: NonNullable<TableFilterValue['columnFilter']> = {};

  #localItems: SdTableItem<T>[] = [];
  #subscription = new Subscription();
  #configurationSubscription?: Subscription;
  #filterRegisterSubscription?: Subscription;
  #optionInstance?: SdTableOption<T>;
  #optionRevision = 0;
  #configurationRevision = 0;
  #configurationReady = false;
  #preparingFilterRequest?: SdTableFilterRequest;
  #hydration?: Promise<void>;
  #retryConfiguration?: () => Promise<void>;
  #pendingReload?: ScheduledTableRead;
  #reload = new Subject<ScheduledTableRead | undefined>();
  #loadCompleted = false;

  cacheValues: Record<string, unknown[]> = {};
  #cacheObjValues: Record<string, Record<string, string>> = {};
  #itemIndexMap = new WeakMap<SdTableItem<T>, number>();
  #treeExpandState = new Map<string, boolean>();
  treeRevision = signal(0);
  readonly expandRevision = signal(0);
  // Search ở cấp con (static tree + type 'local'): predicate khớp 1 dòng theo
  // column filter hiện hành. Set ở #filterLocal khi có filter active, đọc lại ở
  // #render/#ensureChildItemsFormatted dùng predicate này để prune + auto-expand các
  // nhánh có node con khớp. undefined = không search → cây render bình thường.
  #treeSearchPredicate?: (data: T) => boolean;
  // Lần render trước có đang ở chế độ search hay không (để xử lý chuyển trạng thái).
  #treeSearchActive = false;

  // 1. Private Services
  #ref = inject(ChangeDetectorRef);
  readonly #zone = inject(NgZone);
  readonly #injector = inject(Injector);

  #configService = inject(ConfigService);
  #gridFilterService = inject(SdTableFilterService);
  #notifyService = inject(SdNotifyService);
  readonly #i18n = inject(I18nService);
  #tableFormatService = inject(TableFormatService);
  #tableExportService = inject(TableExportService);
  readonly #aggregateNumber = inject(SdFormatNumberPipe);
  readonly #aggregateDate = inject(SdFormatDatePipe);
  readonly #aggregateDatetime = inject(SdFormatDatetimePipe);
  readonly #dateTime = inject(SdDateTimeService);

  #refreshAggregate(): void {
    const configuredOption = this.tableOption();
    if (!configuredOption || !this.#aggregateReady) return;
    const inputOption = this.option();
    const option = { ...configuredOption, aggregate: inputOption.aggregate };
    const config = this.configuration();
    const sourceColumns = new Map<string, SdTableColumnNormal<T>>(
      inputOption.columns.flatMap(column => (column.type === 'children' ? column.children : [column])).map(column => [column.field, column])
    );
    const leaves = [...(config?.firstColumns ?? []), ...(config?.secondColumns ?? [])]
      .filter(column => column.type !== 'children')
      .map(column => ({ ...column, aggregate: sourceColumns.get(column.field)?.aggregate })) as SdTableColumnNormal<T>[];
    const roots = (option.aggregate?.scope === 'filtered' && option.type === 'local' ? this.#aggregateFilteredItems : this.items()).map(
      row => row.data
    );
    this.aggregateSnapshot.set(
      buildAggregateSnapshot({
        columns: leaves,
        roots,
        option,
        complete: !this.loadError() && this.#aggregateScopeComplete,
        loadedChildren: this.#aggregateLoadedChildren,
        predicate: this.#treeSearchPredicate,
        format: (value, column, operation) => this.#formatAggregate(value, column, operation),
        diagnose: error => console.error(error),
        dateTime: this.#dateTime,
      })
    );
    this.#ref.markForCheck();
  }

  #formatAggregate(value: SdTableAggregateResult, column: SdTableColumnNormal<T>, operation?: SdTableAggregateOperation): string {
    if (value == null) return EMPTY_STR;
    if (typeof value === 'number') return this.#aggregateNumber.transform(value, operation === 'COUNT' ? 0 : undefined) ?? EMPTY_STR;
    if (value instanceof Date)
      return (column.type === 'datetime' ? this.#aggregateDatetime.transform(value) : this.#aggregateDate.transform(value)) ?? EMPTY_STR;
    return String(value);
  }

  #clearAggregate(): void {
    this.#aggregateReady = false;
    this.aggregateSnapshot.set({ groups: new Map(), branches: new Map() });
  }

  // Expose state signals từ TableExportService cho template binding.
  exporting = this.#tableExportService.exporting;
  exportTitle = this.#tableExportService.exportTitle;

  // 2. Public & Optional Token
  tableConfiguration = inject<ISdTableConfiguration>(SD_TABLE_CONFIGURATION, { optional: true });

  readonly #host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  readonly #layout = inject(SD_TABLE_LAYOUT, { optional: true });
  /** Bảng chính của khung trang (sd-page-list): lấp phần chiều cao còn lại, giữ tối thiểu header + 5 dòng. */
  readonly fill = computed(() => {
    const target = this.#layout?.fillTarget();
    return !!target && (target === this.#host || target.contains(this.#host));
  });
  /** External filter của bảng chính thu gọn khi khung trang đang ở chế độ màn thấp. */
  readonly externalFilterCollapsedByDefault = computed(() => this.fill() && !!this.#layout?.externalFilterCollapsed());

  constructor() {
    // why: ở chế độ fill bảng co theo chỗ còn lại nhưng vùng dữ liệu giữ tối thiểu header + 5 dòng. Header cao khác
    // nhau (hàng filter dưới cột, header nhóm) và phần cố định của bảng (external filter, quick search, thanh chọn,
    // footer) đổi theo cấu hình, nên đo lại mỗi khi DOM của bảng đổi. min-height: auto không dùng được: nó lấy chiều
    // cao của toàn bộ dòng đang có chứ không phải 5 dòng.
    effect(onCleanup => {
      if (!this.fill()) return;
      const host = this.#host;
      const sync = (): void => {
        const data = host.querySelector<HTMLElement>('.c-container > .c-table');
        const head = data?.querySelector<HTMLElement>('thead')?.offsetHeight ?? 0;
        const row = parseFloat(getComputedStyle(host).getPropertyValue('--mat-table-row-item-container-height')) || 36;
        const dataMin = head + 5 * row;
        const fixed = data ? host.offsetHeight - data.offsetHeight : 0;
        host.style.setProperty('--sd-table-fill-head', `${head}px`);
        host.style.setProperty('--sd-table-fill-min', `${fixed + dataMin}px`);
      };
      const observer = new MutationObserver(sync);
      observer.observe(host, { childList: true, subtree: true });
      // why: chiều cao phần cố định còn đổi mà không đổi DOM (class fill vừa gắn, chữ xuống dòng khi hẹp).
      const resize = typeof ResizeObserver === 'function' ? new ResizeObserver(sync) : null;
      resize?.observe(host);
      sync();
      onCleanup(() => {
        observer.disconnect();
        resize?.disconnect();
        host.style.removeProperty('--sd-table-fill-head');
        host.style.removeProperty('--sd-table-fill-min');
      });
    });

    // why: the loading layer follows `loading()` and the read schedule; the progress bar timer and the status
    // region only change on those transitions, so rows, settings and errors are read untracked.
    effect(() => {
      const loading = this.loading();
      const scheduled = this.#readScheduled();
      const view = this.loadingView();
      untracked(() => {
        const rows = this.items().length > 0;
        this.#refresh.update({ loading, scheduled, skeleton: view === 'skeleton', rows }, this.loadingSettings());
        if (view === 'skeleton' && loading) this.#skeletonHeld.set(true);
        else if (!scheduled || rows) this.#skeletonHeld.set(false);
        // why: "loading" is announced only once a read really runs, so a skeleton that resolves at once (column
        // lookups, synchronous local data) says nothing; it stays active through the debounce of a replacing read.
        const active = view !== 'none' && (loading || (this.#liveLoading && scheduled));
        // A new read clears an earlier "loaded N", so the virtual cursor never reads a count that is out of date.
        if (loading && !active && this.#liveMessage()) this.#liveMessage.set('');
        this.#announceLoading(active);
        // why: measured before the skeleton renders, under the header that is already on screen, so the row
        // count is right in the first frame instead of jumping from 5.
        if (view === 'skeleton') this.#skeletonFill.set(this.#measureSkeletonFill());
      });
    });

    // why: the empty block has no live role (content inserted together with its region is not read reliably), so
    // the status region says it, also after a read too fast to show the loading layer. Defined after the loading
    // effect, which clears the region when a read starts, so the same text is read again for the next empty result.
    effect(() => {
      const key = this.#emptyKey();
      if (key) untracked(() => this.#liveMessage.set(this.#i18n.t(key)));
    });

    // why: the progress bar sits in .c-container (so it does not scroll sideways with the table) right under the
    // last header row; that row's bottom depends on grouped headers, the filter row and wrapping titles. Only
    // measured while the bar shows.
    effect(onCleanup => {
      if (this.loadingView() !== 'refresh' || this.mobileCards()) return;
      const host = this.#host;
      let resize: ResizeObserver | null = null;
      const measure = (): boolean => {
        const data = host.querySelector<HTMLElement>('.c-container > .c-table');
        const head = data?.querySelector<HTMLElement>(':scope > table > thead');
        if (!data || !head) return false;
        const sync = (): void => host.style.setProperty('--sd-table-head-h', `${data.offsetTop + head.offsetHeight}px`);
        resize = typeof ResizeObserver === 'function' ? new ResizeObserver(sync) : null;
        resize?.observe(head);
        sync();
        return true;
      };
      // why: right after a mobile → desktop switch the table is not in the DOM yet when this runs.
      const later = measure() ? undefined : afterNextRender(() => void measure(), { injector: this.#injector });
      onCleanup(() => {
        later?.destroy();
        resize?.disconnect();
        host.style.removeProperty('--sd-table-head-h');
      });
    });

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
          this.#configStorage = storage;
          this.#configurationSubscription?.unsubscribe();
          this.#configurationSubscription = storage.observer.subscribe(configuration => {
            this.#configuredTable.set(configuration);
            const configurationRevision = ++this.#configurationRevision;
            const valid = () =>
              !this.#destroyed &&
              optionRevision === this.#optionRevision &&
              configurationRevision === this.#configurationRevision &&
              this.option() === option;
            this.#hydration = this.#hydrateConfiguration(initOpt, configuration, valid);
          });
          this.#subscription.add(this.#configurationSubscription);
        });
      }
    });

    effect(() => {
      this.#filterRegisterRevision();
      const values = (this.quickSearchOption()?.filters || [])
        .filter(item => isSignal(item.default))
        .map(item => ({ field: item.field, value: isSignal(item.default) ? item.default() : undefined }));
      untracked(() => {
        if (!this.filterRegister || !values.length) return;
        const current = this.filterRegister.value.get().quickSearch || { term: '', filters: {} };
        const changed = values.filter(item => !sameQuickSearchValue(current.filters[item.field], item.value));
        if (!changed.length) return;
        const filters = { ...current.filters };
        for (const item of changed) filters[item.field] = Array.isArray(item.value) ? [...item.value] : item.value;
        // why: đồng bộ từ store không phát onChange, tránh vòng lặp giữa hai màn dùng chung tenant.
        this.filterRegister.value.set({ quickSearch: { ...current, filters } });
      });
    });

    // Query bar: field đổi (cột, inlineExternal, ngôn ngữ) thì đồng bộ lại; vừa vào mode (desktop) thì dựng lại từ raw.
    effect(() => {
      const ctx = this.queryBarModel();
      untracked(() => {
        if (!ctx) {
          this.#barActive = false;
          return;
        }
        if (!this.filterRegister) return;
        const rebuild = !this.#barActive;
        this.#barActive = true;
        this.#syncQueryBar(this.filterRegister.value.get(), rebuild);
      });
    });

    // Query bar: raw đổi trong lúc popover đang mở / chip đang dựng thì hoãn; đóng xong mới đồng bộ.
    effect(() => {
      const bar = this.queryBar();
      if (bar && (bar.editingIndex() !== null || bar.building())) return;
      untracked(() => {
        if (this.#barPending && this.filterRegister) this.#syncQueryBar(this.filterRegister.value.get(), false);
      });
    });

    // Query bar: field không lên được thanh vẫn gửi giá trị — báo cho dev một lần mỗi bảng.
    effect(() => {
      const excluded = this.queryBarModel()?.excluded;
      if (!excluded?.length || this.#barWarned || !isDevMode()) return;
      this.#barWarned = true;
      console.warn(
        '[sd-table] filter.mode "query-bar": these filters are not on the query bar. Their values are still sent; keep filter.mode "default" if users must edit them.',
        excluded
      );
    });

    effect(onCleanup => {
      const paginator = this.paginator();
      if (paginator) {
        untracked(() => {
          const subscription = paginator.page.subscribe(() => {
            this.pageRevision.update(n => n + 1);
            this.#requestReload(false);
          });
          onCleanup(() => subscription.unsubscribe());
        });
      }
    });

    effect(onCleanup => {
      const sort = this.sort();
      if (sort) {
        untracked(() => {
          const subscription = sort.sortChange.subscribe(state => {
            this.sortState.set(state);
            this.#ref.markForCheck();
            // why: without a total, page N of the old order says nothing about the new order.
            this.#resetUnknownTotalPage();
            this.#requestReload(false);
          });
          onCleanup(() => subscription.unsubscribe());
        });
      }
    });

    effect(() => {
      this.mobileCards();
      untracked(() => this.mobileFilter()?.close());
    });

    effect(() => {
      const items = this.items();
      this.#itemIndexMap = new WeakMap();
      items.forEach((item, idx) => this.#itemIndexMap.set(item, idx));
    });

    this.#subscription.add(
      this.#configService.widthChange$.subscribe(({ field, width }) => {
        // why: persistColumnWidth ghi storage im lặng (observer không phát) nên đọc lại để chấm trên nút Thiết lập bật.
        this.#configuredTable.set(this.#configStorage?.get());
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
          // why: mọi ý định đọc dùng chung lịch; filter mới hoặc refresh hủy được cả initial read đang chờ.
          switchMap(data =>
            data
              ? timer(data.delay).pipe(
                  switchMap(async () => {
                    if (data !== this.#pendingReload || data.revision !== this.#optionRevision || !this.#configurationReady)
                      return undefined;
                    this.#pendingReload = undefined;
                    // #load raises `loading` synchronously, so the pager stays busy without a gap.
                    this.#readScheduled.set(false);
                    const filterInfo = this.getFilterRequest();
                    const result = await this.#load(filterInfo, !this.#loadCompleted || data.force);
                    if (data.revision !== this.#optionRevision || !result) return undefined;
                    // why: a blocked initial local read must still load its source after required values arrive.
                    if (quickSearchValid(this.quickSearchOption(), filterInfo.quickSearch)) this.#loadCompleted = true;
                    return { result, revision: data.revision };
                  })
                )
              : EMPTY
          )
        )
        .subscribe(loadResult => {
          if (!loadResult || loadResult.revision !== this.#optionRevision) return;
          this.#render(loadResult.result);
        })
    );
  }

  ngOnDestroy() {
    this.#destroyed = true;
    this.#refresh.destroy();
    this.#cancelReload();
    this.#retryConfiguration = undefined;
    this.#read.invalidate();
    this.#failedRead = undefined;
    this.#subscription.unsubscribe();
  }

  /**
   * "Loading" when the loading layer shows; once the read ends, the row count, or the text of the empty block.
   * The default error region announces itself (`role="alert"`), so the region is cleared; a custom
   * `sdDataStateTemplate` may have no role, so the region reads the error. Reads faster than `showDelay` announce
   * only an empty result (see the empty effect).
   */
  #announceLoading(active: boolean): void {
    if (active === this.#liveLoading) return;
    this.#liveLoading = active;
    if (active) {
      this.#liveMessage.set(this.#i18n.t('core.component.table.loading'));
      return;
    }
    // Rows on screen: a tree also shows the children of its expanded rows.
    const count = this.tableOption()?.tree ? countVisibleTreeRows(this.items()) : this.items().length;
    const failed = this.readState().status === 'error' || this.loadError();
    if (count)
      this.#liveMessage.set(this.#i18n.t(count === 1 ? 'core.component.table.loaded-one' : 'core.component.table.loaded', { count }));
    else if (failed && !!this.dataStateTemplate() && !this.hideReadError())
      this.#liveMessage.set(this.#i18n.t('core.component.table.error-occurred'));
    else {
      const empty = this.#emptyKey();
      this.#liveMessage.set(empty ? this.#i18n.t(empty) : '');
    }
  }

  /** Skeleton rows that fill a table with a fixed height (fill mode, `style.maxHeight`); `undefined` otherwise. */
  #measureSkeletonFill(): number | undefined {
    const option = this.tableOption();
    const fill = this.fill();
    if ((!fill && !option?.style?.maxHeight) || this.mobileCards()) return undefined;
    const data = this.#host.querySelector<HTMLElement>('.c-container > .c-table');
    if (!data) return undefined;
    // A percentage max-height resolves to a percentage, not pixels: fall back to the default count.
    const box = fill ? data.clientHeight : pixelLength(getComputedStyle(data).maxHeight);
    if (box === undefined) return undefined;
    const head = data.querySelector<HTMLElement>(':scope > table > thead')?.offsetHeight ?? 0;
    const row = parseFloat(getComputedStyle(this.#host).getPropertyValue('--mat-table-row-item-container-height')) || 36;
    return skeletonFillRows(box - head, row, option?.paginate?.pageSize);
  }

  // --- GIỮ NGUYÊN TẤT CẢ CÁC HÀM FILTER VÀ EXPORT CŨ CỦA BẠN ---
  #filterExportInfo = (pageNumber: number, pageSize: number): SdTableFilterRequest => {
    const { columnOperator, columnFilter, externalFilter, quickSearch } = this.filterRegister.value.get();
    return {
      columnOperator: columnOperator || {},
      rawColumnFilter: columnFilter || {},
      rawExternalFilter: externalFilter || {},
      ...(this.quickSearchOption() ? { quickSearch: quickSearch || { term: '', filters: {} } } : {}),
      orderBy: this.sort()?.active || '',
      orderDirection: this.sort()?.direction === 'asc' ? 'ASC' : this.sort()?.direction === 'desc' ? 'DESC' : undefined,
      pageNumber,
      pageSize,
      isExported: true,
    };
  };

  #cancelReload = () => {
    this.#pendingReload = undefined;
    this.#readScheduled.set(false);
    this.#reload.next(undefined);
  };

  #requestReload = (force: boolean, delay = 200, source: 'filter' | 'read' = 'read') => {
    if (this.#destroyed || !this.#configurationReady) return;
    if (this.#preparingFilterRequest) {
      Object.assign(this.#preparingFilterRequest, this.getFilterRequest());
      return;
    }
    this.#read.invalidate();
    this.#failedRead = undefined;
    this.loading.set(false);
    this.#pendingReload = { force: force || !!this.#pendingReload?.force, revision: this.#optionRevision, delay, source };
    this.#readScheduled.set(true);
    this.#reload.next(this.#pendingReload);
  };

  /** Unknown-total mode: the page a read asks for; the first page until the user pages. */
  #unknownTarget = (): SdTablePagePosition =>
    this.#pageTarget() ?? { pageIndex: 0, pageSize: this.tableOption()?.paginate?.pageSize || 50 };

  /** Filter, quick search and sort changes restart unknown-total paging at the first page, keeping the page size. */
  #resetUnknownTotalPage = () => {
    if (!this.unknownTotal()) return;
    this.#pageTarget.set({ pageIndex: 0, pageSize: this.#unknownTarget().pageSize });
  };

  #warnedMissingTotal = false;
  /** Known-total tables keep `total || 0`; a `{ items, hasMore }` result there is a missing `paginate.total: 'unknown'`. */
  #warnMissingTotal = (response: unknown) => {
    const result = response as { total?: unknown; hasMore?: unknown } | null | undefined;
    if (this.#warnedMissingTotal || !result || typeof result.total === 'number' || typeof result.hasMore !== 'boolean') return;
    this.#warnedMissingTotal = true;
    console.warn(
      `sd-table: items() resolved { items, hasMore } without a total; declare paginate: { total: 'unknown' } to page without a total.`
    );
  };

  /** A requested page will not be read after all: point the target back at the shown page. */
  #settleUnknownTotalTarget = () => {
    const shown = this.#shownPage();
    if (!this.unknownTotal() || !shown) return;
    this.#pageTarget.set({ pageIndex: shown.pageIndex, pageSize: shown.pageSize });
  };

  /** Previous/Next/First and page-size changes of the unknown-total paginator. */
  onUnknownTotalPage = (event: SdTableUnknownTotalPageEvent) => {
    const pager = this.unknownTotalPager();
    if (!pager || pager.busy) return;
    const sizeChanged = event.pageSize !== pager.pageSize;
    if (!sizeChanged) {
      if (event.pageIndex === pager.pageIndex || event.pageIndex < 0) return;
      if (event.pageIndex > pager.pageIndex && (!pager.hasNext || event.pageIndex !== pager.pageIndex + 1)) return;
      if (event.pageIndex < pager.pageIndex && !pager.hasPrevious) return;
    }
    this.#pageTarget.set(
      sizeChanged ? { pageIndex: 0, pageSize: event.pageSize } : { pageIndex: event.pageIndex, pageSize: pager.pageSize }
    );
    this.pageRevision.update(n => n + 1);
    this.#requestReload(false);
  };

  #resetStateForNewOption = () => {
    this.#clearAggregate();
    this.#aggregateLoadedChildren.clear();
    this.#aggregateFilteredItems = [];
    this.#configurationReady = false;
    this.#cancelReload();
    this.#hydration = undefined;
    this.#retryConfiguration = undefined;
    this.#read.invalidate();
    this.#failedRead = undefined;
    this.#optionRevision += 1;
    this.#configurationSubscription?.unsubscribe();
    this.#configurationSubscription = undefined;
    this.#filterRegisterSubscription?.unsubscribe();
    this.#filterRegisterSubscription = undefined;
    this.#filterConfigurationSubscription?.unsubscribe();
    this.#filterConfigurationSubscription = undefined;
    this.filterRegister = undefined!;
    this.quickSearchValue.set({ term: '', filters: {} });
    this.#appliedFilter.set(undefined);
    this.#inlineExternal.set({});
    this.#inlineExternalSetup.set(undefined);
    this.#barDerived = [];
    this.barFilters.set([]);
    this.#barWritten = this.barFilters();
    this.barSearch.set('');
    this.#barTerm = undefined;
    this.#barActive = false;
    this.#barPending = false;

    this.#tableId = Utilities.generateUuid();
    this.key = Utilities.generateUuid();
    this.#loadCompleted = false;

    this.tableOption.set(undefined);
    this.configuration.set(undefined);
    this.items.set([]);
    this.selectedTableItems.set([]);
    this.total.set(undefined);
    this.#pageTarget.set(undefined);
    this.#shownPage.set(undefined);
    this.loading.set(false);
    this.isSelectAll.set(false);
    this.isSelectIndeterminate.set(false);
    this.loadError.set(false);
    this.sortState.set({ active: '', direction: '' });
    this.pageRevision.update(n => n + 1);
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
      total: option?.paginate?.total,
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
    // why: chỉ ghi khi configuration có giá trị — bảng không dùng mode mới giữ nguyên object filter của consumer.
    const filterConfiguration = this.tableConfiguration?.filter;
    if (option.filter.mode === undefined && filterConfiguration?.mode) option.filter.mode = filterConfiguration.mode;
    if (filterConfiguration?.queryBar) option.filter.queryBar = { ...filterConfiguration.queryBar, ...option.filter.queryBar };
    // why: cột con của header nhóm cũng có filter và operator riêng.
    for (const column of leafColumns(option.columns)) {
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

  #hydrateConfiguration = async (option: SdTableOption, configuration: ConfiguredTable, valid: () => boolean): Promise<void> => {
    if (!valid()) return;
    this.#clearAggregate();
    this.#configurationReady = false;
    this.#cancelReload();
    this.#failedRead = undefined;
    this.#retryConfiguration = undefined;
    this.#read.invalidate();
    this.loading.set(false);
    try {
      const result = this.#configService.loadConfigurationResult(option, configuration);
      // why: lookup cũ có thể hoàn tất sau cấu hình/scope mới; chỉ commit cache của lần hydrate còn hiệu lực.
      const values = cloneReadRequest(this.cacheValues);
      const objectValues = cloneReadRequest(this.#cacheObjValues);
      // why: cột lá — cột `values` nằm dưới header nhóm (`type: 'children'`) cũng cần danh sách để hiện nhãn và để lọc.
      await this.#tableFormatService.loadValues(
        leafColumns(option.columns).filter(column => result.displayedColumns.includes(column.field)),
        values,
        objectValues
      );
      if (!valid()) return;
      this.cacheValues = values;
      this.#cacheObjValues = objectValues;
      this.configuration.set(result);
      this.#loadFilterRegister();
      // why: form/required controls phải nhận snapshot đã hydrate trước khi cho phép đọc.
      this.#ref.detectChanges();
      if (!valid()) return;
      this.#configurationReady = true;
      this.#requestReload(true);
    } catch (error) {
      if (!valid()) return;
      this.#retryConfiguration = () => (this.#hydration = this.#hydrateConfiguration(option, configuration, valid));
      const revision = this.#read.begin(valid);
      this.#clearRowsForError();
      this.#read.fail(revision, error);
      this.loading.set(false);
    } finally {
      if (valid()) this.#ref.markForCheck();
    }
  };

  #loadFilterRegister = () => {
    const opt = this.tableOption();
    if (!opt || this.filterRegister) return;

    this.filterRegister = this.#gridFilterService.register(opt?.filter, {
      id: this.#tableId,
      columns: opt?.columns,
      externalFilters: opt?.filter?.externalFilters,
      quickSearch: this.quickSearchOption(),
      filterDefs: [...this.sdFilterDefs()],
      columnOperator: this.columnOperator,
      force: true,
    });

    // Query bar: chip ghim theo inlineExternal (người dùng đổi ở mode default). Đăng ký trước value để lần đồng bộ đầu
    // đã có giá trị này.
    this.#filterConfigurationSubscription?.unsubscribe();
    this.#filterConfigurationSubscription = this.filterRegister.configuration.observer.subscribe(configuration => {
      this.#inlineExternal.set(configuration.inlineExternal || {});
      this.#inlineExternalSetup.set(configuration.inlineExternal || {});
    });
    this.#subscription.add(this.#filterConfigurationSubscription);

    this.#filterRegisterSubscription?.unsubscribe();
    this.#filterRegisterSubscription = this.filterRegister.value.observer.subscribe(value => {
      this.quickSearchValue.set(value.quickSearch || { term: '', filters: {} });
      this.columnOperator = value.columnOperator || {};
      this.#syncColumnFilterInPlace(value.columnFilter || {});
      this.#appliedFilter.set(value);
      // why: lần phát do thanh áp dụng thì dựng lại thanh từ raw (nháp đã nằm trong raw); lần phát từ ngoài thì giữ nháp.
      this.#syncQueryBar(value, this.#barApplying);
      // why: hydrate ban đầu và onFilter chuẩn bị chính request hiện tại; không phát lịch đọc tự hủy nhánh đang chờ render.
      if (!this.#configurationReady) return;
      if (this.#preparingFilterRequest) {
        Object.assign(this.#preparingFilterRequest, this.getFilterRequest());
        return;
      }
      if (value.notReload) {
        if (this.#pendingReload?.source === 'filter' && !this.#pendingReload.force) {
          this.#cancelReload();
          // why: the cancelled filter read had moved the target to the first page; without a read the
          // paginator must point at the rows still on screen again, not stay locked between two pages.
          this.#settleUnknownTotalTarget();
        }
        return;
      }
      if (this.paginator()) this.paginator()!.pageIndex = 0;
      this.#resetUnknownTotalPage();
      // Giữ thời gian chờ tương tác cũ: filter 500ms + reload 200ms, trên cùng một lịch có thể hủy.
      this.#requestReload(false, 700, 'filter');
    });
    this.#subscription.add(this.#filterRegisterSubscription);
    this.#filterRegisterRevision.update(value => value + 1);
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
    const result = filterLocalItems(localItems, { ...this.tableOption()!, dateTime: this.#dateTime }, filterInfo);
    this.#treeSearchPredicate = result.treeSearchPredicate;
    return {
      items: result.items,
      filteredItems: result.filteredItems,
      total: result.total,
    };
  };

  getFilterRequest = (): SdTableFilterRequest => {
    const { columnOperator, columnFilter, externalFilter, quickSearch } = this.filterRegister.value.get();
    const target = this.unknownTotal() ? this.#unknownTarget() : undefined;
    return {
      columnOperator: columnOperator || {},
      rawColumnFilter: columnFilter || {},
      rawExternalFilter: externalFilter || {},
      ...(this.quickSearchOption() ? { quickSearch: quickSearch || { term: '', filters: {} } } : {}),
      orderBy: this.sort()?.active || '',
      orderDirection: this.sort()?.direction === 'asc' ? 'ASC' : this.sort()?.direction === 'desc' ? 'DESC' : undefined,
      pageNumber: target ? target.pageIndex : this.paginator()?.pageIndex || 0,
      pageSize: target ? target.pageSize : this.paginator()?.pageSize || this.tableOption()?.paginate?.pageSize || 50,
      visibledColumns: ArrayUtilities.union('field', this.configuration()?.firstColumns || [], this.configuration()?.secondColumns || []),
    };
  };

  #isFiltered = (filterReq: SdTableFilterRequest) => {
    if (filterReq.quickSearch?.term?.trim() || Object.values(filterReq.quickSearch?.filters || {}).some(hasQuickSearchValue)) return true;
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

  /**
   * External filter `required` có giá trị chưa. Mode default đọc form của `ExternalFilterComponent` như trước; mode
   * query-bar không có form đó nên kiểm tra trên giá trị đã áp dụng.
   */
  #externalFilterValid = (filterReq: SdTableFilterRequest): boolean => {
    if (!this.queryBarMode()) return !this.externalFilter()?.form?.invalid;
    return (this.tableOption()?.filter?.externalFilters ?? []).every(
      item => !item.required || isRawFilterSet(filterReq.rawExternalFilter?.[item.field])
    );
  };

  #checkFilter = (filterReq: SdTableFilterRequest) => {
    this.isFiltered.set(this.#isFiltered(filterReq));
    this.requireFiltered.set(!!this.tableOption()?.filter?.externalFilters?.some(e => e.required) || !this.quickSearchValid());
  };

  #load = async (filterReq: SdTableFilterRequest, force = true): Promise<TableReadResult<T> | undefined> => {
    this.#clearAggregate();
    this.loading.set(true);
    if (force || this.tableOption()?.type === 'server') this.loadError.set(false);
    this.#ref.detectChanges();
    this.#checkFilter(filterReq);

    const opt = this.tableOption()!;
    let validQuickSearch = quickSearchValid(this.quickSearchOption(), filterReq.quickSearch);
    if (opt.type === 'local' && !validQuickSearch) {
      this.loading.set(false);
      return { items: [], total: 0, aggregateComplete: false };
    }
    if (opt.type === 'server') {
      const { items, onFilter } = opt;
      this.#preparingFilterRequest = filterReq;
      try {
        try {
          onFilter?.(filterReq, {
            externalFilterValid: this.#externalFilterValid(filterReq),
            quickSearchValid: validQuickSearch,
          });
        } catch (err) {
          console.error(err);
        }
        // why: form phải nhận model vừa hydrate trước khi kiểm tra required; emission từ control vẫn thuộc request này.
        if (onFilter) this.#ref.detectChanges();
      } finally {
        this.#preparingFilterRequest = undefined;
      }
      // why: onFilter có thể hydrate tenant/filter từ URL trước khi chụp snapshot; kiểm tra giá trị đã áp dụng.
      validQuickSearch = quickSearchValid(this.quickSearchOption(), filterReq.quickSearch);
      this.#checkFilter(filterReq);
      if (!this.#externalFilterValid(filterReq) || !validQuickSearch) {
        this.#read.invalidate();
        this.#failedRead = undefined;
        this.loading.set(false);
        this.#ref.detectChanges();
        return {
          items: [],
          total: 0,
          aggregateComplete: false,
          page: { pageIndex: filterReq.pageNumber, pageSize: filterReq.pageSize },
        };
      }
      const snapshot = cloneReadRequest(filterReq);
      const pagingReq = SdConvertToPagingReq(snapshot, {
        columns: opt.columns,
        externalFilters: opt.filter?.externalFilters,
        quickSearch: this.quickSearchOption(),
        dateTime: this.#dateTime,
      });
      const optionRevision = this.#optionRevision;
      const sourceOption = this.option();
      const context = this.#readContext();
      const valid = () =>
        !this.#destroyed &&
        optionRevision === this.#optionRevision &&
        this.tableOption()?.items === items &&
        this.option() === sourceOption &&
        this.option().items === items &&
        context === this.#readContext();
      return this.#runServerRead({ filter: snapshot, paging: cloneReadRequest(pagingReq), option: { ...opt, items }, valid });
    }
    if (force) {
      const { items } = opt;
      let data: T[];
      try {
        data = await items();
      } catch (err) {
        this.loadError.set(true);
        this.#notifyService.warning(this.#i18n.t('core.component.table.error-occurred'));
        console.error(err);
        data = [];
      }
      if (!Array.isArray(data)) {
        this.loadError.set(true);
        this.#notifyService.warning(this.#i18n.t('core.component.table.not-an-array'));
        data = [];
      }
      this.#localItems = await this.#tableFormatService.format(data, opt.columns, this.cacheValues, this.#cacheObjValues, opt.rowKey);
    }
    this.loading.set(false);
    if (!this.#destroyed) this.#ref.detectChanges();
    return this.#filterLocal(this.#localItems, filterReq);
  };

  #readContext = () => {
    const request = this.getFilterRequest();
    // why: resize/đổi nhãn cột không reload dữ liệu; chỉ field ảnh hưởng nội dung truy vấn.
    return Utilities.hash({ ...request, visibledColumns: request.visibledColumns?.map(column => column.field) });
  };

  #runServerRead = async (request: ServerReadRequest<T>): Promise<TableReadResult<T> | undefined> => {
    this.#clearAggregate();
    const revision = this.#read.begin(request.valid);
    this.#failedRead = undefined;
    this.loading.set(true);
    try {
      // why: mỗi lần gọi nhận bản sao riêng; loader không được sửa snapshot dành cho retry.
      const response = await request.option.items(cloneReadRequest(request.filter), cloneReadRequest(request.paging));
      if (!this.#read.isCurrent(revision)) return undefined;
      const page = { pageIndex: request.filter.pageNumber, pageSize: request.filter.pageSize };
      // why: unknown-total loaders must prove the next page; a malformed result fails this read (with retry).
      const unknown = isUnknownTotal(request.option) ? readUnknownTotalPage<T>(response, page.pageSize) : undefined;
      const rows = unknown ? unknown.items : response?.items;
      // why: formatter có await và ghi cache; chỉ commit bản riêng khi request còn hiện hành.
      const values = cloneReadRequest(this.cacheValues);
      const objectValues = cloneReadRequest(this.#cacheObjValues);
      const formatted = await this.#tableFormatService.format(rows, request.option.columns, values, objectValues, request.option.rowKey);
      if (!this.#read.succeed(revision, rows?.length || 0)) return undefined;
      if (!this.#read.isCurrent(revision)) return undefined;
      this.cacheValues = values;
      this.#cacheObjValues = objectValues;
      if (!unknown) this.#warnMissingTotal(response);
      const total = unknown ? 0 : (response as { total?: number } | undefined)?.total || 0;
      return { items: formatted, total, hasMore: unknown?.hasMore, page, readRevision: revision };
    } catch (error) {
      if (this.#read.isCurrent(revision)) {
        this.#failedRead = request;
        this.#clearRowsForError();
        this.#read.fail(revision, error);
      }
      return undefined;
    } finally {
      if (this.#read.isCurrent(revision)) {
        this.loading.set(false);
        this.#ref.markForCheck();
      } else if (this.#read.isLatest(revision) && !this.#destroyed) {
        // why: a filter commit without reload (`notReload`) moves the read context, so this response is
        // dropped although no newer read will follow; release loading instead of locking the table.
        this.#read.invalidate();
        this.loading.set(false);
        this.#settleUnknownTotalTarget();
        this.#ref.markForCheck();
      }
    }
  };

  // why: end user thấy dòng dữ liệu là hiểu "không lỗi"; lần đọc hiện hành lỗi phải gỡ dòng/total của
  // lần đọc trước để dữ liệu và vùng lỗi không bao giờ cùng hiển thị (NSP-4877). Retry vẫn dùng snapshot cũ.
  #clearRowsForError = () => {
    this.items.set([]);
    this.total.set(undefined);
    this.#updateSelectedItems();
    this.#syncSelectAllState();
  };

  /** Retry current hydration or the still-valid failed server request, without resetting filters or paging. */
  retryRead = async (): Promise<void> => {
    if (this.#destroyed) return;
    if (this.#retryConfiguration) {
      await this.#retryConfiguration();
      return;
    }
    const request = this.#failedRead;
    if (!request || this.readState().status !== 'error') return;
    if (!request.valid()) {
      this.#failedRead = undefined;
      this.#read.invalidate();
      return;
    }
    const result = await this.#runServerRead(request);
    if (result) await this.#render(result, false, { fromSource: 'RELOAD' });
  };

  #render = async (args: TableReadResult<T> | undefined, scrollTop = true, additionArgs?: { fromSource?: 'PAGING' | 'RELOAD' }) => {
    if (this.#destroyed) return;
    if (!args || (args.readRevision !== undefined && !this.#read.isCurrent(args.readRevision))) return;
    const optionRevision = this.#optionRevision;
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
    if (this.unknownTotal()) {
      // why: rows and their page label change in the same synchronous step; nothing else writes the shown page.
      this.total.set(undefined);
      const items = this.items();
      this.#shownPage.set({ ...(args.page ?? this.#unknownTarget()), count: items.length, hasMore: !!args.hasMore && items.length > 0 });
    } else {
      this.total.set(args?.total || 0);
    }

    if (treeOpt) {
      initTreeMeta(this.items(), treeOpt, {
        expandState: this.#treeExpandState,
        treeSearchPredicate: this.#treeSearchPredicate,
      });
      await this.#expandDefaultBranches(this.items(), treeOpt);
      if (optionRevision !== this.#optionRevision) return;
      if (args.readRevision !== undefined && !this.#read.isCurrent(args.readRevision)) return;
      this.treeRevision.update(n => n + 1);
    }
    this.#treeSearchActive = searchNow;

    // why: lựa chọn được giữ qua các trang ưu tiên hơn default của lần tải mới.
    this.#applyDefaultSelected();
    this.#restorePreservedSelection();
    if (this.tableOption()?.selector?.single) {
      const rows = collectFormattedTreeRows(this.items());
      const chosen = this.#preservedSelectedMap.values().next().value ?? rows.find(row => row.meta.selector?.isSelected);
      for (const row of rows) row.meta.selector!.isSelected = row.meta.id === chosen?.meta.id;
    }

    // Resolve style.rowCss 1 lần/row cho lần render này (xem #applyRowStyles).
    this.#applyRowStyles();

    await this.tableOption()?.reload?.onReload?.(this.items(), additionArgs);
    if (optionRevision !== this.#optionRevision) return;
    if (args.readRevision !== undefined && !this.#read.isCurrent(args.readRevision)) return;
    this.#aggregateFilteredItems = args.filteredItems ?? args.items;
    this.#aggregateScopeComplete = args.aggregateComplete !== false;
    this.#aggregateReady = true;
    this.#refreshAggregate();
    this.#updateSelectedItems();
    this.#syncSelectAllState();

    setTimeout(() => {
      if (this.#destroyed || (args.readRevision !== undefined && !this.#read.isCurrent(args.readRevision))) return;
      this.table()?.updateStickyColumnStyles();
      this.table()?.updateStickyFooterRowStyles();
    }, 0);
  };

  reload = async (force = true, scrollTop = true) => {
    if (this.#destroyed) return;
    const optionRevision = this.#optionRevision;
    const sourceOption = this.option();
    // why: input có thể đã đổi trước khi effect reset cấu hình/filter của option cũ.
    if (this.#optionInstance !== sourceOption) return;
    if (!this.#configurationReady) {
      if (this.#retryConfiguration) await this.#retryConfiguration();
      while (
        !this.#configurationReady &&
        this.#hydration &&
        !this.#retryConfiguration &&
        !this.#destroyed &&
        optionRevision === this.#optionRevision &&
        sourceOption === this.option()
      )
        await this.#hydration;
    }
    if (this.#destroyed || optionRevision !== this.#optionRevision || sourceOption !== this.option() || !this.#configurationReady) return;
    this.#cancelReload();
    const columnFilter = { ...this.columnFilter };
    const columnOperator = { ...this.columnOperator };
    this.externalFilter()?.updateFilter?.();
    // Commit pending column filter value (input/input-number gõ dở chưa enter/blur)
    // vào filterRegister trước khi đọc filter request — tránh storage stale.
    this.filterRegister?.value.set({
      columnOperator,
      columnFilter,
      notReload: true,
    });
    const data = await this.#load(this.getFilterRequest(), force);
    await this.#render(data, scrollTop, { fromSource: 'RELOAD' });
  };

  #exportedItems = async (pageNumber = 0, pageSize = 100) => {
    const opt = this.tableOption()!;
    if (!this.quickSearchValid()) return { items: [], total: 0 };
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
          quickSearch: this.quickSearchOption(),
          dateTime: this.#dateTime,
        });
        const result = await opt.items(filterReq, pagingReq);
        // why: a lookahead row past the chunk would be exported twice once the next chunk starts at its offset.
        return isUnknownTotal(opt) ? readUnknownTotalPage<T>(result, pageSize) : result;
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
      total: this.unknownTotal() ? undefined : this.total() || 0,
      cacheObjValues: this.#cacheObjValues,
      getFilterInfo: () => this.getFilterRequest(),
      fetchChunk: (pageNumber: number, pageSize: number) => this.#exportedItems(pageNumber, pageSize),
    };
  };

  /**
   * Reads the first page again with the current filters and sort. For a condition the table does not own (status
   * tabs, score cards above the table): changing it must restart paging, as a filter of the table does.
   */
  reloadFirstPage = async (): Promise<void> => {
    if (this.paginator()) this.paginator()!.pageIndex = 0;
    this.#resetUnknownTotalPage();
    await this.reload(true, true);
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
      this.#updateSelectedItems();
      this.#syncSelectAllState();
      this.#ref.markForCheck();
      return;
    }

    let loadedChildren = false;
    try {
      // isLazyTree() narrow treeOpt về TableOptionTreeLazy → truy cập onExpandChildren an toàn.
      if (isLazyTree(treeOpt) && hasLazyChildren(row, treeOpt)) {
        row.meta.tree.isExpanding = true;
        this.#ref.markForCheck();
        const key = getChildrenKey(treeOpt);
        const result = await Promise.resolve(treeOpt.onExpandChildren(row.data));
        if (this.#destroyed || treeOpt !== this.tableOption()?.tree) return;
        (row.data as Record<string, unknown>)[key] = Array.isArray(result) ? result : [];
        this.#aggregateLoadedChildren.add(row.data);
        loadedChildren = true;
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
      if (loadedChildren) this.#refreshAggregate();
      this.#restorePreservedSelection();
      this.#updateSelectedItems();
      this.#syncSelectAllState();
      this.#ref.markForCheck();
    }
  };

  onFilterChange = () => {
    const columnFilter = { ...this.columnFilter };
    const columnOperator = { ...this.columnOperator };
    this.externalFilter()?.updateFilter?.();
    this.filterRegister.value.set({
      columnOperator,
      columnFilter,
    });
  };

  onQuickSearchChange = (value: SdTableQuickSearchValue): void => {
    this.filterRegister.value.set({ quickSearch: value });
  };

  /**
   * Query bar `(apply)`: ghi cả thanh vào filter register trong một lần `value.set`, rồi gọi callback của các filter
   * vừa đổi như control mặc định. Reload, cache, `filtered` đi đường cũ.
   */
  onQueryBarApply = (query: SdQuery): void => {
    const ctx = this.queryBarModel();
    if (!ctx || !this.filterRegister) return;
    const current = this.filterRegister.value.get();
    // why: lần áp dụng do đổi chip bỏ qua chữ đang gõ dở trong ô tìm (thanh gửi từ khoá cũ) — giữ từ khoá đã áp dụng, như
    // quick search ở mode mặc định, và để nguyên chữ đang gõ trong ô.
    const typing = ctx.search && (query.search ?? '') !== untracked(() => this.barSearch());
    const applied = typing ? { ...query, search: current.quickSearch?.term ?? '' } : query;
    const { patch, changed } = queryToTableFilter(applied, ctx, current);
    const termChanged = (patch.quickSearch?.term ?? '') !== (current.quickSearch?.term ?? '');
    // why: như column-filter — đổi toán tử của cột đang trống (không phải NULL / NOT_NULL) chỉ lưu, không đọc lại.
    const silent =
      !termChanged &&
      changed.length > 0 &&
      changed.every(change => {
        const field = ctx.sources.get(change.key)?.field ?? '';
        return (
          !change.valueChanged &&
          !isNoDataOperator(change.operator) &&
          !isNoDataOperator(current.columnOperator?.[field]) &&
          !isRawFilterSet(change.value)
        );
      });
    this.#barApplying = true;
    this.#barKeepSearch = !!typing;
    try {
      this.filterRegister.value.set(silent ? { ...patch, notReload: true } : patch);
    } finally {
      this.#barApplying = false;
      this.#barKeepSearch = false;
    }
    this.#runQueryBarCallbacks(changed, ctx);
  };

  /** `filter.onChange` / `operatorChange` của cột, `onChange` của external và quick filter — chỉ khi người dùng đổi. */
  #runQueryBarCallbacks = (changed: SdTableQueryChange[], ctx: SdTableQueryContext): void => {
    const filter = this.tableOption()?.filter;
    for (const change of changed) {
      const source = ctx.sources.get(change.key);
      if (!source) continue;
      if (source.column) {
        if (change.operator) filter?.operatorChange?.(source.column, change.operator);
        if (change.valueChanged) source.column.filter?.onChange?.(change.value, source.column, this.columnFilter);
      } else if (change.valueChanged) {
        if (source.external) source.external.onChange?.(change.value);
        else source.quick?.onChange?.(change.value as SdTableQuickSearchFilterValue);
      }
    }
  };

  /** Nút Xoá lọc của thanh: về giá trị default như nút xoá của external filter, đọc lại một lần. */
  #clearQueryBar = (): void => {
    if (!this.filterRegister) return;
    this.#barApplying = true;
    try {
      this.clearFilter();
    } finally {
      this.#barApplying = false;
    }
    this.tableOption()?.filter?.onClearFilter?.();
  };

  /**
   * Raw → thanh. Không đặt lại `barFilters` khi kết quả y hệt (chip giữ identity, không vòng lặp: thanh chỉ phát
   * `apply` khi người dùng thao tác). Đang mở popover / dựng chip thì hoãn tới khi đóng.
   */
  #syncQueryBar = (value: TableFilterValue, rebuild: boolean): void => {
    const ctx = untracked(() => this.queryBarModel());
    if (!ctx) return;
    const bar = untracked(() => this.queryBar());
    if (bar && untracked(() => bar.editingIndex() !== null || !!bar.building())) {
      this.#barPending = true;
      return;
    }
    this.#barPending = false;
    const draft = untracked(() => this.barFilters());
    const derived = tableFilterToQuery(value, ctx, draft).filters;
    // why: thanh còn nháp (manualFilter, hoặc chip sửa trong lúc raw đổi từ ngoài) thì chỉ field đổi từ ngoài mới lấy raw.
    const next = !rebuild && draft !== this.#barWritten ? mergeQueryDraft(draft, this.#barDerived, derived) : derived;
    this.#barDerived = derived;
    if (next.length !== draft.length || next.some((filter, index) => filter !== draft[index])) this.barFilters.set(next);
    this.#barWritten = untracked(() => this.barFilters());
    const term = value.quickSearch?.term ?? '';
    // why: chỉ đẩy từ khoá khi từ khoá đã áp dụng đổi — không xoá phần đang gõ dở khi chip khác đổi.
    if ((rebuild && !this.#barKeepSearch) || term !== this.#barTerm) {
      this.#barTerm = term;
      this.barSearch.set(term);
    }
  };

  // Blur input filter: chỉ commit giá trị vào filterRegister, KHÔNG trigger reload.
  // Reload chỉ chạy khi user enter hoặc bấm nút tải lại.
  onFilterCommit = () => {
    if (!this.filterRegister) return;
    const columnOperator = this.columnOperator || {};
    // why: Tab ngay sau Enter không có gì mới để commit; set notReload lúc đó sẽ hủy lần đọc user vừa yêu cầu.
    if (this.#isColumnFilterCommitted(columnOperator, this.columnFilter)) return;
    this.filterRegister.value.set({
      columnOperator,
      columnFilter: this.columnFilter,
      notReload: true,
    });
  };

  #isColumnFilterCommitted = (columnOperator: Record<string, Operator>, columnFilter: TableFilterValue['columnFilter']): boolean => {
    const committed = this.filterRegister.value.get();
    try {
      return (
        Utilities.canonicalStringify({ columnOperator: committed.columnOperator || {}, columnFilter: committed.columnFilter || {} }) ===
        Utilities.canonicalStringify({ columnOperator, columnFilter: columnFilter || {} })
      );
    } catch {
      // Giá trị không serialize được: commit như cũ.
      return false;
    }
  };

  onExpand = async (row: SdTableItem<T>) => {
    const option = this.tableOption()?.expand;
    const meta = row.meta.expand!;
    if (option?.always || meta.isExpanding || option?.disabled?.(row.data)) return;
    if (meta.isExpanded) {
      meta.isExpanded = false;
      this.expandRevision.update(n => n + 1);
      this.#ref.markForCheck();
      return;
    }
    if (!option?.multiple) {
      collectFormattedTreeRows(this.items()).forEach(item => (item.meta.expand!.isExpanded = false));
    }
    try {
      const result = option?.onExpand?.(row.data);
      meta.isExpanding = result instanceof Promise;
      this.expandRevision.update(n => n + 1);
      this.#ref.markForCheck();
      meta.data = await result;
      meta.isExpanded = true;
    } catch (error) {
      console.error(error);
      this.#notifyService.warning(this.#i18n.t('core.component.table.error-occurred'));
    } finally {
      meta.isExpanding = false;
      this.expandRevision.update(n => n + 1);
      this.#ref.markForCheck();
    }
  };

  onSelect = (rowData: SdTableItem<T>) => {
    const opt = this.tableOption()!;
    if (rowData.meta.group?.items?.length) {
      this.onSelectGroup(rowData, !!rowData.meta.selector?.isSelected);
      opt.selector?.onSelect?.(rowData.data, this.selectedItems);
      return;
    }
    if (opt.selector?.single) {
      this.#getSelectionRows()
        .filter(row => row !== rowData)
        .forEach(row => (row.meta.selector!.isSelected = false));
      this.#preservedSelectedMap.clear();
    }
    if (this.#preserveEnabled()) {
      if (rowData.meta.selector?.isSelected) this.#preservedSelectedMap.set(rowData.meta.id, rowData);
      else this.#preservedSelectedMap.delete(rowData.meta.id);
    }
    this.#updateSelectedItems();
    this.#syncSelectAllState();
    opt.selector?.onSelect?.(rowData.data, this.selectedItems);
  };

  onSelectAll = () => {
    const checked = this.isSelectAll();
    this.#getSelectionRows().forEach(row => {
      if (row.meta.selector?.selectable || (!checked && row.meta.selector?.isSelected)) {
        row.meta.selector!.isSelected = checked;
      }
    });
    this.#updateSelectedItems();
    this.#syncSelectAllState();
    this.tableOption()?.selector?.onSelectAll?.(this.selectedItems);
  };

  onClearSelection = (_items?: SdTableItem<T>[]) => {
    // why: clear is global, including cached tree children and rows outside this page.
    const rows = [
      ...collectFormattedTreeRows(this.items()),
      ...collectFormattedTreeRows(this.#localItems),
      ...this.#preservedSelectedMap.values(),
    ];
    rows.forEach(row => (row.meta.selector!.isSelected = false));
    this.#preservedSelectedMap.clear();
    this.#updateSelectedItems();
    this.#syncSelectAllState();
  };

  #getSelectionRows = (): SdTableItem<T>[] => {
    return getSelectionRows(this.items(), this.tableOption()?.tree);
  };

  #getSelectedRowData = (): T[] => getSelectedRowData(this.#getSelectionRows());

  #applyDefaultSelected = () => {
    applyDefaultSelected(this.items(), this.tableOption()?.tree, this.tableOption()?.selector?.defaultSelected);
  };

  #syncSelectAllState = () => {
    const rows = this.#getSelectionRows().filter(row => row.meta.selector?.selectable);
    const all = resolveSelectAllState(rows);
    this.isSelectAll.set(all);
    this.isSelectIndeterminate.set(!all && rows.some(row => row.meta.selector?.isSelected));
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
    this.#updateSelectedItems();
    this.#syncSelectAllState();
    opt?.selector?.onSelectAll?.(this.selectedItems);
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
  isAggregateRow = (_idx: number, row: SdTableItem<T>): boolean => this.aggregateRenderHost.rows.has(row);
  isDataRow = (_idx: number, row: SdTableItem<T>): boolean => row?.meta?.group?.isGroupHeader !== true && !this.isAggregateRow(_idx, row);

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

    if (this.#preserveEnabled()) {
      // Sync map theo state visible: add nếu selected, remove nếu deselected.
      // Off-page items giữ nguyên trong map (không bị visit ở đây).
      this.selectedTableItems.set(syncPreservedSelection(rows, this.#preservedSelectedMap));
    } else {
      this.selectedTableItems.set(rows.filter(item => item.meta.selector!.isSelected));
    }
    prepareTableSelection(collectFormattedTreeRows(this.items()), this.selectedTableItems(), this.tableOption()?.selector);
    this.#syncGroupSelectionState();
    this.#ref.detectChanges();
  };

  clearFilter = () => {
    this.filterRegister.value.remove();
    this.quickSearchControl()?.term.set('');
  };

  setFilter = (args?: Pick<TableFilterValue, 'columnFilter' | 'externalFilter' | 'quickSearch'>) => {
    const { columnFilter, externalFilter } = args || {};
    if (columnFilter) {
      // Giữ reference ổn định cho column-filter (xem #syncColumnFilterInPlace).
      this.#syncColumnFilterInPlace(columnFilter);
    }
    this.filterRegister.value.set({
      columnFilter,
      externalFilter,
      ...(args && 'quickSearch' in args ? { quickSearch: args.quickSearch } : {}),
    });
    if (args && 'quickSearch' in args) this.quickSearchControl()?.term.set(args.quickSearch?.term || '');
  };

  get dataItems(): T[] {
    return this.items().map(item => item.data);
  }

  get selectedItems(): T[] {
    return this.selectedTableItems().map(item => item.data);
  }

  detectChanges = () => {
    this.dataRevision.update(value => value + 1);
    this.#refreshAggregate();
    this.#updateSelectedItems();
    this.#syncSelectAllState();
  };

  /** Restore defaults in the settings modal also puts the inline external filters back to `defaultShowing`. */
  onConfigDefaultsRestored = () => {
    this.filterRegister?.configuration.remove();
  };

  onColumnResize = (field: string, width: string) => {
    // persistColumnWidth ghi storage (silent) và emit widthChange$,
    // subscriber trong constructor đã update configuration() signal đồng bộ.
    this.#configService.persistColumnWidth(field, width);

    const onResize = this.tableOption()?.config?.onResize;
    if (!onResize) return;
    onResize(field, width, buildColumnWidthMap(this.configuration()?.column));
  };

  getSortAria = (field: string): 'none' | 'ascending' | 'descending' => {
    const sort = this.sort();
    if (sort?.active !== field) return 'none';
    if (sort.direction === 'asc') return 'ascending';
    if (sort.direction === 'desc') return 'descending';
    return 'none';
  };

  onOperatorChange = (column: SdTableColumn, operator: Operator | undefined) => {
    if (operator == null) return;
    this.tableOption()?.filter?.operatorChange?.(column, operator);
    // why: operator mới đổi nghĩa của giá trị đang có nên lọc lại ngay; ô trống thì chỉ lưu operator. NULL / NOT_NULL
    // lọc không cần giá trị, và rời khỏi NULL / NOT_NULL (operator đã commit trước đó) thì filter đó mất — cả hai lọc lại.
    const committed = this.filterRegister?.value.get().columnOperator?.[column.field] ?? column.filter?.operator?.default;
    const leftNoData = committed !== operator && isNoDataColumnOperator(column, committed);
    if (leftNoData || hasActiveColumnFilter(this.columnFilter, [column], { [column.field]: operator })) this.onFilterChange();
    else this.onFilterCommit();
  };

  trackBy = (index: number, item: SdTableItem) => {
    return item.meta.id;
  };

  // Offset STT theo paging — computed memoize, không tính lại trừ khi paginator đổi.
  // Template chỉ cần đọc pageOffset() rồi cộng `i + 1` (rẻ hơn gọi function).
  pageOffset = computed(() => {
    this.pageRevision();
    if (this.unknownTotal()) {
      // why: row numbers belong to the rows on screen, not to a page that is still loading or failed.
      const shown = this.#shownPage();
      return shown ? shown.pageIndex * shown.pageSize : 0;
    }
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
    this.#refreshAggregate();
  }
}
