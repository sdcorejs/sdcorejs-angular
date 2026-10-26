import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  ElementRef,
  inject,
  input,
  isDevMode,
  viewChild,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { SdBadge, type SdBadgeData } from '@sdcorejs/angular/components/badge';
import { SdTranslatePipe } from '@sdcorejs/angular/i18n';
import { SdIcon } from '@sdcorejs/angular/modules/icon';

/** Bề rộng cột nội dung: `full` không giới hạn · `wide` 1200px · `medium` 960px · `narrow` 720px. */
export type SdPageWidth = 'full' | 'wide' | 'medium' | 'narrow';

/** Đích của nút ←: URL hoặc router commands như `routerLink`. */
export type SdPageBackLink = string | readonly unknown[];

const SD_PAGE_MAX_BADGES = 2;

@Component({
  selector: 'sd-page',
  templateUrl: './page.component.html',
  styleUrl: './page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, SdBadge, SdIcon, SdTranslatePipe],
  host: {
    '[class.sd-page--wide]': "resolvedWidth() === 'wide'",
    '[class.sd-page--medium]': "resolvedWidth() === 'medium'",
    '[class.sd-page--narrow]': "resolvedWidth() === 'narrow'",
  },
})
export class SdPageComponent {
  private el = inject(ElementRef);

  title = input<string>('', { alias: 'title' });
  description = input<string>('', { alias: 'description' });
  noHeader = input(false, { transform: booleanAttribute, alias: 'noHeader' });

  /** Hiện nút ← trước title; title, description và badges vẫn lấy từ input. */
  backLink = input<SdPageBackLink | null | undefined>();
  /** Tối đa 2 badge cạnh title: trạng thái trước, thuộc tính sau. Badge không có `title` bị bỏ qua. */
  badges = input<readonly SdBadgeData[] | null | undefined>();
  /** `null` / không truyền thì lấy mặc định theo selector (`sd-page`: `full`). */
  width = input<SdPageWidth | null | undefined>();

  readonly resolvedWidth = computed<SdPageWidth>(() => this.width() ?? 'full');
  protected readonly visibleBadges = computed(() =>
    (this.badges() ?? []).filter(badge => badge.title !== null && badge.title !== undefined && badge.title !== '')
  );
  /** Header có nút ← hoặc badge: title một dòng, cắt bằng dấu "…". Màn cũ giữ title xuống dòng như trước. */
  protected readonly hasLead = computed(() => !!this.backLink() || this.visibleBadges().length > 0);

  // why: fallback của slot headerLeft chỉ render khi không có headerLeft/sdHeaderLeft, nên vắng nó nghĩa là
  // vùng trái đã bị thay và backLink không có chỗ hiện.
  private readonly titleBlock = viewChild<ElementRef<HTMLElement>>('titleBlock');

  constructor() {
    effect(() => {
      if (this.title()) {
        this.el.nativeElement.removeAttribute('title');
      }
    });

    if (isDevMode()) {
      effect(() => {
        const badges = this.badges() ?? [];
        const types = badges.map(badge => badge.type ?? 'round');
        if (badges.length > SD_PAGE_MAX_BADGES || new Set(types).size !== types.length) {
          console.warn(
            `[sd-page] badges nhận tối đa ${SD_PAGE_MAX_BADGES} badge và không trùng type (mặc định 'round'): badge đầu là trạng thái, badge sau là thuộc tính. Đang có: ${JSON.stringify(types)}.`
          );
        }
      });
      effect(() => {
        if (this.backLink() && !this.noHeader() && !this.titleBlock()) {
          console.warn('[sd-page] backLink bị bỏ qua vì headerLeft/sdHeaderLeft đã thay cả vùng trái của header.');
        }
      });
    }
  }
}
