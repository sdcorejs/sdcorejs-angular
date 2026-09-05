import { DecimalPipe } from '@angular/common';
import { Component, signal } from '@angular/core';
import {
  SdTable,
  SdTableOption,
  SdTableRowMobileDefDirective,
} from '@sdcorejs/angular/components/table';

interface Order {
  id: string;
  customerName: string;
  total: number | null;
  locked: boolean;
}

@Component({
  selector: 'app-orders',
  standalone: true,
  imports: [DecimalPipe, SdTable, SdTableRowMobileDefDirective],
  template: `
    <sd-table autoId="orders" [option]="tableOption">
      <ng-template
        [sdTableRowMobileDef]="tableOption"
        let-row="item"
        let-index="index"
        let-selected="selected"
        let-selectionDisabled="selectionDisabled"
        let-autoId="autoId">
        <strong>{{ row.id }} · {{ row.customerName }}</strong>
        <p>{{ row.total == null ? '—' : (row.total | number) }} ₫</p>
        <small>{{ index + 1 }} · {{ selected ? 'Đã chọn' : 'Chưa chọn' }}</small>
        @if (selectionDisabled) { <p>Không thể chọn đơn này</p> }
        <button type="button" (click)="message.set('Ghi chú: ' + row.id)">Ghi chú</button>
      </ng-template>
    </sd-table>
    <p role="status">{{ message() }}</p>
  `,
})
export class OrdersComponent {
  readonly message = signal('');
  readonly orders: Order[] = [
    { id: 'DH-001', customerName: 'An', total: 250000, locked: false },
    { id: 'DH-002', customerName: 'Bình', total: null, locked: true },
  ];
  readonly tableOption: SdTableOption<Order> = {
    type: 'local',
    rowKey: 'id',
    items: () => this.orders,
    mobile: { rowLabel: row => `${row.id} · ${row.customerName}` },
    columns: [
      { field: 'id', type: 'string', title: 'Mã đơn', sortable: true },
      { field: 'customerName', type: 'string', title: 'Khách hàng' },
      { field: 'total', type: 'number', title: 'Tổng tiền' },
    ],
    sort: { enable: true },
    paginate: { pageSize: 10 },
    selector: {
      visible: true,
      preserveSelection: true,
      disabled: row => !!row?.locked,
      actions: [{ title: 'Xử lý', click: (rows = []) => this.process(rows) }],
    },
    command: {
      commands: [{ title: 'Xem', click: row => this.message.set(`Xem ${row.id}`) }],
    },
  };

  async process(rows: Order[]): Promise<void> {
    // Replace this demonstration with the application's request and outcome handling.
    await new Promise<void>(resolve => setTimeout(resolve, 300));
    this.message.set(`Đã xử lý: ${rows.map(row => row.id).join(', ')}`);
  }
}
