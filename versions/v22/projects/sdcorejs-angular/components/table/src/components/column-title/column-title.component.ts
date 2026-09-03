import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { SdTableTitleDefDirective } from '../../directives/sd-table-title-def.directive';
import { SdTableColumn } from '../../models/table-column.model';
import { NgTemplateOutlet } from '@angular/common';

@Component({
  selector: 'column-title',
  templateUrl: './column-title.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [NgTemplateOutlet],
})
export class ColumnTitleComponent {
  column = input.required<SdTableColumn>();
  titleDef = input<SdTableTitleDefDirective | undefined>(undefined);

  templateRef = computed(() => {
    const title = this.column()?.title;
    if (typeof title === 'object') {
      return title?.templateRef || this.titleDef()?.templateRef;
    }
    return this.titleDef()?.templateRef;
  });
}
