import { CdkTrapFocus } from '@angular/cdk/a11y';
import {
  CdkConnectedOverlay,
  CdkOverlayOrigin,
  ConnectedPosition,
  FlexibleConnectedPositionStrategyOrigin,
  Overlay,
  OverlayRef,
} from '@angular/cdk/overlay';
import { TemplatePortal } from '@angular/cdk/portal';
import { DOCUMENT, NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  TemplateRef,
  ViewContainerRef,
  computed,
  effect,
  inject,
  input,
  signal,
  untracked,
  viewChild,
} from '@angular/core';
import { SdTranslatePipe } from '@sdcorejs/angular/i18n';
import { SD_ICON_CONFIGURATION, SdIcon } from '@sdcorejs/angular/modules/icon';
import { StringUtilities } from '@sdcorejs/utils/fns';
import { SdLayoutContext, SdLayoutContextConfiguration } from '../../../configurations';
import { SdLayoutContextService } from '../../../services/context';

/** One rendered row: the context plus the state the template needs. */
interface SdLayoutContextSwitcherRow {
  item: SdLayoutContext;
  initial: string;
  active: boolean;
  busy: boolean;
  disabled: boolean;
}

/**
 * CSS variable a sidebar can set on (or above) the switcher host to size the header popover. It wins over the
 * width derived from `anchor`. The popover lives in the CDK overlay container, so the resolved value is copied
 * onto it when it opens.
 */
const POPOVER_WIDTH_VARIABLE = '--sd-layout-context-switcher-popover-width';

/** Horizontal inset of the header popover inside its anchor (the popover is `anchor width − 2 × inset` wide). */
const ANCHOR_INSET = 12;

const BELOW_TRIGGER_POSITIONS: ConnectedPosition[] = [
  { originX: 'start', originY: 'bottom', overlayX: 'start', overlayY: 'top', offsetY: 6 },
  { originX: 'start', originY: 'top', overlayX: 'start', overlayY: 'bottom', offsetY: -6 },
];

const BELOW_ANCHOR_POSITIONS: ConnectedPosition[] = [
  { originX: 'start', originY: 'bottom', overlayX: 'start', overlayY: 'top', offsetX: ANCHOR_INSET },
  { originX: 'start', originY: 'top', overlayX: 'start', overlayY: 'bottom', offsetX: ANCHOR_INSET },
];

const RIGHT_POSITIONS: ConnectedPosition[] = [
  { originX: 'end', originY: 'top', overlayX: 'start', overlayY: 'top', offsetX: 8 },
  { originX: 'end', originY: 'bottom', overlayX: 'start', overlayY: 'bottom', offsetX: 8 },
];

let nextSheetTitleId = 0;

/**
 * Context switcher shared by sidebar versions 1–4 and their mobile drawers.
 *
 * Forwards `configuration.items` to `SdLayoutContextService.syncItems()` and renders the service state:
 * the current context, the switching row and the "changed in another tab" notice. Selecting another
 * context calls `setCurrentContext()`, which reloads the page; there is no change event.
 */
@Component({
  selector: 'sd-layout-context-switcher',
  standalone: true,
  imports: [CdkConnectedOverlay, CdkOverlayOrigin, CdkTrapFocus, NgTemplateOutlet, SdIcon, SdTranslatePipe],
  templateUrl: './context-switcher.component.html',
  styleUrl: './context-switcher.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'sd-layout-context-switcher',
    '[class.sd-layout-context-switcher--header]': 'appearance() === "header"',
    '[class.sd-layout-context-switcher--rail]': 'appearance() === "rail"',
    '[class.sd-layout-context-switcher--sheet]': 'appearance() === "sheet"',
  },
})
export class SdLayoutContextSwitcher {
  readonly #context = inject(SdLayoutContextService);
  readonly #iconConfiguration = inject(SD_ICON_CONFIGURATION);
  readonly #overlay = inject(Overlay);
  readonly #viewContainerRef = inject(ViewContainerRef);
  readonly #host = inject<ElementRef<HTMLElement>>(ElementRef);
  readonly #document = inject(DOCUMENT);
  private readonly trigger = viewChild<ElementRef<HTMLButtonElement>>('trigger');
  private readonly sheetTemplate = viewChild.required<TemplateRef<unknown>>('sheet');
  #sheetRef?: OverlayRef;

