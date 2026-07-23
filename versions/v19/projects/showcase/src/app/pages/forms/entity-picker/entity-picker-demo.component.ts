import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { SdQueryField } from '@sdcorejs/angular/components/query-bar';
import { SdTableColumn } from '@sdcorejs/angular/components/table';
import {
  SdEntityPicker,
  SdEntityPickerDataProvider,
  SdEntityPickerDetailTemplateDirective,
  SdEntityPickerRowTemplateDirective,
  SdEntityPickerSelectedTemplateDirective,
} from '@sdcorejs/angular/forms/entity-picker';
import { DemoPageComponent, DemoSectionComponent } from '../../../shared/demo-page.component';

interface Employee {
  id: number;
  code: string;
  name: string;
  department: string;
  disabled?: boolean;
}

const EMPLOYEES: Employee[] = Array.from({ length: 48 }, (_, index) => ({
  id: index + 1,
  code: `EMP-${String(index + 1).padStart(3, '0')}`,
  name: ['Nguyễn An', 'Trần Bình', 'Lê Chi', 'Phạm Dũng'][index % 4] + ` ${index + 1}`,
  department: ['Kế toán', 'Nhân sự', 'Vận hành'][index % 3],
  disabled: index === 4,
}));

@Component({
  selector: 'app-entity-picker-demo',
  standalone: true,
  imports: [
    DemoPageComponent,
    DemoSectionComponent,
    SdEntityPicker,
    SdEntityPickerRowTemplateDirective,
    SdEntityPickerSelectedTemplateDirective,
    SdEntityPickerDetailTemplateDirective,
  ],
  template: `
    <demo-page
      #demoPage
      title="Entity Picker"
      description="SdEntityPicker compose QueryBar, Table và Modal cho key model type-safe, server paging, hydration và cancellation.">
      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-server-single-select') {
        <demo-section
          heading="Server single-select"
          [props]="[
            { name: 'model', value: single() ?? 'null' },
            { name: 'pageSize', value: 10 },
          ]"
          note="Tìm kiếm, filter, sort và paging đi qua provider; request cũ nhận AbortSignal khi query mới bắt đầu.">
          <sd-entity-picker
            style="max-width: 520px"
            [provider]="provider"
            [columns]="columns"
            [queryFields]="queryFields"
            valueField="id"
            displayField="name"
            [pageSize]="10"
            [(model)]="single" />
        </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-multi-select-va-hydration') {
        <demo-section
          heading="Multi-select và hydration"
          [props]="[{ name: 'model', value: multi().join(', ') }]"
          note="EMP-042 không thuộc page đầu nhưng vẫn được hydrate và hiển thị theo stable key.">
          <sd-entity-picker
            style="max-width: 520px"
            [provider]="provider"
            [columns]="columns"
            valueField="id"
            displayField="name"
            multiple
            [(model)]="multi">
            <ng-template sdEntityPickerSelected let-entities="entities" let-keys="keys">
              {{ entities.length }} nhân viên · keys {{ keys.join(', ') }}
            </ng-template>
          </sd-entity-picker>
        </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-row-va-detail-template') {
        <demo-section
          heading="Row và detail template"
          note="Template nhận entity đã hydrate; table engine và selection engine vẫn do SdTable sở hữu.">
          <sd-entity-picker style="max-width: 520px" [provider]="provider" valueField="id" displayField="name" [model]="3">
            <ng-template sdEntityPickerRow let-employee="item">
              <strong>{{ employee.name }}</strong> · {{ employee.department }}
            </ng-template>
            <ng-template sdEntityPickerDetail let-entities="entities"> Selected detail: {{ entities[0]?.code }} </ng-template>
          </sd-entity-picker>
        </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-error-retry-va-create-action') {
        <demo-section
          heading="Error, retry và create action"
          [props]="[{ name: 'addable', value: true }]"
          note="Provider lỗi hiển thị DataState retry; create chỉ phát event, không hard-code workflow nghiệp vụ.">
          <sd-entity-picker
            style="max-width: 520px"
            [provider]="errorProvider"
            valueField="id"
            displayField="name"
            addable
            (sdAdd)="onAdd()" />
          <div data-add-count>Create actions: {{ addCount() }}</div>
        </demo-section>
      }
    </demo-page>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EntityPickerDemoComponent {
  readonly single = signal<number | null>(2);
  readonly multi = signal<number[]>([1, 42]);
  readonly addCount = signal(0);
  readonly columns: SdTableColumn<Employee>[] = [
    { field: 'code', title: 'Mã', type: 'string', sortable: true },
    { field: 'name', title: 'Tên', type: 'string', sortable: true },
    { field: 'department', title: 'Phòng ban', type: 'string' },
  ];
  readonly queryFields: SdQueryField<Employee>[] = [
    { key: 'name', label: 'Tên', type: 'string' },
    { key: 'department', label: 'Phòng ban', type: 'string' },
  ];
  readonly provider: SdEntityPickerDataProvider<Employee, number> = {
    load: async request => {
      await abortableDelay(120, request.signal);
      const search = (request.query.search ?? '').toLocaleLowerCase();
      const filtered = EMPLOYEES.filter(
        item => !search || `${item.code} ${item.name} ${item.department}`.toLocaleLowerCase().includes(search)
      );
      const start = request.pageIndex * request.pageSize;
      return { items: filtered.slice(start, start + request.pageSize), total: filtered.length };
    },
    hydrate: keys => EMPLOYEES.filter(item => keys.includes(item.id)),
  };
  readonly errorProvider: SdEntityPickerDataProvider<Employee, number> = {
    load: () => Promise.reject(new Error('Không thể tải danh sách nhân viên')),
    hydrate: keys => EMPLOYEES.filter(item => keys.includes(item.id)),
  };

  onAdd(): void {
    this.addCount.update(value => value + 1);
  }
}

function abortableDelay(duration: number, signal: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(resolve, duration);
    signal.addEventListener(
      'abort',
      () => {
        clearTimeout(timer);
        reject(new DOMException('Aborted', 'AbortError'));
      },
      { once: true }
    );
  });
}
