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
import { SdDesktopCellView } from '../desktop-cell-view/desktop-cell-view.component';
import { SdTooltipDirective } from '@sdcorejs/angular/directives';

interface CharLimited {
  title?: string;
  width?: string;
}

@Component({
  selector: 'sd-desktop-cell',
  templateUrl: './desktop-cell.component.html',
  styleUrls: ['./desktop-cell.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [CommonModule, SdDesktopCellView, SdTooltipDirective],
})
export class SdDesktopCell {
  // Inject
  private cdr = inject(ChangeDetectorRef);

  // ViewChild
  contentContainer = viewChild<ElementRef<HTMLElement>>('contentContainer');

  // Inputs
  charLimited = input<CharLimited | undefined>();
  value = input<any>();
  column = input.required<SdTableColumn>();
  cellDef = input<Record<string, SdTabelCellDefDirective>>({});

  autoIdInput = input<string | undefined | null>(undefined, { alias: 'autoId' });
  autoId = computed(() => {
    const val = this.autoIdInput();
    return val ? `${val}-view-` : undefined;
  });

  item = input.required<SdTableItem>({ alias: 'item' });
  itemKey = computed(() => {
    const data = this.item()?.data;
    return data?.id?.toString() || data?.code?.toString() || data?.value?.toString() || '';
  });

  isCollapsed = signal<boolean>(true);
  isOverflowing = signal<boolean>(false);

  constructor() {
    effect(() => {
      this.charLimited();
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
        this.cdr.markForCheck();
      }
    });
  };
}

