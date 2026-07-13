import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { DemoPageComponent, DemoSectionComponent } from '../../../shared/demo-page.component';
import { SdOperator } from '@sdcorejs/angular/components/operator';
import type { Operator } from '@sdcorejs/angular/utilities/models';

@Component({
  selector: 'app-operator-demo',
  standalone: true,
  imports: [DemoPageComponent, DemoSectionComponent, SdOperator],
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
    </demo-page>
  `,
  styles: [`
    .row-label {
      font-size: 13px;
      color: #4a4a4a;
      min-width: 96px;
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
}
