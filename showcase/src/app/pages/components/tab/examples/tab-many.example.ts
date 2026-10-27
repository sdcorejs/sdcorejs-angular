import { ChangeDetectionStrategy, Component } from '@angular/core';
import { SdSection, SdSectionItem } from '@sdcorejs/angular/components/section';
import { SdTab, SdTabGroup } from '@sdcorejs/angular/components/tab';

@Component({
  selector: 'app-tab-many-example',
  standalone: true,
  imports: [SdSection, SdSectionItem, SdTab, SdTabGroup],
  templateUrl: './tab-many.example.html',
  styleUrl: './tab-pattern-example.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TabManyExampleComponent {
  // Ten groups with long labels: the header scrolls instead of squeezing every label into one row.
  readonly tabs = [
    { label: 'Tổng quan', icon: 'dashboard' },
    { label: 'Thông tin liên hệ', icon: 'contacts' },
    { label: 'Đơn hàng', icon: 'receipt_long' },
    { label: 'Hợp đồng', icon: 'description' },
    { label: 'Địa chỉ giao hàng', icon: 'location_on' },
    { label: 'Công nợ', icon: 'account_balance' },
    { label: 'Thanh toán', icon: 'payments' },
    { label: 'Tài liệu', icon: 'folder' },
    { label: 'Lịch sử', icon: 'history' },
    { label: 'Cấu hình', icon: 'settings' },
  ];
}
