import { ChangeDetectionStrategy as SdAngular22ChangeDetectionStrategy } from '@angular/core';
import { booleanAttribute, Component, computed, effect, ElementRef, inject, input, model } from '@angular/core';
import { Color } from '@sdcorejs/utils/models';
import { SD_ICON_CONFIGURATION, SdIcon, type SdIconShape } from '@sdcorejs/angular/modules/icon';
import { SdTranslatePipe } from '@sdcorejs/angular/i18n';

const SECTION_INTERACTIVE_SELECTOR =
  'a[href], button, input, select, textarea, [role="button"], [role="link"], [contenteditable="true"], [tabindex]';

// why: id tăng dần để nối aria-controls từ header sang body — mỗi instance cần một id duy nhất.
let sectionBodyIdSeq = 0;

@Component({
  changeDetection: SdAngular22ChangeDetectionStrategy.Eager,
  selector: 'sd-section',
  templateUrl: './section.component.html',
  styleUrl: './section.component.scss',
  imports: [SdIcon, SdTranslatePipe],
  host: {
    '(click)': 'onHeaderClick($event)',
  },
})
export class SdSection {
  #el = inject(ElementRef);

  title = input<string | undefined | null>(undefined);
  subTitle = input<string | undefined | null>(undefined);
  icon = input<string | undefined | null>(undefined);
  iconColor = input<Color>('primary', { alias: 'iconColor' });
  /** Hình nền ô icon header; bỏ trống thì dùng `defaultShape` của `provideSdIcon` (mặc định `square`). */
  iconShape = input<SdIconShape | null | undefined>(undefined);

  collapsed = model<boolean>(false, { alias: 'collapsed' });
  collapsible = input(false, { transform: booleanAttribute });

  hideHeader = input(false, { transform: booleanAttribute });

  readonly #iconConfig = inject(SD_ICON_CONFIGURATION);
  protected readonly resolvedIconShape = computed<SdIconShape>(() => this.iconShape() ?? this.#iconConfig.defaultShape);

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

  protected onHeaderClick = (event: MouseEvent): void => {
    const target = event.target;
    if (!(target instanceof Element)) return;

    const header = target.closest('.sd-section-header');
    if (!header || header.closest('sd-section') !== this.#el.nativeElement) return;
    if (target.closest(SECTION_INTERACTIVE_SELECTOR)) return;

    this.toggleCollapse();
  };

  protected onCollapseButtonClick = (event: MouseEvent): void => {
    event.stopPropagation();
    this.toggleCollapse();
  };

  // why: giữ public handler cũ để không làm thay đổi declaration API của component.
  onHeaderKeydown = (event: KeyboardEvent) => {
    if (event.target !== event.currentTarget) return;
    // why: chặn Space cuộn trang trước khi toggle.
    event.preventDefault();
    this.toggleCollapse();
  };
}
