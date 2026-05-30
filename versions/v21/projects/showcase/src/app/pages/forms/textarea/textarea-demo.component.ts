import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { DemoPageComponent, DemoSectionComponent } from '../../../shared/demo-page.component';
import { SdTextarea } from '@sdcorejs/angular/forms/textarea';

@Component({
  selector: 'app-textarea-demo',
  standalone: true,
  imports: [DemoPageComponent, DemoSectionComponent, FormsModule, ReactiveFormsModule, SdTextarea],
  template: `
    <demo-page title="Textarea" description="sd-textarea – ô nhập nhiều dòng. Hỗ trợ helper text, validator chiều dài, các trạng thái disabled / readonly.">
      <demo-section heading="cơ bản" note="Bind hai chiều với [(model)].">
        <div style="width: 420px">
          <sd-textarea label="Mô tả" placeholder="Nhập mô tả..." helperText="Tối đa 500 ký tự" [(model)]="basic" [form]="form"></sd-textarea>
        </div>
      </demo-section>

      <demo-section heading="Validator (required + maxlength=50)" note="Bấm Kiểm tra để hiện inline error.">
        <div style="width: 420px; display:flex; flex-direction:column; gap:12px">
          <sd-textarea label="required + maxlength=50" [(model)]="reason" [form]="formValid" required [maxlength]="50"></sd-textarea>
          <div style="display:flex; gap:8px">
            <button type="button" (click)="check()">Kiểm tra</button>
            <button type="button" (click)="reset()">Đặt lại</button>
          </div>
        </div>
      </demo-section>

      <demo-section heading="Trạng thái (state)" note="Hai trạng thái không cho chỉnh sửa.">
        <div style="display:flex; gap:16px; flex-wrap:wrap; width:100%">
          <sd-textarea style="width: 280px" label="disabled" [(model)]="lockedA" [form]="form" disabled></sd-textarea>
          <sd-textarea style="width: 280px" label="readonly" [(model)]="lockedB" [form]="form" readonly></sd-textarea>
        </div>
      </demo-section>
    </demo-page>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TextareaDemoComponent {
  form = new FormGroup({});
  formValid = new FormGroup({});

  basic = signal<string | null>('Một mô tả mẫu...');
  reason = signal<string | null>(null);
  lockedA = signal<string | null>('Không thể sửa');
  lockedB = signal<string | null>('Chỉ đọc');

  check() { this.formValid.markAllAsTouched(); }
  reset() { this.formValid.reset(); this.formValid.markAsUntouched(); }
}

