import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { DemoPageComponent, DemoSectionComponent } from '../../../shared/demo-page.component';
import { SdQueryBuilder, SdQueryBuilderField } from '@sdcorejs/angular/components/query-builder';
import { SdCodeEditor } from '@sdcorejs/angular/components/code-editor';
import { Filter } from '@sdcorejs/utils/models';

@Component({
  selector: 'app-query-builder-demo',
  standalone: true,
  imports: [DemoPageComponent, DemoSectionComponent, SdQueryBuilder, SdCodeEditor],
  template: `
    <demo-page #demoPage
      title="Query Builder"
      description="Bộ dựng truy vấn dạng cây — gom các điều kiện 'trường - toán tử - giá trị' theo nhóm AND/OR lồng nhau. Toán tử suy ra theo type của trường; output là Filter của @sdcorejs/utils (cây FilterAndOr lồng), giống query-bar. Các panel JSON bên dưới dùng <sd-code-editor language='json' viewed> để xem Filter realtime.">

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-edit-view') {
      <demo-section heading="Edit / View" [props]="[{ name: 'fields', value: 'SdQueryBuilderField[]' }, { name: 'value', value: 'Filter | null' }, { name: 'mode', value: 'edit | view' }]">
        <div class="qb-demo-toolbar">
          <button type="button" class="qb-demo-btn" [class.active]="mode() === 'edit'" (click)="mode.set('edit')">Edit</button>
          <button type="button" class="qb-demo-btn" [class.active]="mode() === 'view'" (click)="mode.set('view')">View</button>
        </div>

        <div class="builder-box">
          <sd-query-builder [fields]="fields" [mode]="mode()" [(value)]="value"></sd-query-builder>
        </div>

        <div class="qb-demo-out">
          <strong>Filter</strong>
          <sd-code-editor language="json" [model]="value()" viewed maxHeight="280px"></sd-code-editor>
        </div>
      </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-moi-loai-truong-value-editor-theo-type') {
      <demo-section
        heading="Mọi loại trường (value editor theo type)"
        note="Mỗi type render một value editor riêng: string → ô text, number → ô số (+ BETWEEN hai đầu), boolean → select Có/Không, values → multi-select, date → date picker, datetime → datetime picker."
        [props]="[{ name: 'type', value: 'string / number / boolean / values / date / datetime' }]">
        <div class="builder-box">
          <sd-query-builder [fields]="fields" [(value)]="allTypesValue"></sd-query-builder>
        </div>
        <div class="qb-demo-out">
          <strong>Filter</strong>
          <sd-code-editor language="json" [model]="allTypesValue()" viewed maxHeight="320px"></sd-code-editor>
        </div>
      </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-ngay-tuong-doi') {
      <demo-section
        heading="Ngày tương đối"
        note="Với date/datetime + toán tử đơn (=, !=, >, <), chọn 'Hôm nay' hoặc 'Tương đối' (N ngày/tuần/tháng trước·tới). Emit ra Filter.data dạng { rel, unit, amount, direction }. BETWEEN không có chế độ tương đối."
        [props]="[{ name: 'fields', value: 'date | datetime' }, { name: 'value', value: '{ rel, unit, amount, direction }' }]">
        <div class="builder-box">
          <sd-query-builder [fields]="fields" [(value)]="relativeValue"></sd-query-builder>
        </div>
        <div class="qb-demo-out">
          <strong>Filter</strong>
          <sd-code-editor language="json" [model]="relativeValue()" viewed maxHeight="280px"></sd-code-editor>
        </div>
      </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-so-sanh-giua-cac-truong') {
      <demo-section
        heading="So sánh giữa các trường"
        note="Bật comparisonMode='value-or-field' để mỗi rule có thể chọn nhập giá trị hoặc so sánh với một field khác cùng type. Field bên phải emit ra Filter dạng { dataType: 'field', data: '<fieldKey>' }."
        [props]="[{ name: 'comparisonMode', value: 'value-or-field' }, { name: 'dataType', value: 'field' }]">
        <div class="builder-box">
          <sd-query-builder [fields]="fields" comparisonMode="value-or-field" [(value)]="fieldComparisonValue"></sd-query-builder>
        </div>
        <div class="qb-demo-preview">
          <strong>View</strong>
          <sd-query-builder [fields]="fields" [value]="fieldComparisonValue()" mode="view"></sd-query-builder>
        </div>
        <div class="qb-demo-out">
          <strong>Filter</strong>
          <sd-code-editor language="json" [model]="fieldComparisonValue()" viewed maxHeight="280px"></sd-code-editor>
        </div>
      </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-nhom-and-or-long-nhau') {
      <demo-section
        heading="Nhóm AND/OR lồng nhau"
        note="Bấm + → Nhóm để tạo nhóm con. Nhóm con nhiều điều kiện được bọc ngoặc ( … ) khi xem ở chế độ View."
        [props]="[{ name: 'operator', value: 'AND / OR' }, { name: 'mode', value: 'edit | view' }]">
        <div class="qb-demo-toolbar">
          <button type="button" class="qb-demo-btn" [class.active]="nestedMode() === 'edit'" (click)="nestedMode.set('edit')">Edit</button>
          <button type="button" class="qb-demo-btn" [class.active]="nestedMode() === 'view'" (click)="nestedMode.set('view')">View</button>
        </div>
        <div class="builder-box">
          <sd-query-builder [fields]="fields" [mode]="nestedMode()" [(value)]="nestedValue"></sd-query-builder>
        </div>
        <div class="qb-demo-out">
          <strong>Filter</strong>
          <sd-code-editor language="json" [model]="nestedValue()" viewed maxHeight="320px"></sd-code-editor>
        </div>
      </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-bat-dau-trong-dung-tu-dau') {
      <demo-section
        heading="Bắt đầu trống (dựng từ đầu)"
        note="value khởi tạo null. Bấm + → Điều kiện để thêm rule đầu tiên; chọn trường để hiện toán tử + value editor. Panel JSON cập nhật realtime."
        [props]="[{ name: 'value', value: 'null' }]">
        <div class="builder-box">
          <sd-query-builder [fields]="fields" [(value)]="emptyValue"></sd-query-builder>
        </div>
        <div class="qb-demo-out">
          <strong>Filter</strong>
          <sd-code-editor language="json" [model]="emptyValue()" viewed maxHeight="240px"></sd-code-editor>
        </div>
      </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-disabled') {
      <demo-section heading="Disabled" [props]="[{ name: 'disabled', value: 'true' }]">
        <div class="builder-box">
          <sd-query-builder [fields]="fields" [value]="seeded" disabled></sd-query-builder>
        </div>
      </demo-section>
      }
    </demo-page>
  `,
  styles: [`
    .builder-box { width: 100%; }
    .qb-demo-toolbar { display: flex; gap: 8px; margin-bottom: 12px; }
    .qb-demo-btn {
      border: 1px solid var(--sd-primary, #2a66f4); background: #fff; color: var(--sd-primary, #2a66f4);
      border-radius: 4px; padding: 4px 14px; cursor: pointer; font-size: 13px;
    }
    .qb-demo-btn.active { background: var(--sd-primary, #2a66f4); color: #fff; }
    .qb-demo-preview { margin-top: 16px; }
    .qb-demo-preview strong { display: block; margin-bottom: 6px; font-size: 13px; color: var(--sd-text-secondary, #5b6b7b); }
    .qb-demo-out { margin-top: 16px; }
    .qb-demo-out strong { display: block; margin-bottom: 6px; font-size: 13px; color: var(--sd-text-secondary, #5b6b7b); }
    .qb-demo-out sd-code-editor { display: block; }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class QueryBuilderDemoComponent {
  readonly mode = signal<'edit' | 'view'>('edit');
  readonly nestedMode = signal<'edit' | 'view'>('edit');

  readonly fields: SdQueryBuilderField[] = [
    { key: 'code', label: 'Mã', type: 'string' },
    { key: 'name', label: 'Tên', type: 'string' },
    { key: 'price', label: 'Giá bán', type: 'number', compareGroup: 'money' },
    { key: 'cost', label: 'Giá vốn', type: 'number', compareGroup: 'money' },
    { key: 'quantity', label: 'Số lượng', type: 'number', allowFieldCompare: false },
    {
      key: 'status',
      label: 'Trạng thái',
      type: 'values',
      values: [
        { value: 'ACTIVE', display: 'Đang hoạt động' },
        { value: 'PROBATION', display: 'Thử việc' },
        { value: 'INACTIVE', display: 'Ngừng' },
      ],
    },
    { key: 'active', label: 'Kích hoạt', type: 'boolean', trueLabel: 'Có', falseLabel: 'Không' },
    { key: 'createdAt', label: 'Ngày tạo', type: 'date', compareGroup: 'lifecycle' },
    { key: 'expiredAt', label: 'Ngày hết hạn', type: 'date', compareGroup: 'lifecycle' },
    { key: 'updatedAt', label: 'Cập nhật lúc', type: 'datetime' },
  ];

  /** Seed used for the edit demo + disabled demo: (Mã = 'ABC' and Tên like '%abc%') or Giá > 100. */
  readonly seeded: Filter = {
    operator: 'OR',
    data: [
      {
        operator: 'AND',
        data: [
          { field: 'code', operator: 'EQUAL', data: 'ABC' },
          { field: 'name', operator: 'CONTAIN', data: 'abc' },
        ],
      },
      { field: 'price', operator: 'GREATER_THAN', data: 100 },
    ],
  } as Filter;

  readonly value = signal<Filter | null>(this.seeded);

  /** One rule per field type so every value editor is visible at once. */
  readonly allTypesValue = signal<Filter | null>({
    operator: 'AND',
    data: [
      { field: 'name', operator: 'CONTAIN', data: 'abc' },
      { field: 'price', operator: 'BETWEEN', data: { from: 10, to: 99 } },
      { field: 'active', operator: 'EQUAL', data: true },
      { field: 'status', operator: 'IN', data: ['ACTIVE', 'PROBATION'] },
      { field: 'createdAt', operator: 'GREATER_THAN', data: '2026-01-01' },
      { field: 'updatedAt', operator: 'EQUAL', dataType: 'date-today', data: 'TODAY' },
    ],
  } as Filter);

  /** Seed for the relative-date demo: createdAt > 7 days ago, updatedAt = today. */
  readonly relativeValue = signal<Filter | null>({
    operator: 'AND',
    data: [
      { field: 'createdAt', operator: 'GREATER_THAN', dataType: 'date-relative', data: { amount: 7, direction: 'previous', unit: 'day' } },
      { field: 'updatedAt', operator: 'LESS_THAN', dataType: 'date-today', data: 'TODAY' },
    ],
  } as Filter);

  /** Seed for field comparison: Giá bán > Giá vốn and Ngày hết hạn >= Ngày tạo. */
  readonly fieldComparisonValue = signal<Filter | null>({
    operator: 'AND',
    data: [
      { field: 'price', operator: 'GREATER_THAN', dataType: 'field', data: 'cost' },
      { field: 'expiredAt', operator: 'GREATER_OR_EQUAL', dataType: 'field', data: 'createdAt' },
    ],
  } as Filter);

  /** Deep nested seed: (Mã = 'ABC' and Giá >= 50) or (Trạng thái in ['INACTIVE'] and Tên like 'x%'). */
  readonly nestedValue = signal<Filter | null>({
    operator: 'OR',
    data: [
      {
        operator: 'AND',
        data: [
          { field: 'code', operator: 'EQUAL', data: 'ABC' },
          { field: 'price', operator: 'GREATER_OR_EQUAL', data: 50 },
        ],
      },
      {
        operator: 'AND',
        data: [
          { field: 'status', operator: 'IN', data: ['INACTIVE'] },
          { field: 'name', operator: 'START_WITH', data: 'x' },
        ],
      },
    ],
  } as Filter);

  /** Empty start — build from scratch; the JSON panel fills in as rules complete. */
  readonly emptyValue = signal<Filter | null>(null);
}
