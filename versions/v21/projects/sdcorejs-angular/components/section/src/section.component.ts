import { booleanAttribute, Component, effect, ElementRef, inject, input, model } from '@angular/core';
import { Color } from '@sdcorejs/utils/models';
import { SdIcon } from '@sdcorejs/angular/modules/icon';

// why: id tăng dần để nối aria-controls từ header sang body — mỗi instance cần một id duy nhất.
let sectionBodyIdSeq = 0;

@Component({
  selector: 'sd-section',
  templateUrl: './section.component.html',
  styleUrl: './section.component.scss',
  imports: [SdIcon],
})
export class SdSection {
  #el = inject(ElementRef);

  title = input<string | undefined | null>(undefined);
  subTitle = input<string | undefined | null>(undefined);
  icon = input<string | undefined | null>(undefined);
  iconColor = input<Color>('primary', { alias: 'iconColor' });

  collapsed = model<boolean>(false, { alias: 'collapsed' });
  collapsible = input(false, { transform: booleanAttribute });

  hideHeader = input(false, { transform: booleanAttribute });

  /** Id của vùng body, để header `aria-controls` trỏ tới khi section collapsible. */
  readonly bodyId = `sd-section-body-${++sectionBodyIdSeq}`;

  constructor() {
    effect(() => {
      if (this.title()) {
        this.#el.nativeElement.removeAttribute('title');
      }
    });
  }

  toggleCollapse = () => {
    if (this.collapsible()) {
      this.collapsed.set(!this.collapsed());
    } else {
      if (this.collapsed()) {
        this.collapsed.set(false);
      }
    }
  };

  // why: header là div[role=button] nhưng consumer chiếu nội dung tuỳ ý vào [sdHeaderRight]
  // (thường là nút bấm). Nếu không lọc theo target thì Enter/Space trên nút của consumer vừa
  // kích hoạt nút vừa gập section. Chỉ xử lý khi chính header đang giữ focus.
  onHeaderKeydown = (event: KeyboardEvent) => {
    if (event.target !== event.currentTarget) return;
    // why: chặn Space cuộn trang trước khi toggle.
    event.preventDefault();
    this.toggleCollapse();
  };
}
