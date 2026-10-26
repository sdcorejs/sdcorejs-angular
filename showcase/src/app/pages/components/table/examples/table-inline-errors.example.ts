import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { SdButton } from '@sdcorejs/angular/components/button';
import { SdInform } from '@sdcorejs/angular/components/inform';
import { SdTable, SdTableCellDefDirective, SdTableOption, SdTableTitleDefDirective } from '@sdcorejs/angular/components/table';
import { SdInput } from '@sdcorejs/angular/forms/input';
import { SdInputNumber } from '@sdcorejs/angular/forms/input-number';

interface OrderLine {
  id: number;
  name: string;
  quantity: number | null;
  price: number | null;
}

type LineField = 'name' | 'quantity' | 'price';
type LineErrors = Partial<Record<LineField, string>>;

const normalize = (value: string): string => value.trim().toLowerCase();

@Component({
  selector: 'app-table-inline-errors-example',
  standalone: true,
  imports: [SdButton, SdInform, SdTable, SdTableCellDefDirective, SdTableTitleDefDirective, SdInput, SdInputNumber],
  templateUrl: './table-inline-errors.example.html',
  styleUrl: './table-pattern-example.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TableInlineErrorsExampleComponent {
  // Starts invalid on purpose: quantity 0 on line 1 and no product on line 2.
  readonly lines: OrderLine[] = [
    { id: 1, name: 'Máy in', quantity: 0, price: 3_000_000 },
    { id: 2, name: '', quantity: 1, price: 2_500_000 },
    { id: 3, name: 'Màn hình', quantity: 2, price: 2_500_000 },
  ];
  readonly saving = signal(false);
  readonly errors = signal<Record<number, LineErrors | undefined>>({});
  readonly inform = signal<{ color: 'warning' | 'error' | 'success'; title: string; description: string } | null>(null);

  readonly option: SdTableOption<OrderLine> = {
    type: 'local',
    items: () => this.lines,
    rowKey: 'id',
    selector: { visible: false },
    filter: { disabled: true },
    paginate: { hidden: true, pageSize: 100 },
    columns: [
      { field: 'id', title: 'Dòng', type: 'number', width: '70px' },
      { field: 'name', title: 'Sản phẩm', type: 'string', width: '260px' },
      { field: 'quantity', title: 'Số lượng', type: 'number', width: '150px' },
      { field: 'price', title: 'Đơn giá (VND)', type: 'number', width: '180px' },
    ],
  };

  /** Editing a line clears its errors; the next save validates again. */
  clearErrors(id: number): void {
    this.errors.update(errors => {
      const next = { ...errors };
      delete next[id];
      return next;
    });
  }

  async save(): Promise<void> {
    if (this.saving()) return;
    this.inform.set(null);

    // Front-end validation: warning, and every invalid cell carries its message in a tooltip.
    const errors: Record<number, LineErrors> = {};
    for (const line of this.lines) {
      const lineErrors: LineErrors = {};
      if (!line.name.trim()) lineErrors.name = 'Nhập sản phẩm.';
      if (!Number.isInteger(line.quantity) || (line.quantity ?? 0) < 1) lineErrors.quantity = 'Số lượng phải là số nguyên lớn hơn 0.';
      if (line.price === null || line.price < 0) lineErrors.price = 'Đơn giá phải từ 0 trở lên.';
      if (Object.keys(lineErrors).length) errors[line.id] = lineErrors;
    }
    this.errors.set(errors);
    if (Object.keys(errors).length) {
      this.inform.set({
        color: 'warning',
        title: 'Kiểm tra dòng hàng',
        description: `Dòng ${Object.keys(errors).join(', ')} chưa hợp lệ. Di chuột vào ô lỗi để xem chi tiết.`,
      });
      return;
    }

    this.saving.set(true);
    await new Promise(resolve => setTimeout(resolve, 600));
    this.saving.set(false);

    // Sample back end: a product may appear only once per order. The input is kept for fixing.
    const duplicates = this.lines.filter(line =>
      this.lines.some(other => other !== line && normalize(other.name) === normalize(line.name))
    );
    if (duplicates.length) {
      this.errors.set(Object.fromEntries(duplicates.map(line => [line.id, { name: 'Sản phẩm đã có ở dòng khác.' }])));
      this.inform.set({
        color: 'error',
        title: 'Không thể lưu',
        description: `Sản phẩm bị trùng tại dòng ${duplicates.map(line => line.id).join(', ')}. Sửa sản phẩm hoặc xoá dòng trùng.`,
      });
      return;
    }
    this.inform.set({ color: 'success', title: 'Lưu thành công', description: `Đã lưu ${this.lines.length} dòng hàng.` });
  }
}
