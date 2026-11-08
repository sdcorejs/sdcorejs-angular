import { ChangeDetectionStrategy, Component } from '@angular/core';
import { SdCard, type SdCardShortcutData } from '@sdcorejs/angular/components/card';

@Component({
  selector: 'app-card-shortcut-example',
  standalone: true,
  imports: [SdCard],
  templateUrl: './card-shortcut.example.html',
  styleUrl: './card-example.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CardShortcutExampleComponent {
  readonly shortcuts: readonly { readonly key: string; readonly data: SdCardShortcutData }[] = [
    { key: 'order', data: { icon: 'add_shopping_cart', label: 'Tạo đơn hàng', description: 'Đơn bán lẻ hoặc đại lý' } },
    { key: 'import', data: { icon: 'upload_file', label: 'Nhập sản phẩm', description: 'Từ tệp Excel' } },
    { key: 'roles', data: { icon: 'admin_panel_settings', label: 'Vai trò và quyền', description: '3 vai trò' } },
  ];
  readonly compactShortcuts: readonly { readonly key: string; readonly data: SdCardShortcutData }[] = [
    { key: 'order', data: { icon: 'add_shopping_cart', label: 'Tạo đơn hàng' } },
    { key: 'customer', data: { icon: 'person_add', label: 'Tạo khách hàng' } },
    { key: 'import', data: { icon: 'upload_file', label: 'Nhập sản phẩm' } },
  ];
}
