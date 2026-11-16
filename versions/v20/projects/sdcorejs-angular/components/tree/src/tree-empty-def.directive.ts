import { Directive, TemplateRef, inject } from '@angular/core';
import { SdTreeEmptyContext } from './tree.model';

/**
 * Thay nội dung mặc định khi cây không có hàng nào để hiện: cây rỗng (`searching: false`) hoặc
 * không có mục khớp chữ đang tìm (`searching: true`, `text` là chữ đó).
 */
@Directive({
  selector: '[sdTreeEmptyDef]',
  standalone: true,
})
export class SdTreeEmptyDefDirective {
  static ngTemplateContextGuard(_dir: SdTreeEmptyDefDirective, ctx: unknown): ctx is SdTreeEmptyContext {
    return true;
  }

  readonly templateRef: TemplateRef<SdTreeEmptyContext> = inject(TemplateRef);
}
