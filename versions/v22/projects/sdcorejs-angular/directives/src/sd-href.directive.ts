import { Directive, HostBinding, HostListener, inject, input } from '@angular/core';
import { Router } from '@angular/router';
import { sdIsExternalHttpUrl, sdOpenExternal } from '@sdcorejs/angular/utilities';

@Directive({
  selector: 'a[sdHref]',
  standalone: true,
})
export class SdHrefDirective {
  readonly #router = inject(Router);
  // Nhận vào url đã được xử lý (từ Pipe của bạn)
  readonly url = input.required<string>({ alias: 'sdHref' });
  // Tự động bind giá trị url vào thuộc tính href của thẻ <a>
  // why: fallback cũ là `'javascript:;'` — Angular URL sanitizer chặn giá trị này và log cảnh báo
  // "sanitizing unsafe URL value" mỗi lần render. Nhưng bỏ hẳn attribute (`null`) cũng sai: một
  // `<a>` KHÔNG có `href` thì không Tab tới được và không kích hoạt được bằng Enter, trong khi
  // click handler vẫn gắn — chỉ chuột dùng được. `'#'` giữ nguyên ngữ nghĩa link (focusable +
  // Enter) mà sanitizer không đụng tới; `onClick` chặn hành vi mặc định nên không nhảy fragment.
  @HostBinding('attr.href') get href(): string {
    return this.url() || '#';
  }

  @HostListener('click', ['$event'])
  onClick(event: Event) {
    const url = this.url();
    if (!url) {
      // why: href fallback là `'#'`. Không chặn thì trình duyệt nhảy tới fragment rỗng và ghi thêm
      // một entry vào history mỗi lần bấm.
      event.preventDefault();
      return;
    }
    // why: điều kiện cũ `url.startsWith('http')` nhận cả `'httpfoo'`, và `window.open(url, '_blank')`
    // thiếu `noopener` nên trang mở ra giữ được `window.opener` (reverse tabnabbing).
    // `sdOpenExternal` chỉ mở khi parse ra scheme http:/https: và luôn truyền `noopener,noreferrer`.
    if (sdIsExternalHttpUrl(url)) {
      // Nếu là link ngoài -> Mở tab mới và ngăn chặn hành vi mặc định của thẻ a (để không chuyển trang hiện tại)
      sdOpenExternal(url);
      event.preventDefault();
    } else {
      // Nếu là link nội bộ -> Ngăn chặn full-page reload, dùng Angular Router để điều hướng
      event.preventDefault();
      const [path, queryString] = url.split('?');
      // Bạn có thể dùng hàm SdUtilities.parseQueryParams của bạn ở đây,
      // hoặc dùng cách native URLSearchParams như sau:
      const params = new URLSearchParams(queryString || '');
      const queryParams: Record<string, string> = {};
      params.forEach((value, key) => (queryParams[key] = value));
      this.#router.navigate([path], { queryParams });
    }
  }
}
