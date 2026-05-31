import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { DemoPageComponent, DemoSectionComponent } from '../../../shared/demo-page.component';
import { SdSelect } from '@sdcorejs/angular/forms/select';

interface Option { value: string; display: string; }

@Component({
  selector: 'app-select-demo',
  standalone: true,
  imports: [DemoPageComponent, DemoSectionComponent, FormsModule, ReactiveFormsModule, SdSelect],
  template: `
    <demo-page title="Select" description="sd-select – dropdown chọn 1 giá trị. Truyền items với valueField + displayField.">
      <demo-section heading="cơ bản" note="Bind hai chiều, hiển thị giá trị đã chọn.">
        <div style="width: 320px; display:flex; flex-direction:column; gap:12px">
          <sd-select [items]="items" valueField="value" displayField="display"
            label="Chọn phòng ban" placeholder="Chọn..." [(model)]="dept" [form]="form"></sd-select>
          <div style="font-size:12px; color:#555">Giá trị: <b>{{ dept() ?? '(trống)' }}</b></div>
        </div>
      </demo-section>

      <demo-section heading="Validator (required)" note="Bấm Kiểm tra để hiện lỗi.">
        <div style="width: 320px; display:flex; flex-direction:column; gap:12px">
          <sd-select [items]="items" valueField="value" displayField="display"
            label="required" helperText="Chọn phòng đang công tác"
            [(model)]="deptR" [form]="formValid" required></sd-select>
          <div style="display:flex; gap:8px">
            <button type="button" (click)="check()">Kiểm tra</button>
            <button type="button" (click)="reset()">Đặt lại</button>
          </div>
        </div>
      </demo-section>

      <demo-section heading="Trạng thái (state)" note="Giá trị đã có sẵn.">
        <div style="display:flex; gap:16px; flex-wrap:wrap; width:100%">
          <sd-select style="width: 240px" [items]="items" valueField="value" displayField="display"
            label="disabled" [(model)]="lockedA" [form]="form" disabled></sd-select>
          <sd-select style="width: 240px" [items]="items" valueField="value" displayField="display"
            label="viewed" [(model)]="lockedB" [form]="form" viewed></sd-select>
        </div>
      </demo-section>

      <demo-section heading="Kích thước (size)" note="UI gọn cho bảng / toolbar.">
        <div style="width: 280px">
          <sd-select [items]="items" valueField="value" displayField="display"
            label="sm" size="sm" [(model)]="quick" [form]="form"></sd-select>
        </div>
      </demo-section>
    </demo-page>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SelectDemoComponent {
  form = new FormGroup({});
  formValid = new FormGroup({});

  items: Option[] = [
    { value: 'IT',  display: 'Công nghệ thông tin' },
    { value: 'HR',  display: 'Nhân sự' },
    { value: 'FIN', display: 'Tài chính' },
    { value: 'OPS', display: 'Vận hành' },
  ];

  dept = signal<string | null>(null);
  deptR = signal<string | null>(null);
  lockedA = signal<string | null>('HR');
  lockedB = signal<string | null>('FIN');
  quick = signal<string | null>(null);

  check() { this.formValid.markAllAsTouched(); }
  reset() { this.formValid.reset(); this.formValid.markAsUntouched(); }
}
