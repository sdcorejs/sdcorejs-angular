import { CdkDragDrop, DragDropModule, moveItemInArray } from '@angular/cdk/drag-drop';
import { ChangeDetectorRef, Component, computed, inject, input, output, signal, viewChild } from '@angular/core';
import { SdButton } from '@sdcorejs/angular/components/button';
import { SdModal } from '@sdcorejs/angular/components/modal';
import { SdCheckbox } from '@sdcorejs/angular/forms/checkbox';
import { SdSuffixDefDirective } from '@sdcorejs/angular/forms/directives';
import { SdInput } from '@sdcorejs/angular/forms/input';
import { I18nService, SdTranslatePipe } from '@sdcorejs/angular/i18n';
import { SdIcon } from '@sdcorejs/angular/modules/icon';
import { SdStorageWithDefault } from '@sdcorejs/angular/services';
import { SdConfirmService } from '@sdcorejs/angular/services/confirm';
import { sdNormalizeSearchText } from '@sdcorejs/angular/utilities/extensions';
import { ConfiguredColumn, ConfiguredTable, ConfiguredTableResult } from '../../models/table-option-config.model';
import { SdTableOption } from '../../models/table-option.model';
import { ConfigService } from '../../services/config.service';
import { configWidthClamp, configWidthFromInput, configWidthPx } from './config-width.util';

/** The find box shows only past this many columns. */
const FIND_THRESHOLD = 8;

let nextId = 0;

@Component({
  selector: 'config',
  templateUrl: './config.component.html',
  styleUrl: './config.component.scss',
  standalone: true,
  imports: [DragDropModule, SdButton, SdCheckbox, SdIcon, SdInput, SdModal, SdSuffixDefDirective, SdTranslatePipe],
  providers: [ConfigService],
})
export class ConfigComponent {
  // ==========================================
  // 1. SIGNAL INPUTS / OUTPUTS
  // ==========================================
  autoIdInput = input<string | null | undefined>(undefined, { alias: 'autoId' });
  tableOption = input<SdTableOption | undefined>(undefined);
  changes = output<ConfiguredTableResult>();

  // Base autoId (đã là `components-table-<scope>` từ parent), '' khi parent không set.
  autoId = computed(() => this.autoIdInput() || '');

  // ==========================================
  // 2. SIGNAL QUERIES
  // ==========================================
  modal = viewChild<SdModal>(SdModal);

  // ==========================================
  // 3. INJECT
  // ==========================================
  readonly #ref = inject(ChangeDetectorRef);
  readonly #confirmService = inject(SdConfirmService);
  readonly #configService = inject(ConfigService);
  readonly #i18n = inject(I18nService);

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

  // ==========================================
  // 5. PUBLIC API
  // ==========================================
  open = async () => {
    const opt = this.tableOption();
    if (!opt) return;
    this.#setting = this.#configService.init(opt)!;
    this.configuration.set(this.#setting?.get());
    this.query.set('');
    this.expanded.set(null);
    this.#textWidthField.set(null);
    this.modal()?.open();
  };

  close = () => {
    this.modal()?.close();
  };

  onSave = () => {
    const cfg = this.configuration();
    if (cfg) this.#setting?.set({ ...cfg, columns: cfg.columns?.map(column => ({ ...column, width: this.#settledWidth(column) })) });
    this.modal()?.close();
    this.#ref.detectChanges();
  };

  onReset = async () => {
    this.#confirmService.confirm(this.#i18n.t('core.component.table.config.confirm-reset')).then(() => {
      this.#setting?.remove();
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
  // 6. LIST
  // ==========================================
  onFind = (value: unknown) => {
    this.query.set(String(value ?? ''));
    // why: dòng đang mở mà bị lọc mất thì đóng lại — không để phần chi tiết treo ở trạng thái không nhìn thấy.
    const open = this.expanded();
    if (open && !this.columns().some(column => column.origin.field === open)) this.expanded.set(null);
  };

  toggleRow = (field: string) => this.expanded.update(current => (current === field ? null : field));

  /** Pressing the handle closes the open row first, so CDK measures rows of one height when the drag starts. */
  onHandlePointerDown = () => this.expanded.set(null);

  drop = (event: CdkDragDrop<ConfiguredColumn[]>) => {
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
  // 7. TITLE
  // ==========================================
  titleOf = (item: ConfiguredColumn): string => item.title || item.origin.title;

  renamed = (item: ConfiguredColumn): boolean => !!item.title && item.title !== item.origin.title;

  setTitle = (field: string, value: unknown) => this.#patch(field, { title: String(value ?? '') || undefined });

  restoreTitle = (field: string) => this.#patch(field, { title: undefined });

  // ==========================================
  // 8. WIDTH
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
    const option = this.tableOption()?.columns?.find(item => item.field === column.origin.field);
    return configWidthClamp(configWidthFromInput(column.width), option?.minWidth, option?.maxWidth);
  };

  #patch = (field: string, patch: Partial<ConfiguredColumn>) =>
    this.#update(column => (column.origin.field === field ? { ...column, ...patch } : column));

  #update = (map: (column: ConfiguredColumn) => ConfiguredColumn) =>
    this.configuration.update(cfg => cfg && { ...cfg, columns: cfg.columns?.map(map) });
}
