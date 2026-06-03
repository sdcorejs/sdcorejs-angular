import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { DemoPageComponent, DemoSectionComponent } from '../../../shared/demo-page.component';
import { SdCodeEditor } from '@sdcorejs/angular/components/code-editor';

@Component({
  selector: 'app-code-editor-demo',
  standalone: true,
  imports: [DemoPageComponent, DemoSectionComponent, SdCodeEditor],
  template: `
    <demo-page
      title="Code Editor"
      description="Trình soạn thảo mã nguồn với highlight cú pháp (Prism) — hỗ trợ TypeScript / JSON / HTML / CSS / SCSS, có nút sao chép sẵn.">

      <demo-section [props]="[{ name: 'language', value: 'typescript' }]">
        <div class="code-box">
          <sd-code-editor language="typescript" [(model)]="tsCode" maxHeight="280px"></sd-code-editor>
        </div>
      </demo-section>

      <demo-section [props]="[{ name: 'language', value: 'json' }, { name: 'viewed', value: 'true' }]">
        <div class="code-box">
          <sd-code-editor language="json" [model]="jsonValue" [viewed]="true" maxHeight="240px"></sd-code-editor>
        </div>
      </demo-section>

      <demo-section [props]="[{ name: 'language', value: 'html' }]">
        <div class="code-box">
          <sd-code-editor language="html" [(model)]="htmlCode" maxHeight="220px"></sd-code-editor>
        </div>
      </demo-section>
    </demo-page>
  `,
  styles: [`
    .code-box {
      width: 100%;
      max-width: 720px;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CodeEditorDemoComponent {
  readonly tsCode = signal<string>(
    `interface Employee {
  id: number;
  name: string;
  department: 'TECH' | 'SALES' | 'HR';
}

function isActive(emp: Employee): boolean {
  return emp.id > 0 && !!emp.name;
}`,
  );

  readonly jsonValue = {
    code: 'HD-2025-0001',
    name: 'Hợp đồng cung cấp dịch vụ phần mềm',
    amount: 1_280_000_000,
    status: 'ACTIVE',
    items: ['Triển khai', 'Bảo hành', 'Bảo trì'],
  };

  readonly htmlCode = signal<string>(
    `<section class="invoice">
  <h2>Hóa đơn #HD-2025-0001</h2>
  <p>Khách hàng: <strong>Công ty TNHH ABC</strong></p>
</section>`,
  );
}
