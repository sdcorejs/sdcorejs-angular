import { ChangeDetectionStrategy, Component, computed, ElementRef, inject, viewChild } from '@angular/core';
import { SdButton } from '@sdcorejs/angular/components/button';
import { SdSideDrawer } from '@sdcorejs/angular/components/side-drawer';
import { SdSegmentedComponent, type SdSegmentedItem, type SdSegmentedModel } from '@sdcorejs/angular/forms/segmented';
import { SdSwitch } from '@sdcorejs/angular/forms/switch';
import { PatternSettingsStore, type PatternOrderSettings } from './pattern-settings.store';

type BooleanKey = { [K in keyof PatternOrderSettings]: PatternOrderSettings[K] extends boolean ? K : never }[keyof PatternOrderSettings];
type ChoiceKey = Exclude<keyof PatternOrderSettings, BooleanKey>;

interface SwitchRow {
  readonly kind: 'switch';
  readonly key: BooleanKey;
  readonly label: string;
  readonly hint: string;
  /** Setting that must be on for this one to apply. */
  readonly requires?: BooleanKey;
}

interface ChoiceRow {
  readonly kind: 'choice';
  readonly key: ChoiceKey;
  readonly label: string;
  readonly hint: string;
  readonly items: readonly SdSegmentedItem<string | number>[];
  readonly requires?: BooleanKey;
}

type Row = SwitchRow | ChoiceRow;

const GROUPS: readonly { readonly title: string; readonly rows: readonly Row[] }[] = [
  {
    title: 'Vùng của trang',
    rows: [
      { kind: 'switch', key: 'tabs', label: 'Tab trạng thái', hint: 'sdSubheader · sd-tab' },
      { kind: 'switch', key: 'score', label: 'Score card', hint: 'nội dung phía trên sd-table' },
    ],
  },
  {
    title: 'sd-table · tìm và lọc',
    rows: [
      { kind: 'switch', key: 'quickSearch', label: 'Quick search', hint: 'filter.quickSearch' },
      { kind: 'switch', key: 'warehouse', label: 'Dropdown Kho xuất', hint: 'quickSearch.filters', requires: 'quickSearch' },
      { kind: 'switch', key: 'inlineFilter', label: 'Filter dưới cột', hint: 'hideInlineFilter: false' },
      { kind: 'switch', key: 'autoHide', label: 'Tự ẩn khi ≤ 10 dòng', hint: "hideInlineFilter: 'auto'", requires: 'inlineFilter' },
      { kind: 'switch', key: 'externalFilter', label: 'External filter', hint: 'filter.externalFilters' },
      {
        kind: 'switch',
        key: 'externalFilterCollapsed',
        label: 'Thu gọn external filter',
        hint: 'sd-section collapsible',
        requires: 'externalFilter',
      },
      { kind: 'switch', key: 'manualFilter', label: 'Lọc thủ công', hint: 'filter.manualFilter', requires: 'externalFilter' },
      {
        kind: 'choice',
        key: 'externalFilterPerRow',
        label: 'Ô mỗi hàng',
        hint: 'externalFilterPerRow',
        items: [
          { value: 6, label: '6' },
          { value: 4, label: '4' },
        ],
        requires: 'externalFilter',
      },
    ],
  },
  {
    title: 'sd-table · chọn và footer',
    rows: [
      { kind: 'switch', key: 'selector', label: 'Cột chọn nhiều', hint: 'selector.visible' },
      {
        kind: 'switch',
        key: 'footerButtons',
        label: 'Nút Tải lại / Xuất dữ liệu / Thiết lập',
        hint: 'reload.visible · export · config.visible',
      },
    ],
  },
  {
    title: 'Dữ liệu và trạng thái',
    rows: [
      {
        kind: 'choice',
        key: 'records',
        label: 'Số bản ghi',
        hint: 'mock API cắt dữ liệu mẫu',
        items: [0, 3, 20, 128].map(value => ({ value, label: String(value) })),
      },
      {
        kind: 'choice',
        key: 'pageSize',
        label: 'Số dòng mỗi trang',
        hint: 'paginate.pageSize',
        items: [10, 20, 50].map(value => ({ value, label: String(value) })),
      },
      {
        kind: 'choice',
        key: 'read',
        label: 'Trạng thái đọc',
        hint: 'mock API',
        items: [
          { value: 'normal', label: 'Bình thường' },
          { value: 'loading', label: 'Đang tải' },
          { value: 'error', label: 'Lỗi' },
        ],
      },
      { kind: 'switch', key: 'autoCompact', label: 'Thu gọn khi thấp', hint: 'sd-page-list autoCompact' },
    ],
  },
  {
    title: 'Chi tiết',
    rows: [
      {
        kind: 'choice',
        key: 'detail',
        label: 'Mở chi tiết',
        hint: 'sd-page-list detail',
        items: [
          { value: 'drawer', label: 'Drawer' },
          { value: 'page', label: 'Trang' },
        ],
      },
    ],
  },
];

