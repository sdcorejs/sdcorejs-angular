import { CdkDragDrop, DragDropModule, moveItemInArray } from '@angular/cdk/drag-drop';
import {
  afterNextRender,
  ChangeDetectorRef,
  Component,
  computed,
  ElementRef,
  inject,
  Injector,
  input,
  output,
  signal,
  viewChild,
  viewChildren,
} from '@angular/core';
import { SdButton } from '@sdcorejs/angular/components/button';
import { SdModal } from '@sdcorejs/angular/components/modal';
import { SdCheckbox } from '@sdcorejs/angular/forms/checkbox';
import { SdSuffixDefDirective } from '@sdcorejs/angular/forms/directives';
import { SdInput } from '@sdcorejs/angular/forms/input';
import { SdSwitch } from '@sdcorejs/angular/forms/switch';
import { I18nService, SdTranslatePipe } from '@sdcorejs/angular/i18n';
import { SdIcon } from '@sdcorejs/angular/modules/icon';
import { SdStorageWithDefault } from '@sdcorejs/angular/services';
import { SdConfirmService } from '@sdcorejs/angular/services/confirm';
import { sdNormalizeSearchText } from '@sdcorejs/angular/utilities/extensions';
import { ConfiguredColumn, ConfiguredTable, ConfiguredTableResult } from '../../models/table-option-config.model';
import { SdTableOption } from '../../models/table-option.model';
import { ConfigService } from '../../services/config.service';
import { SdTableOptionFilter, TableFilterConfiguration } from '../../services/table-filter/table-filter.model';
import { configWidthClamp, configWidthFromInput, configWidthPx } from './config-width.util';

/** The find box shows only past this many columns. */
const FIND_THRESHOLD = 8;

type FilterMode = NonNullable<SdTableOptionFilter['mode']>;
type ConfigTab = 'columns' | 'filters';

interface ConfigFilterRow {
  field: string;
  title: string;
  on: boolean;
  locked: boolean;
  /** i18n key of the text under the title. */
  note?: string;
}

/** What the "Bộ lọc" tab shows; the table builds it, and `undefined` hides the tab. */
export interface ConfigFilterSetup {
  /** `filter.mode` after `SD_TABLE_CONFIGURATION`: the kind without a stored choice. */
  mode: FilterMode;
  /** The stored choice of the user (`TableFilterConfiguration.mode`). */
  storedMode?: FilterMode;
  /** `filter.modeSelectable !== false`: the kinds are offered. */
  modeSelectable: boolean;
  /** Stored `TableFilterConfiguration.inlineExternal`. */
  inlineExternal: Record<string, boolean>;
  /** External filters in option order; `offBar`: the query bar cannot show it. */
  externalFilters: { field: string; title: string; required: boolean; offBar: boolean }[];
  /** `filter.queryBar.pinned`: the app picks the pinned chips, so the list cannot change them on the bar. */
  pinned?: string[];
}

let nextId = 0;

@Component({
  selector: 'config',
  templateUrl: './config.component.html',
  styleUrl: './config.component.scss',
  standalone: true,
  imports: [DragDropModule, SdButton, SdCheckbox, SdIcon, SdInput, SdModal, SdSuffixDefDirective, SdSwitch, SdTranslatePipe],
  providers: [ConfigService],
})
export class ConfigComponent {
  // ==========================================
  // 1. SIGNAL INPUTS / OUTPUTS
  // ==========================================
  autoIdInput = input<string | null | undefined>(undefined, { alias: 'autoId' });
  tableOption = input<SdTableOption | undefined>(undefined);
  changes = output<ConfiguredTableResult>();
  /** Restore defaults was confirmed and the stored setup removed. */
  defaultsRestored = output<void>();
  /** The "Bộ lọc" tab; `undefined` hides it. */
  filterSetup = input<ConfigFilterSetup | undefined>(undefined);
  /** Apply with a changed "Bộ lọc" tab: the filter setup to store. `mode` is left out when the kind cannot be picked. */
  filterApplied = output<Partial<TableFilterConfiguration>>();

  // Base autoId (đã là `components-table-<scope>` từ parent), '' khi parent không set.
  autoId = computed(() => this.autoIdInput() || '');

