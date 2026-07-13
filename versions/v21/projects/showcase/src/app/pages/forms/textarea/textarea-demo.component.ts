import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { DemoPageComponent, DemoSectionComponent } from '../../../shared/demo-page.component';
import { SdTextarea } from '@sdcorejs/angular/forms/textarea';

@Component({
  selector: 'app-textarea-demo',
  standalone: true,
  imports: [DemoPageComponent, DemoSectionComponent, FormsModule, ReactiveFormsModule, SdTextarea],
  template: `
    <demo-page #demoPage title="Textarea" description="sd-textarea – ô nhập nhiều dòng. Hỗ trợ helper text, validator chiều dài, các trạng thái disabled / readonly.">
      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-co-ban') {
      <demo-section heading="Cơ bản" [props]="[{ name: '[(model)]', value: 'two-way' }]" note="Bind hai chiều với [(model)].">
        <div style="width: 420px">
          <sd-textarea label="Mô tả" placeholder="Nhập mô tả..." helperText="Tối đa 500 ký tự" [(model)]="basic" [form]="form"></sd-textarea>
        </div>
      </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-validator') {
      <demo-section heading="Validator" [props]="[{ name: 'required', value: 'true' }, { name: 'maxlength', value: '50' }]" note="Bấm Kiểm tra để hiện inline error.">
        <div style="width: 420px; display:flex; flex-direction:column; gap:12px">
          <sd-textarea label="required + maxlength=50" [(model)]="reason" [form]="formValid" required [maxlength]="50"></sd-textarea>
          <div style="display:flex; gap:8px">
            <button type="button" (click)="check()">Kiểm tra</button>
            <button type="button" (click)="reset()">Đặt lại</button>
          </div>
        </div>
      </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-trang-thai') {
      <demo-section heading="Trạng thái" [props]="[{ name: 'disabled', value: 'true' }, { name: 'readonly', value: 'true' }]" note="Hai trạng thái không cho chỉnh sửa.">
        <div style="display:flex; gap:16px; flex-wrap:wrap; width:100%">
          <sd-textarea style="width: 280px" label="disabled" [(model)]="lockedA" [form]="form" disabled></sd-textarea>
          <sd-textarea style="width: 280px" label="readonly" [(model)]="lockedB" [form]="form" readonly></sd-textarea>
        </div>
      </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-chinh-sua-noi-tuyen') {
      <demo-section heading="Chỉnh sửa nội tuyến" [props]="[{ name: 'viewed', value: 'inline' }]" note="Hiển thị như text không viền — bấm/focus để sửa tại chỗ. Khi disabled thì rơi về xem tĩnh (viewed=true).">
        <div style="width: 420px; display:flex; flex-direction:column; gap:12px">
          <div style="font-size:12px; color:#555">
            Ghi chú:
            <sd-textarea [viewed]="'inline'" [(model)]="inlineNote" [form]="form"></sd-textarea>
          </div>
          <div style="font-size:12px; color:#555">Giá trị: <b>{{ inlineNote() ?? '(trống)' }}</b></div>
          <sd-textarea label="disabled + inline → tĩnh" [viewed]="'inline'" [(model)]="lockedA" [form]="form" disabled></sd-textarea>
        </div>
      </demo-section>
      }
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
  inlineNote = signal<string | null>('Bấm vào để sửa ghi chú này');

  check() { this.formValid.markAllAsTouched(); }
  reset() { this.formValid.reset(); this.formValid.markAsUntouched(); }
}
