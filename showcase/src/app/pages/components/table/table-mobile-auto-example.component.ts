import { ChangeDetectionStrategy, Component } from '@angular/core';
import { SD_TABLE_CONFIGURATION, SdTable, SdTableOption } from '@sdcorejs/angular/components/table';

interface Product {
  sku: string;
  name: string;
  category: string;
  stock: number;
  price: number;
  updatedAt: string;
}

const PRODUCTS: Product[] = [
  { sku: 'SP-01', name: 'Bàn phím cơ', category: 'Phụ kiện', stock: 42, price: 1250000, updatedAt: '2026/10/12' },
  { sku: 'SP-02', name: 'Chuột không dây', category: 'Phụ kiện', stock: 8, price: 390000, updatedAt: '2026/10/20' },
  { sku: 'SP-03', name: 'Màn hình 27"', category: 'Thiết bị', stock: 5, price: 6490000, updatedAt: '2026/10/03' },
  { sku: 'SP-04', name: 'Tai nghe', category: 'Âm thanh', stock: 17, price: 890000, updatedAt: '2026/10/28' },
];

/**
 * `SD_TABLE_CONFIGURATION.mobile.autoTemplate`: a table without a card body gets cards derived from its visible
 * columns. The table sorts but has no filter, so the sort button sits in the top row.
 */
@Component({
  selector: 'app-table-mobile-auto-demo',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SdTable],
  providers: [{ provide: SD_TABLE_CONFIGURATION, useValue: { mobile: { autoTemplate: true } } }],
  templateUrl: './table-mobile-auto-example.component.html',
})
export class TableMobileAutoDemoComponent {
  readonly option: SdTableOption<Product> = {
    type: 'local',
    rowKey: 'sku',
    items: () => PRODUCTS,
    sort: { enable: true },
    reload: { visible: true },
    filter: { disabled: true },
    columns: [
      { field: 'sku', type: 'string', title: 'Mã', sortable: true },
      { field: 'name', type: 'string', title: 'Sản phẩm', sortable: true },
      { field: 'category', type: 'string', title: 'Nhóm', sortable: true },
      { field: 'stock', type: 'number', title: 'Tồn kho', sortable: true },
      { field: 'price', type: 'number', title: 'Giá bán', sortable: true },
      { field: 'updatedAt', type: 'date', title: 'Cập nhật', sortable: true },
    ],
  };
}