  /** Context configuration of the sidebar; nothing renders without items. */
  configuration = input<SdLayoutContextConfiguration | null | undefined>();
  /** Header trigger, collapsed-rail avatar, or mobile row that opens a bottom sheet. */
  appearance = input<'header' | 'rail' | 'sheet'>('header');
  /** Side the desktop popover opens on; defaults to `below` for the header and `right` for the rail. The sheet ignores it. */
  placement = input<'below' | 'right' | undefined>();
  /**
   * Element the desktop popover aligns to; defaults to the trigger. Pass the sidebar header for `below`
   * (the popover sits under it, 12px inside both edges) and the rail or aside for `right` (the popover opens
   * 8px from its right edge, top-aligned with the trigger).
   */
  anchor = input<HTMLElement | null | undefined>();

  readonly #isOpen = signal(false);
  /** `true` while the popover or the bottom sheet is open. */
  readonly isOpen = this.#isOpen.asReadonly();
  protected readonly query = signal('');
  protected readonly popoverWidth = signal<string | null>(null);
  protected readonly popoverOrigin = signal<FlexibleConnectedPositionStrategyOrigin | null>(null);
  readonly #failedAvatars = signal<ReadonlySet<string>>(new Set());
  protected readonly sheetTitleId = `sd-layout-context-switcher-sheet-title-${nextSheetTitleId++}`;
  // why: Lucide chỉ render icon đã đăng ký và ném lỗi với tên lạ — `unfold_less` không có alias Lucide mặc định,
  // nên khi app dùng Lucide mà không tự alias thì giữ `unfold_more` (đã có alias) cho trạng thái mở.
  protected readonly openIcon =
    this.#iconConfiguration.defaultFontSet === 'lucide' && !this.#iconConfiguration.lucideAliases['unfold_less']
      ? 'unfold_more'
      : 'unfold_less';