/**
 * "Tuỳ chỉnh hiển thị" of `/pattern/order` (doc 08): a button for the header of the list and a 340px drawer inside
 * the pattern shell, so the list keeps scrolling. Only `/pattern` has it; it is not part of the feature code.
 */
@Component({
  selector: 'sd-pattern-settings-button',
  standalone: true,
  imports: [SdButton, SdSideDrawer, SdSwitch, SdSegmentedComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <sd-button
      title="Tuỳ chỉnh hiển thị"
      prefixIcon="tune"
      autoId="pattern-settings"
      [type]="store.open() ? 'light' : 'outline'"
      [color]="store.open() ? 'primary' : 'secondary'"
      (click)="toggle()" />
    <sd-side-drawer
      title="Tuỳ chỉnh hiển thị"
      width="340px"
      autoId="pattern-settings"
      [container]="container()"
      (sdClosed)="store.open.set(false)">
      <sd-button sdHeaderRight title="Mặc định" type="text" autoId="pattern-settings-reset" (click)="store.reset()" />
      @let settings = store.settings();
      <div class="sd-pattern-settings">
        @for (group of groups; track group.title) {
          <section class="sd-pattern-settings__group">
            <h3 class="sd-pattern-settings__title">{{ group.title }}</h3>
            @for (row of group.rows; track row.key) {
              @let disabled = !!row.requires && !settings[row.requires];
              <div class="sd-pattern-settings__row" [class.sd-pattern-settings__row--disabled]="disabled">
                <div class="sd-pattern-settings__text">
                  <span>{{ row.label }}</span>
                  @if (store.e6() && (row.key === 'quickSearch' || row.key === 'externalFilter')) {
                    <span class="sd-pattern-settings__hint sd-pattern-settings__hint--warning"
                      >Không nên bật cùng quick search và external filter (E6)</span
                    >
                  } @else {
                    <span class="sd-pattern-settings__hint">{{ row.hint }}</span>
                  }
                </div>
                @if (row.kind === 'switch') {
                  <sd-switch
                    size="sm"
                    [autoId]="'pattern-setting-' + row.key"
                    [disabled]="disabled"
                    [model]="settings[row.key]"
                    (modelChange)="store.set(row.key, !!$event)" />
                } @else {
                  <sd-segmented
                    size="sm"
                    [ariaLabel]="row.label"
                    [autoId]="'pattern-setting-' + row.key"
                    [disabled]="disabled"
                    [items]="row.items"
                    [model]="settings[row.key]"
                    (sdChange)="choose(row.key, $event)" />
                }
              </div>
            }
          </section>
        }
      </div>
    </sd-side-drawer>
  `,
  styles: `
    .sd-pattern-settings {
      display: flex;
      flex-direction: column;
      gap: 16px;
      padding: 8px 4px;
    }
    .sd-pattern-settings__group {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .sd-pattern-settings__title {
      margin: 0;
      color: var(--sd-text-secondary);
      font-size: 11px;
      font-weight: 500;
      letter-spacing: 0.04em;
      text-transform: uppercase;
    }
    .sd-pattern-settings__row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
    }
    .sd-pattern-settings__row--disabled .sd-pattern-settings__text {
      opacity: 0.5;
    }
    .sd-pattern-settings__text {
      display: flex;
      flex-direction: column;
      min-width: 0;
      font-size: 13px;
    }
    .sd-pattern-settings__hint {
      color: var(--sd-text-secondary);
      font: 11px/16px var(--sd-font-mono, monospace);
    }
    .sd-pattern-settings__hint--warning {
      color: var(--sd-warning, #b45309);
      font-family: inherit;
    }
  `,
})
export class PatternSettingsButtonComponent {
  readonly #host: HTMLElement = inject(ElementRef).nativeElement;
  private readonly drawer = viewChild.required(SdSideDrawer);
  protected readonly store = inject(PatternSettingsStore);
  protected readonly groups = GROUPS;
  /** The body of the pattern shell: the drawer covers the screen, not the sample toolbar. */
  protected readonly container = computed(() => this.#host.closest<HTMLElement>('.sd-pattern-shell__body'));

  protected toggle(): void {
    if (this.store.open()) {
      this.drawer().close();
      return;
    }
    this.store.open.set(true);
    this.drawer().open();
  }

  protected choose(key: ChoiceKey, value: SdSegmentedModel<string | number>): void {
    if (value === null || value === undefined || Array.isArray(value)) return;
    this.store.set(key, value as never);
  }
}
