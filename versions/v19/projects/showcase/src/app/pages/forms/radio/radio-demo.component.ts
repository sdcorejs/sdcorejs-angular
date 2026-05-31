import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { DemoPageComponent, DemoSectionComponent } from '../../../shared/demo-page.component';
import { SdRadio } from '@sdcorejs/angular/forms/radio';

interface Option { value: string; display: string; }

@Component({
  selector: 'app-radio-demo',
  standalone: true,
  imports: [DemoPageComponent, DemoSectionComponent, FormsModule, ReactiveFormsModule, SdRadio],
  template: `
    <demo-page title="Radio" description="sd-radio – chọn 1 giá trị trong nhóm. Hỗ trợ hiển thị hàng ngang/dọc và các trạng thái khoá.">
      <demo-section heading="Hiển thị (display)" note="display='row' (mặc định) và display='column' khi danh sách dài.">
        <div style="display:flex; flex-direction:column; gap:16px; width:100%">
          <sd-radio label="row" [items]="genders" valueField="value" displayField="display"
            [(model)]="gender" [form]="form"></sd-radio>
          <sd-radio label="column" display="column"
            [items]="priorities" valueField="value" displayField="display"
            [(model)]="priority" [form]="form"></sd-radio>
        </div>
      </demo-section>

      <demo-section heading="Validator (required)" note="Không chọn và bấm Kiểm tra để hiện lỗi.">
        <div style="display:flex; flex-direction:column; gap:12px; width:100%">
          <sd-radio label="required"
            [items]="payments" valueField="value" displayField="display"
            [(model)]="payment" [form]="formValid" required></sd-radio>
          <div style="display:flex; gap:8px">
            <button type="button" (click)="check()">Kiểm tra</button>
            <button type="button" (click)="reset()">Đặt lại</button>
          </div>
        </div>
      </demo-section>

      <demo-section heading="Trạng thái (state)" note="Đã có giá trị mặc định.">
        <div style="display:flex; gap:24px; flex-wrap:wrap; width:100%">
          <sd-radio style="flex:1" label="disabled" [items]="genders" valueField="value" displayField="display"
            [(model)]="lockedA" [form]="form" disabled></sd-radio>
          <sd-radio style="flex:1" label="viewed" [items]="genders" valueField="value" displayField="display"
            [(model)]="lockedB" [form]="form" viewed></sd-radio>
        </div>
      </demo-section>
    </demo-page>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RadioDemoComponent {
  form = new FormGroup({});
  formValid = new FormGroup({});

  genders: Option[] = [
    { value: 'M', display: 'Nam' },
    { value: 'F', display: 'Nữ' },
    { value: 'O', display: 'Khác' },
  ];

  priorities: Option[] = [
    { value: 'low', display: 'Thấp' },
    { value: 'med', display: 'Trung bình' },
    { value: 'high', display: 'Cao' },
    { value: 'urg', display: 'Khẩn cấp' },
  ];

  payments: Option[] = [
    { value: 'cash', display: 'Tiền mặt' },
    { value: 'card', display: 'Thẻ tín dụng' },
    { value: 'wallet', display: 'Ví điện tử' },
  ];

  gender = signal<string | null>('M');
  priority = signal<string | null>('med');
  payment = signal<string | null>(null);
  lockedA = signal<string | null>('M');
  lockedB = signal<string | null>('F');

  check() { this.formValid.markAllAsTouched(); }
  reset() { this.formValid.reset(); this.formValid.markAsUntouched(); }
}
