import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  input,
  signal,
  viewChild,
  computed,
  effect,
  inject,
  ChangeDetectorRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { SdTabelCellDefDirective } from '../../directives/sd-table-cell-def.directive';
import { SdTableColumn } from '../../models/table-column.model';
import { SdTableItem } from '../../models/table-item.model';
import { SdTooltipDirective } from '@sdcorejs/angular/directives';
import { SdUtilities } from '@sdcorejs/angular/utilities';
import { ViewComponent } from './view/view.component';


@Component({
  selector: 'desktop-cell',
  templateUrl: './desktop-cell.component.html',
  styleUrls: ['./desktop-cell.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [CommonModule, SdTooltipDirective, ViewComponent],
})
export class DesktopCellComponent {
  // Inject
  #cdr = inject(ChangeDetectorRef);

  // ViewChild
  contentContainer = viewChild<ElementRef<HTMLElement>>('contentContainer');

  // Inputs
  column = input.required<SdTableColumn>();
  item = input.required<SdTableItem>();
  cellDef = input.required<Record<string, SdTabelCellDefDirective>>({});

  value = computed(() => {
    return SdUtilities.getNestedValue(this.item()?.data, this.column()?.field);
  });

  key = computed(() => {
    const data = this.item()?.data;
    return data?.id?.toString() || data?.code?.toString() || data?.value?.toString() || '';
  });

  autoId = computed(() => {
    const column = this.column();
    const key = this.key();
    return `${key}_${column.field}`;
  });

  truncateEnable = computed(() => {
    return this.column()?.cell?.truncate?.enable;
  });

  truncateWidth = computed(() => {
    return this.column()?.width;
  });

  templateRef = computed(() => {
    const cellDef = this.cellDef();
    const column = this.column();
    return cellDef[column?.field]?.templateRef || column?.cell?.templateRef;
  });

  isCollapsed = signal<boolean>(true);
  isOverflowing = signal<boolean>(false);

  constructor() {
    effect(() => {
      this.truncateWidth();
      const container = this.contentContainer();
      if (container) {
        this.#checkOverflow(container.nativeElement);
      }
    });
  }

  toggle = () => {
    this.isCollapsed.update(current => !current);
  };

  #checkOverflow = (element: HTMLElement): void => {
    // NÃ©m vÃ o queue Ä‘á»ƒ Ä‘á»£i DOM render
    setTimeout(() => {
      const hasOverflow = element.scrollWidth > element.clientWidth || element.scrollHeight > element.clientHeight;
      if (this.isOverflowing() !== hasOverflow) {
        this.isOverflowing.set(hasOverflow);
        this.#cdr.markForCheck();
      }
    });
  };
}

