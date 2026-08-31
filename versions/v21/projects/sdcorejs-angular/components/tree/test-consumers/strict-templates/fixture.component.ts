import { ChangeDetectionStrategy, Component } from '@angular/core';
import { SdTree, SdTreeComponentOption, SdTreeItemDefDirective } from '@sdcorejs/angular/components/tree';

interface Category {
  id: string;
  name: string;
}

@Component({
  selector: 'test-tree-item-def-strict-consumer',
  standalone: true,
  imports: [SdTree, SdTreeItemDefDirective],
  template: `
    <sd-tree [option]="option">
      <ng-template sdTreeItemDef let-item>
        {{ item.name }}
      </ng-template>
    </sd-tree>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TreeItemDefStrictConsumerFixture {
  readonly option: SdTreeComponentOption<Category> = {
    items: [
      {
        id: 'category-1',
        label: 'Category 1',
        data: { id: 'category-1', name: 'Category 1' },
      },
    ],
    tree: { loadType: 'static' },
  };
}