  protected readonly switchFailed = this.#context.switchFailed;
  protected readonly changedElsewhere = this.#context.changedElsewhere;
  /** Normalized items of the service; empty while no configuration is bound (INV-013). */
  protected readonly items = computed(() => (this.configuration() ? this.#context.items() : []));
  protected readonly customLabel = computed(() => this.configuration()?.label?.trim() || null);
  protected readonly canOpen = computed(() => this.items().length > 1);
  protected readonly searchable = computed(() => this.configuration()?.searchable ?? this.items().length > 7);
  protected readonly activeId = computed(() => this.#context.current()?.id ?? null);
  protected readonly activeItem = computed(() => {
    const items = this.items();
    return items.find(item => item.id === this.activeId()) ?? items[0] ?? null;
  });
  protected readonly activeInitial = computed(() => initialOf(this.activeItem()?.title));
  readonly #placement = computed(() => this.placement() ?? (this.appearance() === 'rail' ? 'right' : 'below'));
  protected readonly positions = computed(() => {
    if (this.#placement() === 'right') return RIGHT_POSITIONS;
    return this.anchor() ? BELOW_ANCHOR_POSITIONS : BELOW_TRIGGER_POSITIONS;
  });
  protected readonly rows = computed<SdLayoutContextSwitcherRow[]>(() => {
    const query = this.searchable() ? this.query().trim() : '';
    const activeId = this.activeId();
    const switchingId = this.#context.switchingId();
    return this.items()
      .filter(item => !query || [item.title, item.subtitle].some(value => !!value && StringUtilities.aliasIncludes(value, query)))
      .map(item => ({
        item,
        initial: initialOf(item.title),
        active: item.id === activeId,
        busy: item.id === switchingId,
        disabled: !!switchingId && item.id !== switchingId,
      }));
  });
  protected readonly isSwitching = computed(() => !!this.#context.switchingId());

  constructor() {
    // why: switcher chuyển items vào syncItems (D-021). Sidebar mobile có switcher nằm trong drawer/sheet render
    // lười cũng tự chuyển items lúc khởi tạo (EXEC-D1) — syncItems idempotent nên gọi lặp không ghi/reload thêm.
    // untracked để signal đọc trong service không thành dependency của effect. Không có configuration thì không
    // gọi — app không cấu hình context không tạo listener.
    effect(() => {
      const configuration = this.configuration();
      if (!configuration) return;
      const items = configuration.items;
      untracked(() => this.#context.syncItems(items));
    });

    // why: đổi appearance (thu gọn/mở rộng) hoặc còn ≤ 1 mục khi đang mở thì đóng hẳn, tránh overlay mồ côi.
    effect(() => {
      this.appearance();
      this.canOpen();
      untracked(() => this.close(false));
    });

    inject(DestroyRef).onDestroy(() => this.#disposeSheet());
  }

  /** Opens or closes the popover (header, rail) or the bottom sheet (sheet). */
  toggle(): void {
    if (this.#isOpen()) this.close();
    else this.open();
  }

  /** Opens the popover or the bottom sheet; ignored with fewer than two contexts. */
  open(): void {
    if (this.#isOpen() || !this.canOpen()) return;
    this.query.set('');
    if (this.appearance() === 'sheet') {
      this.#isOpen.set(true);
      this.#openSheet();
      return;
    }
    // why: đo lúc mở — popover nằm ngoài sidebar nên không kế thừa được kích thước/biến CSS của nó.
    this.popoverOrigin.set(this.#resolveOrigin());
    this.popoverWidth.set(this.#resolvePopoverWidth());
    this.#isOpen.set(true);
  }

  /** Closes the popover or the bottom sheet; focus returns to the trigger unless `restoreFocus` is false. */
  close(restoreFocus = true): void {
    if (!this.#isOpen()) return;
    this.#isOpen.set(false);
    this.query.set('');
    this.#disposeSheet();
    if (restoreFocus) this.trigger()?.nativeElement.focus();
  }

  protected select(row: SdLayoutContextSwitcherRow): void {
    // why: đang chuyển thì trang sắp reload — khoá mọi lựa chọn để setCurrentContext chỉ chạy một lần (CS2).
    if (this.isSwitching()) return;
    if (row.active) {
      this.close();
      return;
    }
    this.#context.setCurrentContext(row.item.id);
  }

  protected reload(): void {
    this.#context.reload();
  }

  protected onSearch(event: Event): void {
    this.query.set((event.target as HTMLInputElement).value);
  }

  protected onPanelKeydown(event: KeyboardEvent): void {
    if (event.key !== 'Escape') return;
    event.preventDefault();
    // why: sheet nằm trên drawer/sheet menu (D-027) — Esc chỉ đóng sheet context, không tới handler của lớp dưới.
    event.stopPropagation();
    this.close();
  }

  protected showAvatarImage(item: SdLayoutContext | null): boolean {
    return !!item?.avatar && !this.#failedAvatars().has(item.avatar);
  }

  protected onAvatarError(url: string | undefined): void {
    if (!url) return;
    this.#failedAvatars.update(failed => new Set(failed).add(url));
  }

  #openSheet(): void {
    const ref = this.#overlay.create({
      positionStrategy: this.#overlay.position().global().top('0').left('0'),
      width: '100%',
      height: '100%',
      scrollStrategy: this.#overlay.scrollStrategies.block(),
      panelClass: 'sd-layout-context-switcher-sheet-pane',
    });
    this.#sheetRef = ref;
    ref.attach(new TemplatePortal(this.sheetTemplate(), this.#viewContainerRef)).detectChanges();
  }

  #disposeSheet(): void {
    this.#sheetRef?.dispose();
    this.#sheetRef = undefined;
  }

  /** `null` keeps the trigger as origin. */
  #resolveOrigin(): FlexibleConnectedPositionStrategyOrigin | null {
    const anchor = this.anchor();
    if (!anchor) return null;
    if (this.#placement() === 'below') return anchor;
    const trigger = this.trigger()?.nativeElement;
    if (!trigger) return anchor;
    // why: mở từ mép phải của anchor (rail/aside) nhưng canh đỉnh theo trigger — một điểm gốc gộp cả hai trục.
    const anchorRect = anchor.getBoundingClientRect();
    const triggerRect = trigger.getBoundingClientRect();
    return { x: anchorRect.right, y: triggerRect.top, width: 0, height: triggerRect.height };
  }

  #resolvePopoverWidth(): string | null {
    const fromVariable = this.#document.defaultView
      ?.getComputedStyle(this.#host.nativeElement)
      .getPropertyValue(POPOVER_WIDTH_VARIABLE)
      .trim();
    if (fromVariable) return fromVariable;
    const anchor = this.anchor();
    if (!anchor || this.#placement() !== 'below') return null;
    const width = anchor.getBoundingClientRect().width - 2 * ANCHOR_INSET;
    return width > 0 ? `${width}px` : null;
  }
}

function initialOf(title: string | undefined): string {
  const first = Array.from(title?.trim() ?? '')[0];
  return first ? first.toLocaleUpperCase() : '';
}
