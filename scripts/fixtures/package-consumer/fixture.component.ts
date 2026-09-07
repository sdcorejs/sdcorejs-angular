import { Component } from '@angular/core';
import { SdButton } from '@sdcorejs/angular/components/button';
import { SdDateRange } from '@sdcorejs/angular/forms/date-range';
import { SdTable, SdTableOption, SdTableRowMobileDefDirective } from '@sdcorejs/angular/components/table';
import { EMPTY_STR } from '@sdcorejs/utils/constants';
import { Utilities } from '@sdcorejs/utils/fns';
import type { Color } from '@sdcorejs/utils/models';

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
