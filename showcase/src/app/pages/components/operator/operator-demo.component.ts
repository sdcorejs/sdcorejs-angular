import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { DemoPageComponent, DemoSectionComponent } from '../../../shared/demo-page.component';
import { SdOperator } from '@sdcorejs/angular/components/operator';
import { SdDate } from '@sdcorejs/angular/forms/date';
import { SdDateRange } from '@sdcorejs/angular/forms/date-range';
import { SdInput } from '@sdcorejs/angular/forms/input';
import { SdInputNumber } from '@sdcorejs/angular/forms/input-number';
import { SdSelect } from '@sdcorejs/angular/forms/select';
import type { Operator } from '@sdcorejs/utils/models';

@Component({
  selector: 'app-operator-demo',
  standalone: true,
  imports: [DemoPageComponent, DemoSectionComponent, SdOperator, SdInput, SdInputNumber, SdSelect, SdDate, SdDateRange],
  template: `
    <demo-page #demoPage
      title="Operator"
      description="Nút chọn toán tử so sánh (=, ≠, chứa, lớn hơn, có giá trị, …) — dạng icon nhỏ, mở menu khi click. Thường dùng kèm các bộ lọc nâng cao.">

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-toan-tu-chuoi') {
      <demo-section heading="Toán tử chuỗi" [props]="[{ name: 'operators', value: 'string' }]">
        <span class="row-label">Họ tên</span>
        <sd-operator [(model)]="stringOp" [operators]="stringOps"></sd-operator>
        <span class="row-value">{{ stringOp() ?? '—' }}</span>
      </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-toan-tu-so') {
      <demo-section heading="Toán tử số" [props]="[{ name: 'operators', value: 'number' }]">
        <span class="row-label">Lương</span>
        <sd-operator [(model)]="numberOp" [operators]="numberOps"></sd-operator>
        <span class="row-value">{{ numberOp() ?? '—' }}</span>
      </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-toan-tu-ngay') {
      <demo-section heading="Toán tử ngày" [props]="[{ name: 'operators', value: 'date' }]">
        <span class="row-label">Ngày tạo</span>
        <sd-operator [(model)]="dateOp" [operators]="dateOps"></sd-operator>
        <span class="row-value">{{ dateOp() ?? '—' }}</span>
      </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-vo-hieu-hoa') {
      <demo-section heading="Vô hiệu hoá" [props]="[{ name: 'disabled', value: 'true' }]">
        <span class="row-label">disabled</span>
        <sd-operator [(model)]="stringOp" [operators]="stringOps" [disabled]="true"></sd-operator>
      </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-trong-control') {
      <demo-section
        heading="Trong control"
        [props]="[
          { name: 'operators', value: 'Operator[] (≥ 2 thì hiện chip)' },
          { name: '[(operator)]', value: 'Operator' },
          { name: 'size', value: 'sm / md' },
        ]"
        note="sd-input, sd-input-number, sd-select, sd-date, sd-date-range nhận [operators] / [(operator)] và vẽ operator thành chip tiền tố trong ô. Tab vào chip trước ô nhập; Enter, Space hoặc Alt+↓ mở menu; chọn xong focus về ô nhập.">
        <div class="control-grid">
          <sd-input label="Họ tên" clearable [operators]="stringOps" [(operator)]="nameOp" [(model)]="name" />
          <sd-input-number label="Lương" [operators]="numberOps" [(operator)]="salaryOp" [(model)]="salary" />
          <sd-select
            label="Trạng thái"
            [items]="statuses"
            valueField="value"
            displayField="label"
            [operators]="listOps"
            [(operator)]="statusOp"
            [(model)]="status" />
          <sd-date label="Ngày tạo" [operators]="dateOps" [(operator)]="createdOp" />
          <sd-date-range label="Khoảng ngày" [operators]="rangeOps" [(operator)]="rangeOp" />
          <sd-input size="sm" label="Cỡ sm" [operators]="stringOps" [(operator)]="smallOp" />
        </div>
        <span class="row-value">{{ nameOp() }} · {{ salaryOp() }} · {{ statusOp() }} · {{ createdOp() }} · {{ rangeOp() }}</span>
      </demo-section>
      }
    </demo-page>
  `,
  styles: [`
    .row-label {
      font-size: 13px;
      color: #4a4a4a;
      min-width: 96px;
    }
    .control-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
      gap: 12px 16px;
      width: 100%;
    }
    .row-value {
      font-size: 13px;
      font-weight: 500;
      color: var(--sd-primary, #005cbb);
      font-family: monospace;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OperatorDemoComponent {
  readonly stringOps: Operator[] = ['EQUAL', 'NOT_EQUAL', 'CONTAIN', 'NOT_CONTAIN', 'START_WITH', 'END_WITH', 'NULL', 'NOT_NULL'];
  readonly numberOps: Operator[] = ['EQUAL', 'NOT_EQUAL', 'GREATER_THAN', 'LESS_THAN', 'GREATER_OR_EQUAL', 'LESS_OR_EQUAL', 'NULL', 'NOT_NULL'];
  readonly dateOps: Operator[] = ['EQUAL', 'NOT_EQUAL', 'GREATER_THAN', 'LESS_THAN', 'BETWEEN', 'NULL', 'NOT_NULL'];

  readonly stringOp = signal<Operator | undefined>('CONTAIN');
  readonly numberOp = signal<Operator | undefined>('GREATER_OR_EQUAL');
  readonly dateOp = signal<Operator | undefined>('BETWEEN');

  readonly listOps: Operator[] = ['IN', 'NOT_IN'];
  readonly rangeOps: Operator[] = ['BETWEEN', 'NULL', 'NOT_NULL'];
  readonly statuses = [
    { value: 'open', label: 'Đang mở' },
    { value: 'done', label: 'Hoàn tất' },
  ];
  readonly nameOp = signal<Operator | undefined>('CONTAIN');
  readonly salaryOp = signal<Operator | undefined>('GREATER_OR_EQUAL');
  readonly statusOp = signal<Operator | undefined>('IN');
  readonly createdOp = signal<Operator | undefined>('EQUAL');
  readonly rangeOp = signal<Operator | undefined>('BETWEEN');
  readonly smallOp = signal<Operator | undefined>('EQUAL');
  readonly name = signal<string | null>('Nguyễn');
  readonly salary = signal<number | null>(null);
  readonly status = signal<string | null>('open');
}
