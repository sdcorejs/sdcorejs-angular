import { booleanAttribute, ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { MatTooltipModule } from '@angular/material/tooltip';
import { SdIcon } from '@sdcorejs/angular/modules/icon';

let nextId = 0;

/**
 * Khung XEM của một cấu hình dựng bằng popup (điều kiện, truy vấn, gán giá trị…) trong inspector.
 *
 * why: các cấu hình này dài và có cấu trúc, sửa inline trong panel hẹp là không đọc được. Khung
 * xám chỉ hiển thị (cắt ở 3 dòng, di chuột xem đủ qua tooltip); sửa luôn đi qua nút mở popup, và
 * nút đó biến mất khi `readonly` — cùng một khung dùng được cho người chỉ có quyền xem.
 */
@Component({
  selector: 'fb-value-box',
  templateUrl: './value-box.component.html',
  styleUrl: './value-box.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatTooltipModule, SdIcon],
})
export class ValueBoxComponent {
  /** Nhãn rời phía trên khung (cũng là tên truy cập của khung và của nút sửa). */
  readonly label = input<string | undefined>(undefined);
  /** Toàn văn nội dung cho tooltip. Rỗng = không có tooltip (vd chưa cấu hình). */
  readonly tooltip = input<string | undefined>(undefined);
  /** Chưa có giá trị — nội dung chiếu vào được hiển thị như placeholder. */
  readonly empty = input(false, { transform: booleanAttribute });
  /** Không có quyền sửa: ẩn nút mở popup. */
  readonly readonly = input(false, { transform: booleanAttribute });
  /** Tên truy cập (và tooltip) của nút sửa. */
  readonly editLabel = input<string>('');

  readonly edit = output<void>();

  readonly labelId = `fb-value-box-${++nextId}`;
}
