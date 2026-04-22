import { Directive, HostBinding, HostListener, inject, Input } from '@angular/core';
import { Router } from '@angular/router';

@Directive({
  selector: 'a[sdHref]',
  standalone: true,
})
export class SdHrefDirective {
  readonly #router = inject(Router);
  // Nhận vào url đã được xử lý (từ Pipe của bạn)
  @Input('sdHref') url!: string;
  // Tự động bind giá trị url vào thuộc tính href của thẻ <a>
  @HostBinding('attr.href') get href() {
    return this.url || 'javascript:;';
  }

  @HostListener('click', ['$event'])
  onClick(event: Event) {
    if (!this.url) return;
    if (this.url.startsWith('http')) {
      // Nếu là link ngoài -> Mở tab mới và ngăn chặn hành vi mặc định của thẻ a (để không chuyển trang hiện tại)
      window.open(this.url, '_blank');
      event.preventDefault();
    } else {
      // Nếu là link nội bộ -> Ngăn chặn full-page reload, dùng Angular Router để điều hướng
      event.preventDefault();
      const [path, queryString] = this.url.split('?');
      // Bạn có thể dùng hàm SdUtilities.parseQueryParams của bạn ở đây,
      // hoặc dùng cách native URLSearchParams như sau:
      const params = new URLSearchParams(queryString || '');
      const queryParams: Record<string, string> = {};
      params.forEach((value, key) => (queryParams[key] = value));
      this.#router.navigate([path], { queryParams });
    }
  }
}
