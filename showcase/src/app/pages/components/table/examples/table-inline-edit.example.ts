import { ChangeDetectionStrategy, Component, computed, signal, viewChild } from '@angular/core';
import { SdButton } from '@sdcorejs/angular/components/button';
import { SdInform } from '@sdcorejs/angular/components/inform';
import { SdTable, SdTableCellDefDirective, SdTableCommandHeaderDefDirective, SdTableOption } from '@sdcorejs/angular/components/table';
import { SdInput } from '@sdcorejs/angular/forms/input';
import { SdInputNumber } from '@sdcorejs/angular/forms/input-number';
import { SdFormatNumberPipe } from '@sdcorejs/angular/pipes';

interface OrderLine {
  id: number;
  name: string;
  quantity: number | null;
  price: number | null;
  /** Shown by the cell template from quantity × price; declared so the column has a field. */
  amount?: number;
}

@Component({
  selector: 'app-table-inline-edit-example',
  standalone: true,
  imports: [
    SdButton,
    SdInform,
    SdTable,
    SdTableCellDefDirective,
    SdTableCommandHeaderDefDirective,
    SdInput,
    SdInputNumber,
    SdFormatNumberPipe,
  ],
  templateUrl: './table-inline-edit.example.html',
  styleUrl: './table-pattern-example.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TableInlineEditExampleComponent {
  readonly table = viewChild.required(SdTable<OrderLine>);
  readonly lines = signal<OrderLine[]>([
    { id: 1, name: 'Máy in', quantity: 2, price: 3_000_000 },
    { id: 2, name: 'Màn hình', quantity: 1, price: 2_500_000 },
  ]);
  readonly saving = signal(false);
  readonly saved = signal('');
  // Inputs write straight into the row objects; this counter tells the total to recompute.
  readonly revision = signal(0);
  readonly total = computed(() => {
    this.revision();
    return this.lines().reduce((sum, line) => sum + this.amount(line), 0);
  });
  #nextId = 3;

  readonly option: SdTableOption<OrderLine> = {
    type: 'local',
    items: () => this.lines(),
    rowKey: 'id',
    selector: { visible: false },
    filter: { disabled: true },
    paginate: { hidden: true, pageSize: 100 },
    columns: [
      { field: 'name', title: 'Sản phẩm', type: 'string', width: '260px' },
      { field: 'quantity', title: 'Số lượng', type: 'number', width: '140px' },
      { field: 'price', title: 'Đơn giá (VND)', type: 'number', width: '180px' },
      { field: 'amount', title: 'Thành tiền (VND)', type: 'number', align: 'right', width: '160px' },
    ],
    command: {
      commands: [{ title: 'Xoá dòng', icon: 'delete', color: 'error', disabled: () => this.saving(), click: line => this.remove(line.id) }],
    },
  };

  amount(line: OrderLine): number {
    return (line.quantity ?? 0) * (line.price ?? 0);
  }

  changed(): void {
    this.revision.update(value => value + 1);
    this.saved.set('');
  }

  async add(): Promise<void> {
    this.lines.update(lines => [...lines, { id: this.#nextId++, name: '', quantity: 1, price: 0 }]);
    this.changed();
    await this.table().reload(true);
  }

  async remove(id: number): Promise<void> {
    this.lines.update(lines => lines.filter(line => line.id !== id));
    this.changed();
    await this.table().reload(true);
  }

  async save(): Promise<void> {
    if (this.saving()) return;
    this.saving.set(true);
    await new Promise(resolve => setTimeout(resolve, 600));
    this.saving.set(false);
    this.saved.set(`Đã lưu ${this.lines().length} dòng hàng trong một lần lưu.`);
  }
}
