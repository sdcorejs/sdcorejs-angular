import { Directive, HostBinding, HostListener, inject, input } from '@angular/core';
import { Router } from '@angular/router';

@Directive({
  selector: 'a[sdHref]',
  standalone: true,
})
export class SdHrefDirective {
  readonly #router = inject(Router);
  // Nhận vào url đã được xử lý (từ Pipe của bạn)
  readonly url = input.required<string>({ alias: 'sdHref' });
  // Tự động bind giá trị url vào thuộc tính href của thẻ <a>
  @HostBinding('attr.href') get href() {
    return this.url() || 'javascript:;';
  }

  @HostListener('click', ['$event'])
  onClick(event: Event) {
    const url = this.url();
    if (!url) return;
    if (url.startsWith('http')) {
      // Nếu là link ngoài -> Mở tab mới và ngăn chặn hành vi mặc định của thẻ a (để không chuyển trang hiện tại)
      window.open(url, '_blank');
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
