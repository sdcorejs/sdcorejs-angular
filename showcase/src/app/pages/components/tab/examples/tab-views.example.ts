import { ChangeDetectionStrategy, Component } from '@angular/core';
import { SdSection, SdSectionItem } from '@sdcorejs/angular/components/section';
import { SdTab, SdTabGroup } from '@sdcorejs/angular/components/tab';
import { SdTable, SdTableOption } from '@sdcorejs/angular/components/table';

interface Order {
  id: number;
  code: string;
  name: string;
  region: string;
}

const CUSTOMERS = ['An Phát', 'Minh Long', 'Bình Minh', 'Đại Việt', 'Hải Nam', 'Phú Gia'];
const REGIONS = ['Miền Bắc', 'Miền Trung', 'Miền Nam'];

@Component({
  selector: 'app-tab-views-example',
  standalone: true,
  imports: [SdSection, SdSectionItem, SdTab, SdTabGroup, SdTable],
  templateUrl: './tab-views.example.html',
  styleUrl: './tab-pattern-example.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TabViewsExampleComponent {
  // One data source for both views: switching only changes how it is shown.
  readonly orders: Order[] = Array.from({ length: 6 }, (_, index) => ({
    id: 2400 - index,
    code: `ĐH-${2400 - index}`,
    name: CUSTOMERS[index % CUSTOMERS.length],
    region: REGIONS[index % REGIONS.length],
  }));
  readonly option: SdTableOption<Order> = {
    type: 'local',
    items: () => this.orders,
    rowKey: 'id',
    paginate: { hidden: true, pageSize: 20 },
    filter: { hideInlineFilter: true },
    columns: [
      { field: 'code', title: 'Mã đơn', type: 'string', width: '120px' },
      { field: 'name', title: 'Khách hàng', type: 'string', width: '200px' },
      { field: 'region', title: 'Khu vực', type: 'string', width: '140px' },
    ],
  };
}
