import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { sdFindHighlightRanges } from '@sdcorejs/angular/utilities/extensions';

/** Một đoạn của text: khớp (render trong `<mark>`) hoặc không. */
export interface SdHighlightSegment {
  readonly text: string;
  readonly match: boolean;
}

/**
 * Hiển thị `text` và bọc mọi đoạn khớp `term` trong `<mark>` — không phân biệt dấu (kể cả đ/Đ) và
 * hoa-thường, dùng `sdFindHighlightRanges`.
 *
 * why: highlight kiểu cũ dựng HTML bằng chuỗi (`<mark>` + innerHTML) nên dữ liệu chứa markup bị parse
 * thành phần tử thật. Ở đây mỗi đoạn là một text node của template — markup trong dữ liệu luôn hiện
 * nguyên dạng chữ.
 */
@Component({
  selector: 'sd-highlight',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  // why: viết liền một dòng — khoảng trắng định dạng giữa các block sẽ thành khoảng trắng thật trong text.
  template: `@for (segment of segments(); track $index) {
    @if (segment.match) {
      <mark class="sd-highlight-mark">{{ segment.text }}</mark>
    } @else {
      <ng-container>{{ segment.text }}</ng-container>
    }
  }`,
  styles: [
    `
      .sd-highlight-mark {
        background-color: var(--sd-highlight-bg, Mark);
        color: var(--sd-highlight-color, MarkText);
        padding: 0;
        border-radius: 2px;
      }
    `,
  ],
  host: { class: 'sd-highlight' },
})
export class SdHighlight {
  /** Text cần hiển thị. Số được chuyển thành chuỗi; `null`/`undefined` hiện rỗng. */
  readonly text = input<string | number | null | undefined>('');
  /** Từ khoá cần tô. Trống (hoặc chỉ có khoảng trắng) thì không tô gì. */
  readonly term = input<string | null | undefined>('');

  readonly segments = computed<readonly SdHighlightSegment[]>(() => {
    const raw = this.text();
    const text = raw == null ? '' : String(raw);
    if (!text) return [];
    const ranges = sdFindHighlightRanges(text, this.term());
    if (!ranges.length) return [{ text, match: false }];

    const segments: SdHighlightSegment[] = [];
    let cursor = 0;
    for (const { start, end } of ranges) {
      if (start > cursor) segments.push({ text: text.slice(cursor, start), match: false });
      segments.push({ text: text.slice(start, end), match: true });
      cursor = end;
    }
    if (cursor < text.length) segments.push({ text: text.slice(cursor), match: false });
    return segments;
  });
}
