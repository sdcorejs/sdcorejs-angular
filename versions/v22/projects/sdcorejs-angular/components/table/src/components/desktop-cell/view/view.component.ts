import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  Pipe,
  PipeTransform,
  computed,
  effect,
  inject,
  input,
  signal,
  viewChild,
} from '@angular/core';
import { SdBadge } from '@sdcorejs/angular/components/badge';
import { SdSafeHtmlPipe } from '@sdcorejs/angular/pipes';
import { SdTooltipDirective } from '@sdcorejs/angular/directives';
import { SdTableColumn } from '../../../models/table-column.model';
import { SdTableItem } from '../../../models/table-item.model';
import { SdTranslatePipe } from '@sdcorejs/angular/i18n';

@Pipe({
  name: 'asString',
  standalone: true,
})
export class ToStringPipe implements PipeTransform {
  transform(value: any): string {
    return value !== null && value !== undefined ? String(value) : '';
  }
}

@Component({
  selector: 'view',
  templateUrl: './view.component.html',
  styleUrl: './view.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [CommonModule, SdBadge, SdSafeHtmlPipe, SdTooltipDirective, ToStringPipe, SdTranslatePipe],
})
export class ViewComponent {
  // Inject
  #cdr = inject(ChangeDetectorRef);

  contentContainer = viewChild<ElementRef<HTMLElement>>('contentContainer');

  isCollapsed = signal<boolean>(true);
  isOverflowing = signal<boolean>(false);

  // Inputs
  autoId = input.required<string | undefined | null>();
  column = input.required<SdTableColumn>();
  item = input.required<SdTableItem>();

  truncateEnable = computed(() => {
    return this.column()?.cell?.truncate?.enable;
  });

  truncateWidth = computed(() => {
    return this.column()?.width;
  });

  constructor() {
    effect(() => {
      this.truncateWidth();
      const container = this.contentContainer();
      if (container) {
        this.#checkOverflow(container.nativeElement);
      }
    });
  }

  #checkOverflow = (element: HTMLElement) => {
    // Ném vào queue để đợi DOM render
    setTimeout(() => {
      const hasOverflow = element.scrollWidth > element.clientWidth || element.scrollHeight > element.clientHeight;
      if (this.isOverflowing() !== hasOverflow) {
        this.isOverflowing.set(hasOverflow);
        this.#cdr.markForCheck();
      }
    });
  };

  toggle = () => {
    this.isCollapsed.update(current => !current);
  };

  // why: ô HTML có `view.click` nay là role="button" + tabindex="0" nên Enter/Space phải chạy
  // đúng như click. `view.data` là HTML do consumer cung cấp và có thể chứa control riêng —
  // chỉ xử lý khi CHÍNH ô đang giữ focus để không kích hoạt hai lần.
  onViewKeydown = (event: KeyboardEvent) => {
    if (event.target !== event.currentTarget) return;
    // why: chặn Space cuộn trang.
    event.preventDefault();
    this.item().meta.display[this.column().field]?.click?.();
  };
}
