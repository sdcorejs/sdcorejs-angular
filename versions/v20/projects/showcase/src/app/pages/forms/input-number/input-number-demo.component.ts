import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { DemoPageComponent, DemoSectionComponent } from '../../../shared/demo-page.component';
import { SdInputNumber } from '@sdcorejs/angular/forms/input-number';

@Component({
  selector: 'app-input-number-demo',
  standalone: true,
  imports: [DemoPageComponent, DemoSectionComponent, FormsModule, ReactiveFormsModule, SdInputNumber],
  template: `
    <demo-page title="Input Number" description="sd-input-number – nhập số có format ngăn cách hàng nghìn, hỗ trợ min/max, prefix/suffix và các trạng thái khoá.">
      <demo-section heading="Cơ bản" [props]="[{ name: '[(model)]', value: 'two-way' }]" note="Tự động format khi gõ.">
        <div style="width: 320px; display:flex; flex-direction:column; gap:12px">
          <sd-input-number label="Số lượng" placeholder="Nhập số..." [(model)]="qty" [form]="form"></sd-input-number>
          <div style="font-size:12px; color:#555">Giá trị hiện tại: <b>{{ qty() ?? '(trống)' }}</b></div>
        </div>
      </demo-section>

      <demo-section heading="Validator" [props]="[{ name: 'required', value: 'true' }, { name: 'min', value: '10' }, { name: 'max', value: '100' }]" note="min=10, max=100. Bấm Kiểm tra để hiện lỗi.">
        <div style="width: 320px; display:flex; flex-direction:column; gap:12px">
          <sd-input-number label="required + min=10 + max=100" [(model)]="age" [form]="formValid" required [min]="10" [max]="100"></sd-input-number>
          <div style="display:flex; gap:8px">
            <button type="button" (click)="check()">Kiểm tra</button>
            <button type="button" (click)="reset()">Đặt lại</button>
          </div>
        </div>
      </demo-section>

      <demo-section heading="Trạng thái" [props]="[{ name: 'disabled', value: 'true' }, { name: 'readonly', value: 'true' }, { name: 'viewed', value: 'true' }]" note="Ba trạng thái không cho chỉnh sửa.">
        <div style="display:flex; gap:16px; flex-wrap:wrap; width:100%">
          <sd-input-number style="width: 200px" label="disabled" [(model)]="lockedA" [form]="form" disabled></sd-input-number>
          <sd-input-number style="width: 200px" label="readonly" [(model)]="lockedB" [form]="form" readonly></sd-input-number>
          <sd-input-number style="width: 200px" label="viewed" [(model)]="lockedC" [form]="form" viewed></sd-input-number>
        </div>
      </demo-section>

      <demo-section heading="Chỉnh sửa nội tuyến" [props]="[{ name: 'viewed', value: 'inline' }]" note="Input số trong suốt nhìn như text; focus để sửa, blur format lại (vd 12.345). Hover đậm nền.">
        <div style="width: 240px; font-size:13px; color:#555">
          Số lượng: <sd-input-number [viewed]="'inline'" [(model)]="lockedC" [form]="form"></sd-input-number>
        </div>
      </demo-section>
    </demo-page>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InputNumberDemoComponent {
  form = new FormGroup({});
  formValid = new FormGroup({});

  qty = signal<number | null>(1500);
  age = signal<number | null>(null);
  lockedA = signal<number | null>(12345);
  lockedB = signal<number | null>(9999);
  lockedC = signal<number | null>(42);

  check() { this.formValid.markAllAsTouched(); }
  reset() { this.formValid.reset(); this.formValid.markAsUntouched(); }
}
