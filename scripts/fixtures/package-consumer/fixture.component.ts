import { Component } from '@angular/core';
import { SdButton } from '@sdcorejs/angular/components/button';
import { SdDateRange } from '@sdcorejs/angular/forms/date-range';
import type { SdFileExplorerAction, SdFileExplorerActionGroup, SdFileExplorerActionLeaf, SdFileExplorerItem } from '@sdcorejs/angular/components/file-explorer';
import { SdTable, SdTableOption, SdTableRowMobileDefDirective } from '@sdcorejs/angular/components/table';
import { EMPTY_STR } from '@sdcorejs/utils/constants';
import { Utilities } from '@sdcorejs/utils/fns';
import type { Color } from '@sdcorejs/utils/models';

// Compatibility with pre-3.1 consumer interfaces and direct callback invocation is a packed-package contract.
export interface LegacyExplorerAction extends SdFileExplorerActionLeaf<SdFileExplorerItem> {
  consumerKey: string;
}
export const legacyExplorerAction: LegacyExplorerAction = {
  consumerKey: 'legacy',
  title: 'Legacy',
  click: item => {
    void item.id;
  },
};
export function invokeLegacyExplorerAction(action: SdFileExplorerActionLeaf<SdFileExplorerItem>, item: SdFileExplorerItem): void {
  action.click(item);
}
export function invokeLegacyExplorerGroup(group: SdFileExplorerActionGroup<SdFileExplorerItem>, item: SdFileExplorerItem): void {
  group.children[0].click(item);
}
export const canonicalExplorerAction: SdFileExplorerAction<SdFileExplorerItem> = {
  title: 'Canonical',
  children: [
    {
      title: 'Run',
      onClick: item => {
        void item.id;
      },
    },
    legacyExplorerAction,
  ],
};

@Component({
  selector: 'app-mobile-package-consumer-fixture',
  standalone: true,
  imports: [SdTable, SdTableRowMobileDefDirective],
  template: `
    <sd-table [option]="tableOption">
      <ng-template [sdTableRowMobileDef]="tableOption" let-row="item" let-selected="selected">
        {{ row.name.toUpperCase() }} {{ selected }}
      </ng-template>
    </sd-table>`,
})
export class MobilePackageConsumerFixtureComponent {
  readonly tableOption: SdTableOption<{ id: number; name: string }> = {
    type: 'local', rowKey: 'id', items: () => [{ id: 1, name: 'Order' }],
    columns: [{ field: 'name', type: 'string', title: 'Name' }],
  };
}

@Component({
  selector: 'app-package-consumer-fixture',
  standalone: true,
  imports: [SdButton, SdDateRange],
  template: '<sd-button [color]="color">Save</sd-button><sd-date-range />',
})
export class PackageConsumerFixtureComponent {
  readonly color: Color = 'primary';
  readonly empty = EMPTY_STR;
  readonly utilities = Utilities;
}
