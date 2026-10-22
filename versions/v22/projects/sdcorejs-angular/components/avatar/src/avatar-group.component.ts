import { A11yModule } from '@angular/cdk/a11y';
import { ConnectedPosition, OverlayModule } from '@angular/cdk/overlay';
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  EventEmitter,
  Output,
  computed,
  inject,
  input,
  signal,
  viewChild,
} from '@angular/core';
import { I18nService, SdTranslatePipe } from '@sdcorejs/angular/i18n';
import { Color } from '@sdcorejs/utils/models';
import { SdAvatar } from './avatar.component';

/** Một người trong `sd-avatar-group`. */
export interface SdAvatarGroupItem {
  src: string | null | undefined;
  name?: string | null;
  status?: Color | null;
  statusLabel?: string | null;
  statusPulse?: boolean;
}

const SD_AVATAR_GROUP_URL = /^(http|https|data:image|\/)/;

/** Tên hiển thị của một người: `name`, hoặc `src` khi `src` là tên. */
function personName(item: SdAvatarGroupItem): string {
  const src = item.src || '';
  return item.name?.trim() || (SD_AVATAR_GROUP_URL.test(src) ? '' : src.trim());
}

@Component({
  selector: 'sd-avatar-group',
  standalone: true,
  imports: [A11yModule, OverlayModule, SdAvatar, SdTranslatePipe],
  templateUrl: './avatar-group.component.html',
  styleUrl: './avatar-group.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    role: 'group',
    '[attr.aria-label]': 'groupLabel()',
    '[style.--sd-avatar-group-size]': "size() + 'px'",
    '[style.--sd-avatar-group-overlap]': "overlap() + 'px'",
    '[style.--sd-avatar-group-ring]': "ringWidth() + 'px'",
  },
})
export class SdAvatarGroup {
  readonly #i18n = inject(I18nService);

  /** Danh sách người: `{ src, name?, status?, statusLabel?, statusPulse? }`. */
  readonly items = input<SdAvatarGroupItem[], SdAvatarGroupItem[] | null | undefined>([], { transform: value => value ?? [] });
  /** Số avatar hiện. Chỉ dư đúng một người thì hiện luôn người đó, không có ô "+1". */
  readonly max = input<number>(4);
  /** Cỡ của từng avatar (px). */
  readonly size = input<number>(32);
  /** Tên của nhóm cho screen reader; mặc định i18n "{n} người". */
  readonly ariaLabel = input<string | null | undefined>();

  // why: EventEmitter (không phải output()) để đọc `.observed` — có người nghe thì "+N" chỉ phát sự kiện, không mở
  // popover mặc định; cùng tiền lệ output `click` của sd-badge (quyết định 9 của đợt 3).
  /** Phát danh sách người bị ẩn khi bấm "+N". Có người nghe thì không mở popover mặc định. */
  @Output() readonly moreClick = new EventEmitter<SdAvatarGroupItem[]>();

  readonly isOpen = signal(false);
  private readonly moreButton = viewChild<ElementRef<HTMLButtonElement>>('more');

  readonly visible = computed(() => {
    const items = this.items();
    const max = Math.max(0, this.max());
    // why: ô "+1" chiếm đúng một chỗ avatar — hiện luôn người đó thì có ích hơn.
    return items.length <= max + 1 ? items : items.slice(0, max);
  });
  readonly hidden = computed(() => this.items().slice(this.visible().length));
  readonly groupLabel = computed(
    () => this.ariaLabel() || this.#i18n.t('core.component.avatar.group-label', { count: this.items().length })
  );
  /** Mỗi avatar lấn sang avatar trước round(size × 0.15) — đủ nhỏ để không che chữ viết tắt phía sau. */
  readonly overlap = computed(() => Math.round(this.size() * 0.15));
  readonly ringWidth = computed(() => (this.size() >= 64 ? 3 : 2));
  readonly moreFontSize = computed(() => this.size() / 2.5);

  readonly positions: ConnectedPosition[] = [
    { originX: 'center', originY: 'bottom', overlayX: 'center', overlayY: 'top', offsetY: 8 },
    { originX: 'center', originY: 'top', overlayX: 'center', overlayY: 'bottom', offsetY: -8 },
    { originX: 'start', originY: 'bottom', overlayX: 'start', overlayY: 'top', offsetY: 8 },
    { originX: 'end', originY: 'bottom', overlayX: 'end', overlayY: 'top', offsetY: 8 },
  ];

  nameOf = (item: SdAvatarGroupItem): string => personName(item);

  /** Tooltip của từng avatar: "{tên} · {statusLabel}". */
  tooltipOf = (item: SdAvatarGroupItem): string => {
    const label = item.status ? item.statusLabel?.trim() : '';
    return [personName(item), label].filter(Boolean).join(' · ');
  };

  onMore(): void {
    if (this.moreClick.observed) {
      this.moreClick.emit([...this.hidden()]);
      return;
    }
    this.isOpen.update(open => !open);
  }

  close(restoreFocus = true): void {
    if (!this.isOpen()) return;
    this.isOpen.set(false);
    if (restoreFocus) this.moreButton()?.nativeElement.focus();
  }

  onOverlayKeydown(event: KeyboardEvent): void {
    if (event.key !== 'Escape' && event.key !== 'Esc') return;
    event.preventDefault();
    this.close();
  }
}