  // ==========================================
  // 2. SIGNAL QUERIES
  // ==========================================
  modal = viewChild<SdModal>(SdModal);
  // why: signal query không đặt được trên member `#private`.
  protected readonly handles = viewChildren<ElementRef<HTMLButtonElement>>('handle');

  // ==========================================
  // 3. INJECT
  // ==========================================
  readonly #ref = inject(ChangeDetectorRef);
  readonly #confirmService = inject(SdConfirmService);
  readonly #configService = inject(ConfigService);
  readonly #i18n = inject(I18nService);
  readonly #injector = inject(Injector);

  // ==========================================
  // 4. STATE
  // ==========================================
  // why: mỗi lần sửa thay object cột (không mutate) — giá trị lấy từ storage không bị đổi khi người dùng bấm Bỏ qua,
  // và các computed bên dưới tự tính lại.
  configuration = signal<ConfiguredTable | undefined>(undefined);
  /** Text of the find box. */
  readonly query = signal('');
  /** Field of the open row; one row at a time. */
  readonly expanded = signal<string | null>(null);
  // why: ô độ rộng đang ở chế độ chữ (giá trị %/rem…) giữ nguyên chế độ đó tới khi blur, để gõ "1.5rem" không bị đổi
  // sang ô số ngay ở ký tự "1".
  readonly #textWidthField = signal<string | null>(null);
  readonly #id = `sd-table-config-${nextId++}`;
  readonly hintId = `${this.#id}-hint`;
  #setting?: SdStorageWithDefault<ConfiguredTable>;
  /** Widths as opened; only an edited width is rounded and clamped (an untouched `120.5px` stays as it is). */
  #openedWidths = new Map<string, string | undefined>();
  /** Row lifted from the keyboard, and the order Escape goes back to. */
  readonly picked = signal<{ field: string; order: ConfiguredColumn[] } | null>(null);
  /** Text of the live region: each keyboard reorder step. */
  readonly announcement = signal('');
  // why: @for dời node DOM khi đổi thứ tự nên handle có thể mất focus giữa chừng; blur lúc đó không phải người dùng rời
  // handle, không được coi là thả.
  #refocusing = false;

