import { ChangeDetectionStrategy, Component } from '@angular/core';
import { SdSection, SdSectionItem } from '@sdcorejs/angular/components/section';
import { SdTab, SdTabGroup } from '@sdcorejs/angular/components/tab';
import { SdTable, SdTableOption } from '@sdcorejs/angular/components/table';

interface Order {
  id: number;
  code: string;
  createdAt: string;
  amount: number;
}

@Component({
  selector: 'app-tab-mixed-example',
  standalone: true,
  imports: [SdSection, SdSectionItem, SdTab, SdTabGroup, SdTable],
  templateUrl: './tab-mixed.example.html',
  styleUrl: './tab-pattern-example.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TabMixedExampleComponent {
  // Each tab takes the shape of its content: facts, a table, then a timeline.
  readonly orders: Order[] = [
    { id: 2400, code: 'ĐH-2400', createdAt: '12/09/2026', amount: 12_500_000 },
    { id: 2391, code: 'ĐH-2391', createdAt: '28/08/2026', amount: 4_200_000 },
    { id: 2377, code: 'ĐH-2377', createdAt: '03/08/2026', amount: 9_750_000 },
  ];
  readonly ordersOption: SdTableOption<Order> = {
    type: 'local',
    items: () => this.orders,
    rowKey: 'id',
    paginate: { hidden: true, pageSize: 20 },
    filter: { hideInlineFilter: true },
    columns: [
      { field: 'code', title: 'Mã đơn', type: 'string', width: '120px' },
      { field: 'createdAt', title: 'Ngày tạo', type: 'string', width: '140px' },
      { field: 'amount', title: 'Giá trị (VND)', type: 'number', align: 'right', width: '160px' },
    ],
  };
  readonly history = [
    { time: '15/09/2026 09:12', text: 'Nguyễn An cập nhật hồ sơ khách hàng' },
    { time: '12/09/2026 14:30', text: 'Tạo đơn hàng ĐH-2400' },
    { time: '01/09/2026 08:05', text: 'Chuyển khách hàng sang nhóm doanh nghiệp' },
  ];
}
