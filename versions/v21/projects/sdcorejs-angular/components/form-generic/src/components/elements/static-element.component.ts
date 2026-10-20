import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { SdInform } from '@sdcorejs/angular/components/inform';
import type { SdFormGenericHeadingLevel, SdFormGenericNoticeColor, SdFormGenericStatic } from '../../models/form-generic-element.model';
import { sdFormGenericImageSrc, sdFormGenericLinkHref } from '../../rules/form-generic-url';

const LEVELS: ReadonlySet<unknown> = new Set([2, 3, 4]);
const NOTICE_COLORS: ReadonlySet<unknown> = new Set(['info', 'success', 'warning', 'error']);

const textOf = (value: unknown): string => (typeof value === 'string' ? value : '');

/**
 * Một phần tử Tĩnh (heading, paragraph, quote, image, link, divider, notice), dùng chung cho `sd-form-render` và
 * canvas của builder. Chỉ có input, không FormControl. Chữ chỉ đi qua text binding (không HTML); `href`/`src`
 * chỉ qua chính sách URL dùng chung — URL bị từ chối thì không có thẻ `a`/`img`. Cảnh báo URL do renderer phát.
 */
@Component({
  selector: 'lib-static-element',
  templateUrl: './static-element.component.html',
  styleUrl: './static-element.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SdInform],
})
export class LibStaticElementComponent {
  readonly element = input.required<SdFormGenericStatic>();

  readonly #record = computed(() => this.element() as unknown as Record<string, unknown>);

  readonly text = computed(() => textOf(this.#record()['text']));
  /** Cấp tiêu đề: 2–4, mặc định (và khi sai) là 3. */
  readonly level = computed<SdFormGenericHeadingLevel>(() => {
    const level = this.#record()['level'];
    return LEVELS.has(level) ? (level as SdFormGenericHeadingLevel) : 3;
  });
  readonly cite = computed(() => textOf(this.#record()['cite']).trim());
  readonly alt = computed(() => textOf(this.#record()['alt']));
  readonly caption = computed(() => textOf(this.#record()['caption']).trim());
  readonly width = computed(() => {
    const width = this.#record()['width'];
    return typeof width === 'number' && Number.isFinite(width) && width > 0 ? width : null;
  });
  readonly newTab = computed(() => this.#record()['newTab'] === true);
  readonly safeHref = computed(() => (this.element().type === 'link' ? sdFormGenericLinkHref(this.#record()['href']) : null));
  readonly safeSrc = computed(() => (this.element().type === 'image' ? sdFormGenericImageSrc(this.#record()['src']) : null));
  /** Màu của notice; truyền tường minh vì `sd-inform` mặc định `primary`. */
  readonly noticeColor = computed<SdFormGenericNoticeColor>(() => {
    const color = this.#record()['color'];
    return NOTICE_COLORS.has(color) ? (color as SdFormGenericNoticeColor) : 'info';
  });
  readonly noticeTitle = computed(() => textOf(this.#record()['title']).trim() || undefined);
}