  readonly #allColumns = computed(() => this.configuration()?.columns ?? []);
  readonly searchable = computed(() => this.#allColumns().length > FIND_THRESHOLD);
  readonly #term = computed(() => (this.searchable() ? sdNormalizeSearchText(this.query()) : ''));
  /** Reordering is off while a search narrows the list: the hidden rows would make the drop index ambiguous. */
  readonly searching = computed(() => !!this.#term());
  /** Rows on screen: every column, or those whose current or original title matches the search. */
  readonly columns = computed(() => {
    const term = this.#term();
    const columns = this.#allColumns();
    if (!term) return columns;
    return columns.filter(column => [column.title, column.origin.title].some(title => sdNormalizeSearchText(title).includes(term)));
  });
  readonly totalCount = computed(() => this.#allColumns().length);
  readonly shownCount = computed(() => this.#allColumns().filter(column => !column.invisible).length);
  readonly allShown = computed(() => this.shownCount() === this.totalCount());

  // why: tab "Bộ lọc" giữ nháp riêng như danh sách cột — Áp dụng ghi cả hai tab, Bỏ qua bỏ cả hai.
  readonly #tab = signal<ConfigTab>('columns');
  /** Tab on screen; Cột when the table gives no "Bộ lọc" tab. */
  readonly tab = computed<ConfigTab>(() => (this.filterSetup() ? this.#tab() : 'columns'));
  readonly tabs: readonly ConfigTab[] = ['columns', 'filters'];
  readonly modes: readonly FilterMode[] = ['default', 'query-bar'];
  /** Picked filter kind (draft until Apply). */
  readonly filterMode = signal<FilterMode>('default');
  /** Inline external filters (draft until Apply). */
  readonly inlineExternal = signal<Record<string, boolean>>({});
  /**
   * One row per external filter. In the panel the switch shows it there; on the bar it pins it as a chip, so a filter
   * the bar cannot show is off, a required one is always pinned, and `queryBar.pinned` decides for the app.
   */
  readonly filterRows = computed<ConfigFilterRow[]>(() => {
    const setup = this.filterSetup();
    if (!setup) return [];
    const bar = this.filterMode() === 'query-bar';
    const inline = this.inlineExternal();
    return setup.externalFilters.map(({ field, title, required, offBar }) => {
      if (bar && offBar) return { field, title, on: false, locked: true, note: 'core.component.table.config.filter-off-bar' };
      if (bar && required) return { field, title, on: true, locked: true, note: 'core.component.table.config.filter-required' };
      if (bar && setup.pinned) return { field, title, on: setup.pinned.includes(field), locked: true };
      return {
        field,
        title,
        on: !!inline[field],
        locked: required,
        note: required ? 'core.component.table.config.filter-required' : undefined,
      };
    });
  });
  /** Text under the filter list: what its switches do for the picked kind. */
  readonly filterListHint = computed(() => {
    if (this.filterMode() !== 'query-bar') return 'core.component.table.config.filters-hint-panel';
    return this.filterSetup()?.pinned ? 'core.component.table.config.filters-hint-pinned' : 'core.component.table.config.filters-hint-bar';
  });

  // ==========================================
  // 5. PUBLIC API
  // ==========================================
  open = async () => {
    const opt = this.tableOption();
    if (!opt) return;
    this.#setting = this.#configService.init(opt)!;
    this.configuration.set(this.#setting?.get());
    this.#openedWidths = new Map(this.configuration()?.columns?.map(column => [column.origin.field, column.width]));
    this.query.set('');
    this.expanded.set(null);
    this.#textWidthField.set(null);
    this.picked.set(null);
    this.announcement.set('');
    this.#tab.set('columns');
    const filter = this.filterSetup();
    this.filterMode.set((filter?.modeSelectable ? filter.storedMode : undefined) ?? filter?.mode ?? 'default');
    this.inlineExternal.set({ ...filter?.inlineExternal });
    this.modal()?.open();
  };

  close = () => {
    this.modal()?.close();
  };

  onSave = () => {
    const cfg = this.configuration();
    if (cfg) this.#setting?.set({ ...cfg, columns: cfg.columns?.map(column => ({ ...column, width: this.#settledWidth(column) })) });
    this.#applyFilter();
    this.modal()?.close();
    this.#ref.detectChanges();
  };

  onReset = async () => {
    this.#confirmService.confirm(this.#i18n.t('core.component.table.config.confirm-reset')).then(() => {
      this.#setting?.remove();
      this.defaultsRestored.emit();
      this.modal()?.close();
      this.#ref.detectChanges();
    });
  };

  /**
   * Cột đang tắt hiển thị thì tiêu đề / độ rộng / cố định / rút gọn đều vô nghĩa — khoá phần chi tiết lại, chỉ chừa
   * ô "Hiện" để bật lại.
   */
  isRowDisabled = (item: ConfiguredColumn): boolean => !!item?.invisible;

  // ==========================================
  // 6. TABS AND FILTERS
  // ==========================================
  readonly tabId = (tab: ConfigTab): string => `${this.#id}-tab-${tab}`;

  readonly panelId = (tab: ConfigTab): string => `${this.#id}-panel-${tab}`;

  readonly modeName = `${this.#id}-mode`;

  selectTab = (tab: ConfigTab) => this.#tab.set(tab);

  /** ← → move between the tabs, Home / End go to the first / last (tablist pattern of the APG, roving tabindex). */
  onTabKeydown = (event: KeyboardEvent) => {
    const index = this.tabs.indexOf(this.tab());
    const count = this.tabs.length;
    const next =
      event.key === 'ArrowRight' || event.key === 'ArrowLeft'
        ? this.tabs[(index + (event.key === 'ArrowRight' ? 1 : count - 1)) % count]
        : event.key === 'Home'
          ? this.tabs[0]
          : event.key === 'End'
            ? this.tabs[count - 1]
            : undefined;
    if (!next) return;
    event.preventDefault();
    // why: lấy tablist ngay — `currentTarget` về null khi sự kiện dispatch xong.
    const tablist = event.currentTarget as HTMLElement | null;
    this.selectTab(next);
    afterNextRender(() => tablist?.querySelector<HTMLElement>(`[data-tab="${next}"]`)?.focus(), { injector: this.#injector });
  };

  pickMode = (mode: FilterMode) => this.filterMode.set(mode);

  setInline = (field: string, on: boolean) => this.inlineExternal.update(current => ({ ...current, [field]: on }));

  /**
   * Sends the "Bộ lọc" tab to the table when it changed. A kind equal to `filter.mode` is not stored, so the table keeps
   * following the option; without `modeSelectable` the stored kind is left alone.
   */
  #applyFilter = () => {
    const setup = this.filterSetup();
    if (!setup) return;
    const inlineExternal = this.inlineExternal();
    const inlineChanged = setup.externalFilters.some(({ field }) => !!inlineExternal[field] !== !!setup.inlineExternal[field]);
    if (!setup.modeSelectable) {
      if (inlineChanged) this.filterApplied.emit({ inlineExternal });
      return;
    }
    const mode = this.filterMode() === setup.mode ? undefined : this.filterMode();
    if (inlineChanged || mode !== setup.storedMode) this.filterApplied.emit({ inlineExternal, mode });
  };

  // ==========================================
  // 7. LIST
  // ==========================================
  onFind = (value: unknown) => {
    this.query.set(String(value ?? ''));
    // why: dòng đang mở mà bị lọc mất thì đóng lại — không để phần chi tiết treo ở trạng thái không nhìn thấy.
    const open = this.expanded();
    if (open && !this.columns().some(column => column.origin.field === open)) this.expanded.set(null);
  };

  toggleRow = (field: string) => this.expanded.update(current => (current === field ? null : field));

  /**
   * Pressing the handle of the open row closes it first, so its preview is the summary row. Another open row stays open:
   * closing it would move the pressed row away from the pointer before CDK measures.
   */
  onHandlePointerDown = (field: string) => {
    if (this.expanded() === field) this.expanded.set(null);
  };

  drop = (event: CdkDragDrop<ConfiguredColumn[]>) => {
    this.picked.set(null);
    if (this.searching() || event.previousIndex === event.currentIndex) return;
    const columns = [...this.#allColumns()];
    moveItemInArray(columns, event.previousIndex, event.currentIndex);
    this.configuration.update(cfg => cfg && { ...cfg, columns });
  };

  showAll = () => this.#update(column => (column.invisible ? { ...column, invisible: false } : column));

  setShown = (field: string, shown: boolean) => this.#patch(field, { invisible: !shown });

  setFixed = (field: string, fixed: boolean) => this.#patch(field, { fixed });

  setTruncate = (field: string, truncate: boolean) => this.#patch(field, { truncate });

  // ==========================================
  // 8. KEYBOARD REORDER
  // ==========================================
  /** Space / Enter picks up and drops, ↑ / ↓ move the picked row, Escape puts the order back. */
  onHandleKeydown = (event: KeyboardEvent, field: string) => {
    const picked = this.picked();
    switch (event.key) {
      case ' ':
      case 'Enter':
        if (picked?.field === field) this.#dropPicked();
        else this.#pick(field);
        break;
      case 'ArrowUp':
      case 'ArrowDown':
        if (picked?.field !== field) return;
        this.#movePicked(field, event.key === 'ArrowUp' ? -1 : 1);
        break;
      case 'Escape':
        if (!picked) return;
        this.#cancelPick(picked);
        break;
      default:
        return;
    }
    // why: khi đang giữ dòng, Escape không được đóng modal và ↑ ↓ không được cuộn danh sách.
    event.preventDefault();
    event.stopPropagation();
  };

  /** Leaving the handle while a row is held drops it where it is. */
  onHandleBlur = (field: string) => {
    if (!this.#refocusing && this.picked()?.field === field) this.#dropPicked();
  };

  #pick = (field: string) => {
    if (this.searching()) return;
    const order = this.#allColumns();
    this.picked.set({ field, order });
    this.#announce('core.component.table.config.reorder-picked', field, { total: order.length });
  };

  #movePicked = (field: string, delta: number) => {
    const columns = [...this.#allColumns()];
    const from = columns.findIndex(column => column.origin.field === field);
    const to = from + delta;
    if (from < 0 || to < 0 || to >= columns.length) return;
    moveItemInArray(columns, from, to);
    this.configuration.update(cfg => cfg && { ...cfg, columns });
    this.#announce('core.component.table.config.reorder-moved', field, { total: columns.length });
    this.#refocus(field);
  };

  #dropPicked = () => {
    const field = this.picked()?.field;
    this.picked.set(null);
    if (field) this.#announce('core.component.table.config.reorder-dropped', field);
  };

  #cancelPick = (picked: { field: string; order: ConfiguredColumn[] }) => {
    this.picked.set(null);
    this.configuration.update(cfg => cfg && { ...cfg, columns: picked.order });
    this.announcement.set(this.#i18n.t('core.component.table.config.reorder-cancelled'));
    this.#refocus(picked.field);
  };

  /** Announces a step with the row's title and its 1-based position in the current order. */
  #announce = (key: string, field: string, params: Record<string, number> = {}) => {
    const columns = this.#allColumns();
    const index = columns.findIndex(column => column.origin.field === field);
    const column = columns[index];
    if (!column) return;
    this.announcement.set(this.#i18n.t(key, { title: this.titleOf(column), index: index + 1, ...params }));
  };

  #refocus = (field: string) => {
    this.#refocusing = true;
    afterNextRender(
      () => {
        this.handles()
          .find(handle => handle.nativeElement.closest('.c-item')?.getAttribute('data-field') === field)
          ?.nativeElement.focus();
        this.#refocusing = false;
      },
      { injector: this.#injector }
    );
  };

  // ==========================================
  // 9. TITLE
  // ==========================================
  titleOf = (item: ConfiguredColumn): string => item.title || item.origin.title;

  renamed = (item: ConfiguredColumn): boolean => !!item.title && item.title !== item.origin.title;

  setTitle = (field: string, value: unknown) => this.#patch(field, { title: String(value ?? '') || undefined });

  restoreTitle = (field: string) => this.#patch(field, { title: undefined });

  // ==========================================
  // 10. WIDTH
  // ==========================================
  /** A width in another unit than px is edited as text, verbatim. */
  widthIsText = (item: ConfiguredColumn): boolean =>
    this.#textWidthField() === item.origin.field || (!!item.width && configWidthPx(item.width) === undefined);

  widthValue = (item: ConfiguredColumn): string => {
    if (this.widthIsText(item)) return item.width ?? '';
    const px = configWidthPx(item.width);
    return px === undefined ? '' : String(px);
  };

  /** Empty falls back to the original width, so that is the placeholder; "auto" when the option has none. */
  widthPlaceholder = (item: ConfiguredColumn): string => {
    const origin = item.origin.width;
    if (!origin) return this.#i18n.t('core.component.table.config.width-auto');
    const px = configWidthPx(origin);
    return px === undefined ? origin : String(px);
  };

  widthSummary = (item: ConfiguredColumn): string => {
    if (item.invisible) return this.#i18n.t('core.component.table.config.hidden');
    const width = item.width || item.origin.width;
    if (!width) return this.#i18n.t('core.component.table.config.width-auto');
    const px = configWidthPx(width);
    return px === undefined ? width : `${px} px`;
  };

  onWidthFocus = (item: ConfiguredColumn) => {
    if (this.widthIsText(item)) this.#textWidthField.set(item.origin.field);
  };

  setWidth = (field: string, value: unknown) => {
    // why: chế độ chữ giữ nguyên chuỗi đang gõ; chuyển sang px (và kẹp) khi blur.
    const width = this.#textWidthField() === field ? String(value ?? '').trim() || undefined : configWidthFromInput(value);
    this.#patch(field, { width });
  };

  commitWidth = (field: string) => {
    this.#textWidthField.set(null);
    const column = this.#allColumns().find(item => item.origin.field === field);
    if (column) this.#patch(field, { width: this.#settledWidth(column) });
  };

  detailsId = (field: string): string => `${this.#id}-${field.replace(/[^\w-]/g, '_')}`;

  /** Number → px, then rounded and kept within the column's px `minWidth` / `maxWidth`. */
  #settledWidth = (column: ConfiguredColumn): string | undefined => {
    if (column.width === this.#openedWidths.get(column.origin.field)) return column.width;
    const option = this.tableOption()?.columns?.find(item => item.field === column.origin.field);
    return configWidthClamp(configWidthFromInput(column.width), option?.minWidth, option?.maxWidth);
  };

  #patch = (field: string, patch: Partial<ConfiguredColumn>) =>
    this.#update(column => (column.origin.field === field ? { ...column, ...patch } : column));

  #update = (map: (column: ConfiguredColumn) => ConfiguredColumn) =>
    this.configuration.update(cfg => cfg && { ...cfg, columns: cfg.columns?.map(map) });
}
