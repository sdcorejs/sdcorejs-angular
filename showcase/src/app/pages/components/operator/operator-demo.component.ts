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

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-kich-thuoc') {
      <demo-section
        heading="Kích thước"
        [props]="[{ name: 'size', value: 'xs | sm | md' }, { name: 'active', value: 'true' }]"
        note="md: chip 28px (mặc định). sm: chip 24px cho filter bảng. xs: glyph 14px có vùng bấm 24px, dùng trong chip. Cột 2 có active (điều kiện đang có giá trị), cột 3 chưa chọn operator.">
        <div class="size-grid">
          <span class="row-label">md</span>
          <sd-operator [(model)]="numberOp" [operators]="numberOps" />
          <sd-operator [(model)]="numberOp" [operators]="numberOps" active />
          <sd-operator [operators]="numberOps" />
          <span class="row-label">sm</span>
          <sd-operator size="sm" [(model)]="numberOp" [operators]="numberOps" />
          <sd-operator size="sm" [(model)]="numberOp" [operators]="numberOps" active />
          <sd-operator size="sm" [operators]="numberOps" />
          <span class="row-label">xs</span>
          <sd-operator size="xs" [(model)]="numberOp" [operators]="numberOps" />
          <sd-operator size="xs" [(model)]="numberOp" [operators]="numberOps" active />
          <sd-operator size="xs" [operators]="numberOps" />
        </div>
      </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-chi-xem') {
      <demo-section
        heading="Chỉ xem"
        [props]="[{ name: 'readonly', value: 'true' }]"
        note="Glyph có tên và tooltip, không mở menu, không nhận Tab — cho chip điều kiện đã xong (query-bar). Màu theo chip chứa nó. disabled thắng readonly.">
        <span class="demo-chip">Email <sd-operator size="xs" readonly [operators]="stringOps" model="CONTAIN" /> nguyen</span>
        <span class="demo-chip">Lương <sd-operator size="xs" readonly [operators]="numberOps" model="GREATER_OR_EQUAL" /> 10.000.000</span>
        <span class="row-label">readonly + disabled</span>
        <sd-operator size="sm" readonly disabled [operators]="stringOps" model="CONTAIN" />
      </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-hien-ma-va-du-17-toan-tu') {
      <demo-section
        heading="Hiện mã và đủ 17 toán tử"
        [props]="[{ name: 'showCode', value: 'true' }]"
        note="Mã operator nằm cùng dòng với nhãn — cho màn kỹ thuật cần biết giá trị gửi lên API. Danh sách trên 4 mục có đường chia giữa các họ (so sánh, văn bản, danh sách, khoảng, trống); thứ tự giữ đúng như truyền vào.">
        <span class="row-label">Điều kiện</span>
        <sd-operator showCode [(model)]="allOp" [operators]="allOps" />
        <span class="row-value">{{ allOp() ?? '—' }}</span>
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
    .size-grid {
      display: grid;
      grid-template-columns: 40px repeat(3, max-content);
      align-items: center;
      gap: 12px 24px;
    }
    .demo-chip {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      height: 28px;
      padding: 0 12px;
      border-radius: 14px;
      background: var(--sd-primary-light);
      color: var(--sd-primary-dark);
      font-size: 13px;
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

  readonly allOps: Operator[] = [
    'EQUAL', 'NOT_EQUAL', 'GREATER_THAN', 'LESS_THAN', 'GREATER_OR_EQUAL', 'LESS_OR_EQUAL',
    'CONTAIN', 'NOT_CONTAIN', 'START_WITH', 'NOT_START_WITH', 'END_WITH', 'NOT_END_WITH',
    'IN', 'NOT_IN', 'BETWEEN', 'NULL', 'NOT_NULL',
  ];
  readonly allOp = signal<Operator | undefined>('START_WITH');

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
