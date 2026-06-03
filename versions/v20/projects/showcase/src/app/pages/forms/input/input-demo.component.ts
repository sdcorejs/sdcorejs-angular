import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { DemoPageComponent, DemoSectionComponent } from '../../../shared/demo-page.component';
import { SdInput } from '@sdcorejs/angular/forms/input';

@Component({
  selector: 'app-input-demo',
  standalone: true,
  imports: [DemoPageComponent, DemoSectionComponent, FormsModule, ReactiveFormsModule, SdInput],
  template: `
    <demo-page title="Input" description="sd-input – ô nhập liệu một dòng. Hỗ trợ helper text, kiểu (text/number/password/email), trạng thái disabled / readonly / viewed và validator chuẩn.">
      <demo-section heading="Cơ bản" [props]="[{ name: '[(model)]', value: 'two-way' }]" note="Bind hai chiều với [(model)] và FormGroup chia sẻ.">
        <div style="width: 320px">
          <sd-input label="Họ và tên" placeholder="Nhập họ tên..." helperText="Tên đầy đủ theo CMND" [(model)]="basic" [form]="form"></sd-input>
        </div>
      </demo-section>

      <demo-section heading="Validator" [props]="[{ name: 'required', value: 'true' }, { name: 'type', value: 'email' }, { name: 'minlength', value: '6' }]" note="Bấm Kiểm tra để hiện lỗi inline.">
        <div style="width: 320px; display:flex; flex-direction:column; gap:12px">
          <sd-input label="required + type=email" placeholder="vd: a@b.com" type="email" [(model)]="email" [form]="formValid" required></sd-input>
          <sd-input label="required + minlength=6" type="password" [(model)]="password" [form]="formValid" required [minlength]="6"></sd-input>
          <div style="display:flex; gap:8px">
            <button type="button" (click)="check()">Kiểm tra</button>
            <button type="button" (click)="reset()">Đặt lại</button>
          </div>
        </div>
      </demo-section>

      <demo-section heading="Trạng thái" [props]="[{ name: 'disabled', value: 'true' }, { name: 'readonly', value: 'true' }, { name: 'viewed', value: 'true' }]" note="Ba trạng thái không cho chỉnh sửa.">
        <div style="display:flex; gap:16px; flex-wrap:wrap; width:100%">
          <sd-input style="width: 220px" label="disabled" [(model)]="lockedA" [form]="form" disabled></sd-input>
          <sd-input style="width: 220px" label="readonly" [(model)]="lockedB" [form]="form" readonly></sd-input>
          <sd-input style="width: 220px" label="viewed" [(model)]="lockedC" [form]="form" viewed></sd-input>
        </div>
      </demo-section>

      <demo-section heading="Kích thước" [props]="[{ name: 'size', value: 'sm' }]" note="size='sm' cho UI gọn hơn.">
        <div style="width: 320px">
          <sd-input label="sm" size="sm" placeholder="VD: NV001" [(model)]="codeSm" [form]="form"></sd-input>
        </div>
      </demo-section>

      <demo-section heading="Chỉnh sửa nội tuyến" [props]="[{ name: 'viewed', value: 'inline' }]" note="Input trong suốt nhìn như text; bấm/focus là gõ trực tiếp (không có panel). Hover đậm nền.">
        <div style="width: 260px; font-size:13px; color:#555">
          Họ tên: <sd-input [viewed]="'inline'" [(model)]="lockedB" [form]="form"></sd-input>
        </div>
      </demo-section>
    </demo-page>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InputDemoComponent {
  form = new FormGroup({});
  formValid = new FormGroup({});

  basic = signal<string | null>('Nguyễn Văn A');
  email = signal<string | null>(null);
  password = signal<string | null>(null);
  lockedA = signal<string | null>('Không thể sửa');
  lockedB = signal<string | null>('Chỉ đọc');
  lockedC = signal<string | null>('Chế độ xem');
  codeSm = signal<string | null>(null);

  check() { this.formValid.markAllAsTouched(); }
  reset() { this.formValid.reset(); this.formValid.markAsUntouched(); }
}
