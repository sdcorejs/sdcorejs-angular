import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  input,
  signal,
  TemplateRef,
  viewChild,
  computed,
  effect,
  inject,
  ChangeDetectorRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { SdTableCellDefDirective } from '../../directives/sd-table-cell-def.directive';
import { SdTableColumn } from '../../models/table-column.model';
import { SdTableItem } from '../../models/table-item.model';
import { SdTooltipDirective } from '@sdcorejs/angular/directives';
import { Utilities } from '@sdcorejs/utils/fns';
import { ViewComponent } from './view/view.component';
import { TranslatePipe } from '@sdcorejs/angular/i18n';


@Component({
  selector: 'desktop-cell',
  templateUrl: './desktop-cell.component.html',
  styleUrls: ['./desktop-cell.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [CommonModule, SdTooltipDirective, ViewComponent, TranslatePipe],
})
export class DesktopCellComponent {
  // Inject
  #cdr = inject(ChangeDetectorRef);

  // ViewChild
  contentContainer = viewChild<ElementRef<HTMLElement>>('contentContainer');

  // Inputs
  column = input.required<SdTableColumn>();
  item = input.required<SdTableItem>();
  cellDef = input.required<Record<string, SdTableCellDefDirective>>({});

  value = computed(() => {
    return Utilities.getNestedValue(this.item()?.data, this.column()?.field);
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

  // why: widen to TemplateRef<any> so ng-packagr doesn't try to surface the
  // directive's internal Context type through this public computed.
  templateRef = computed<TemplateRef<any> | undefined>(() => {
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
    // Ném vào queue để đợi DOM render
    setTimeout(() => {
      const hasOverflow = element.scrollWidth > element.clientWidth || element.scrollHeight > element.clientHeight;
      if (this.isOverflowing() !== hasOverflow) {
        this.isOverflowing.set(hasOverflow);
        this.#cdr.markForCheck();
      }
    });
  };
}
