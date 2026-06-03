import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { DemoPageComponent, DemoSectionComponent } from '../../../shared/demo-page.component';
import { SdQueryBar, SdQueryField, SdQueryLogic } from '@sdcorejs/angular/components/query-bar';
import { Filter } from '@sdcorejs/angular/utilities/models';

interface Employee {
  id: number;
  name: string;
  email: string;
  department: string;
  status: string;
  salary: number;
  joinDate: Date;
  active: boolean;
}

@Component({
  selector: 'app-query-bar-demo',
  standalone: true,
  imports: [DemoPageComponent, DemoSectionComponent, SdQueryBar],
  template: `
    <demo-page
      title="Query Bar"
      description="Thanh chip lọc thống nhất (Jira / Linear style) — gọn nhẹ, hỗ trợ AND/OR, lưu bộ lọc, popover hoặc inline mode. Thay thế bộ lọc rời rạc trên đầu trang danh sách.">

      <demo-section heading="Chế độ hiển thị (mode) — popover">
        <div class="bar-box">
          <sd-query-bar
            [fields]="fields"
            [(filters)]="filters"
            [(logic)]="logic"
            [(search)]="search"
            mode="popover"
            [showSearch]="true"
            [showLogicToggle]="true"
            [showClearAll]="true"
            (apply)="onApply()">
          </sd-query-bar>
        </div>
      </demo-section>

      <demo-section heading="Chế độ hiển thị (mode) — inline" note="Chip values bấm vào giá trị để sửa inline (mở panel ngay, không hiện ô input rời); bấm ra ngoài quay về text. Dùng sd-select [viewed]='inline'.">
        <div class="bar-box">
          <sd-query-bar
            [fields]="fields"
            [(filters)]="inlineFilters"
            [(logic)]="logic"
            mode="inline"
            density="compact"
            [showLogicToggle]="true"
            [showOperatorOnChip]="true"
            (apply)="onApply()">
          </sd-query-bar>
        </div>
      </demo-section>
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
    { type: 'number', key: 'salary', label: 'Lương', icon: 'payments', operators: true },
    { type: 'date', key: 'joinDate', label: 'Ngày vào', icon: 'event', operators: true },
    { type: 'boolean', key: 'active', label: 'Đang hoạt động', icon: 'toggle_on' },
  ];

  readonly filters = signal<Filter<Employee>[]>([
    { field: 'department', operator: 'IN', value: ['TECH', 'SALES'], data: null } as unknown as Filter<Employee>,
  ]);
  readonly inlineFilters = signal<Filter<Employee>[]>([]);
  readonly logic = signal<SdQueryLogic>('AND');
  readonly search = signal<string>('');

  onApply(): void {
    // Trong app thực, sẽ trigger reload table dựa trên filters() + logic() + search().
  }
}
