import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  computed,
  ElementRef,
  inject,
  Injector,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { SdTranslatePipe } from '@sdcorejs/angular/i18n';
import { SdIcon } from '@sdcorejs/angular/modules/icon';
import { isGroup } from '../state/builder-document';
import { BuilderDragService } from '../state/builder-drag';
import { GRID_COLUMNS } from '../state/builder-layout';
import { PALETTE_CATEGORIES, PaletteCategory, PaletteItem, SD_FORM_BUILDER_PALETTE } from '../state/builder-palette';
import { FormBuilderStore } from '../state/builder-store';
import { StructureComponent } from './structure.component';

let nextPaletteId = 0;

interface PaletteSection {
  readonly category: PaletteCategory;
  readonly items: readonly PaletteItem[];
}

/**
 * Panel trái: tab "Thành phần" (palette có tìm kiếm, bấm/Enter/Space hoặc kéo để thêm) và tab
 * "Cấu trúc" (cây phản chiếu schema). Cùng một vị trí chèn cho click, bàn phím và kéo-thả.
 */
@Component({
  selector: 'fb-palette',
  templateUrl: './palette.component.html',
  styleUrl: './palette.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SdIcon, SdTranslatePipe, StructureComponent],
})
export class PaletteComponent {
  readonly store = inject(FormBuilderStore);
  readonly #drag = inject(BuilderDragService);
  readonly #injector = inject(Injector);
  /** Tiền tố id riêng cho từng builder — hai builder trên một trang không trùng id tab. */
  readonly uid = `fb-palette-${++nextPaletteId}`;

  /** Phần tử vừa được thêm/chọn từ cây — shell cuộn canvas tới đó. */
  readonly itemAdded = output<string>();
  readonly itemFocused = output<string>();

  readonly search = signal('');
  readonly collapsedCategories = signal<ReadonlySet<PaletteCategory>>(new Set());
  readonly searchInput = viewChild<ElementRef<HTMLInputElement>>('searchInput');

  readonly sections = computed<PaletteSection[]>(() => {
    const term = this.search().trim().toLocaleLowerCase();
    return PALETTE_CATEGORIES.map(category => ({
      category,
      items: SD_FORM_BUILDER_PALETTE.filter(entry => {
        if (entry.category !== category) return false;
        if (!term) return true;
        const label = this.store.t(entry.labelKey).toLocaleLowerCase();
        return label.includes(term) || entry.id.includes(term) || entry.keywords.some(keyword => keyword.includes(term));
      }),
    })).filter(section => section.items.length);
  });

  /** Đích thêm khi bấm (hiển thị rõ cho người dùng). */
  readonly target = computed(() => {
    const selected = this.store.selected();
    if (!selected) return { kind: 'root' as const, label: '' };
    if (isGroup(selected.item)) return { kind: 'group' as const, label: this.store.labelOf(selected.item) };
    return { kind: 'after' as const, label: this.store.labelOf(selected.item) };
  });

  /** Esc trong ô tìm: xoá từ khoá nếu có và dừng ở đó — Esc tiếp theo mới đóng panel nổi. */
  clearSearch(event: Event): void {
    if (!this.search()) return;
    event.stopPropagation();
    this.search.set('');
  }

  focusSearch(): void {
    this.store.leftTab.set('components');
    // why: sau lần render kế tiếp — ô tìm kiếm có thể vừa hiện (đổi tab, mở panel nổi khi builder hẹp).
    afterNextRender(() => this.searchInput()?.nativeElement.focus(), { injector: this.#injector });
  }

  isCollapsed = (category: PaletteCategory): boolean => !this.search() && this.collapsedCategories().has(category);

  toggleCategory(category: PaletteCategory): void {
    const next = new Set(this.collapsedCategories());
    if (next.has(category)) next.delete(category);
    else next.add(category);
    this.collapsedCategories.set(next);
  }

  add(entry: PaletteItem): void {
    const id = this.store.addFromPalette(entry);
    if (id) this.itemAdded.emit(id);
  }

  /** Kéo từ palette: chuột/bút từ cả mục; cảm ứng chỉ từ tay nắm (vuốt trên danh sách vẫn cuộn). */
  onPointerDown(event: PointerEvent, entry: PaletteItem, fromGrip = false): void {
    if (event.pointerType === 'touch' && !fromGrip) return;
    this.#drag.arm(event, {
      subject: () => ({ kind: 'new', item: this.store.createFromPalette(entry) }),
      label: this.store.t(entry.labelKey),
      icon: entry.icon,
      isGroup: entry.type === 'group',
      span: entry.type === 'group' ? GRID_COLUMNS : GRID_COLUMNS,
    });
  }

  /** Đổi tab bằng bàn phím và đưa focus sang tab mới (tab cũ đã thành `tabindex=-1`). */
  switchTab(tab: 'components' | 'structure', target: HTMLElement, event: Event): void {
    event.preventDefault();
    this.store.leftTab.set(tab);
    target.focus();
  }

  clearSelection(): void {
    this.store.select(null);
  }
}
