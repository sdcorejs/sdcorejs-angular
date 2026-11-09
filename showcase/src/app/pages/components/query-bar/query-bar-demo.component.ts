import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { DemoPageComponent, DemoSectionComponent } from '../../../shared/demo-page.component';
import { SdQueryBar, SdQueryField, SdQueryLogic } from '@sdcorejs/angular/components/query-bar';
import { Filter } from '@sdcorejs/utils/models';

interface Employee {
  id: number;
  name: string;
  email: string;
  department: string;
  status: string;
  region: string;
  salary: number;
  joinDate: Date;
  active: boolean;
}

@Component({
  selector: 'app-query-bar-demo',
  standalone: true,
  imports: [DemoPageComponent, DemoSectionComponent, SdQueryBar],
  template: `
    <demo-page #demoPage
      title="Query Bar"
      description="Thanh chip lọc thống nhất (Jira / Linear style) — gọn nhẹ, hỗ trợ AND/OR, lưu bộ lọc, popover hoặc inline mode. Thay thế bộ lọc rời rạc trên đầu trang danh sách.">

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-che-do-popover') {
      <demo-section
        heading="Chế độ popover"
        [props]="[{ name: 'mode', value: 'popover' }, { name: 'savedFiltersKey', value: 'showcase.query-bar.popover' }]"
        note="Nút + mở danh sách field; bấm chip mở popover sửa toán tử và giá trị — giá trị ghi khi đóng (Esc, bấm ra ngoài, Tab ra). Nút bookmark: lưu bộ lọc hiện tại, chọn để áp, xoá có Hoàn tác.">
        <div class="bar-box">
          <sd-query-bar
            autoId="query-bar-popover"
            [fields]="fields"
            [(filters)]="filters"
            [(logic)]="logic"
            [(search)]="search"
            mode="popover"
            [showSearch]="true"
            [showLogicToggle]="true"
            [showClearAll]="true"
            [showSavedFilters]="true"
            savedFiltersKey="showcase.query-bar.popover"
            (apply)="onApply()">
          </sd-query-bar>
        </div>
      </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-che-do-inline') {
      <demo-section
        heading="Chế độ inline"
        [props]="[{ name: 'mode', value: 'inline' }, { name: 'required', value: 'Phòng ban' }]"
        note="Bấm vào thanh hoặc gõ vào ô Thêm điều kiện để chọn field (gõ “kh”, Enter); Backspace hai lần ở ô rỗng xoá chip cuối. Phòng ban là field bắt buộc: luôn có chip, không bỏ trống được giá trị, Xoá lọc giữ nguyên. Chip values bấm vào giá trị để sửa inline (sd-select [viewed]='inline').">
        <div class="bar-box">
          <sd-query-bar
            autoId="query-bar-inline"
            [fields]="inlineFields"
            [(filters)]="inlineFilters"
            [(logic)]="logic"
            mode="inline"
            density="compact"
            [showSearch]="true"
            [showLogicToggle]="true"
            [showOperatorOnChip]="true"
            [showSavedFilters]="true"
            savedFiltersKey="showcase.query-bar.inline"
            (apply)="onApply()">
          </sd-query-bar>
        </div>
      </demo-section>
      }
    </demo-page>
  `,
  styles: [`
    .bar-box {
      width: 100%;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class QueryBarDemoComponent {
  readonly departmentOptions = [
    { value: 'TECH', display: 'Công nghệ' },
    { value: 'SALES', display: 'Kinh doanh' },
    { value: 'HR', display: 'Nhân sự' },
    { value: 'FINANCE', display: 'Tài chính' },
    { value: 'MARKETING', display: 'Marketing' },
  ];

  readonly regionOptions = [
    { value: 'NORTH', display: 'Miền Bắc' },
    { value: 'CENTRAL', display: 'Miền Trung' },
    { value: 'SOUTH', display: 'Miền Nam' },
  ];

  readonly statusOptions = [
    { value: 'ACTIVE', display: 'Đang làm việc' },
    { value: 'PROBATION', display: 'Thử việc' },
    { value: 'RESIGNED', display: 'Đã nghỉ' },
  ];

  readonly fields: SdQueryField<Employee>[] = [
    { type: 'string', key: 'name', label: 'Họ tên', icon: 'person' },
    { type: 'string', key: 'email', label: 'Email', icon: 'alternate_email', operators: true },
    {
      type: 'values',
      key: 'department',
      label: 'Phòng ban',
      icon: 'apartment',
      operators: true,
      option: { items: this.departmentOptions, valueField: 'value', displayField: 'display' },
    },
    {
      type: 'values',
      key: 'status',
      label: 'Trạng thái',
      icon: 'badge',
      option: { items: this.statusOptions, valueField: 'value', displayField: 'display' },
    },
    {
      type: 'values',
      key: 'region',
      label: 'Khu vực',
      icon: 'map',
      option: { items: this.regionOptions, valueField: 'value', displayField: 'display' },
    },
    { type: 'number', key: 'salary', label: 'Lương', icon: 'payments', operators: true },
    { type: 'date', key: 'joinDate', label: 'Ngày vào', icon: 'event', operators: true },
    { type: 'boolean', key: 'active', label: 'Đang hoạt động', icon: 'toggle_on' },
  ];

  readonly filters = signal<Filter<Employee>[]>([
    { field: 'department', operator: 'IN', value: ['TECH', 'SALES'], data: null } as unknown as Filter<Employee>,
  ]);
  /** Inline demo: Phòng ban is required — its chip is always on the bar and its value cannot be emptied. */
  readonly inlineFields: SdQueryField<Employee>[] = this.fields.map(field =>
    field.key === 'department' ? { ...field, required: true } : field
  );
  readonly inlineFilters = signal<Filter<Employee>[]>([
    { field: 'department', operator: 'IN', data: ['TECH'] } as unknown as Filter<Employee>,
  ]);
  readonly logic = signal<SdQueryLogic>('AND');
  readonly search = signal<string>('');

  onApply(): void {
    // Trong app thực, sẽ trigger reload table dựa trên filters() + logic() + search().
  }
}
