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
import { SdTableColumn } from '../../models/table-column.model';
import { SdTableItem } from '../../models/table-item.model';
import { SdTooltipDirective } from '@sdcorejs/angular/directives';

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
  selector: 'sd-desktop-cell-view',
  templateUrl: './desktop-cell-view.component.html',
  styleUrls: ['./desktop-cell-view.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [CommonModule, SdBadge, SdSafeHtmlPipe, SdTooltipDirective, ToStringPipe],
})
export class SdDesktopCellView {
  // Inject
  private cdr = inject(ChangeDetectorRef);

  contentContainer = viewChild<ElementRef<HTMLElement>>('contentContainer');

  isCollapsed = signal<boolean>(true);
  isOverflowing = signal<boolean>(false);

  // Inputs
  autoId = input<string | undefined | null>();
  column = input.required<SdTableColumn>();
  charLimited = input<{ title?: string; width?: string } | undefined>();

  item = input.required<SdTableItem>();
  itemKey = computed(() => {
    const data = this.item().data;
    return data?.id?.toString() || data?.code?.toString() || data?.value?.toString();
  });

  constructor() {
    effect(() => {
      this.charLimited();
      const container = this.contentContainer();
      if (container) {
        this.#checkOverflow(container.nativeElement);
      }
    });
  }

  #checkOverflow = (element: HTMLElement) => {
    // NÃ©m vÃ o queue Ä‘á»ƒ Ä‘á»£i DOM render
    setTimeout(() => {
      const hasOverflow = element.scrollWidth > element.clientWidth || element.scrollHeight > element.clientHeight;
      if (this.isOverflowing() !== hasOverflow) {
        this.isOverflowing.set(hasOverflow);
        this.cdr.markForCheck();
      }
    });
  };

  toggle = () => {
    this.isCollapsed.update(current => !current);
  };
}

