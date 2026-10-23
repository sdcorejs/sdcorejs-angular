import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { FormGroup, FormGroupDirective, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { DemoPageComponent, DemoSectionComponent } from '../../../shared/demo-page.component';
import { SdChip } from '@sdcorejs/angular/forms/chip';

@Component({
  selector: 'app-chip-demo',
  standalone: true,
  imports: [DemoPageComponent, DemoSectionComponent, FormsModule, ReactiveFormsModule, SdChip],
  template: `
    <demo-page #demoPage title="Chip" description="sd-chip – nhập danh sách tag dưới dạng chuỗi. Gõ rồi Enter để thêm, bấm X để xoá.">
      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-lien-ket-hai-chieu') {
      <demo-section heading="Liên kết hai chiều" [props]="[{ name: '[(model)]', value: 'two-way' }]" note="Mỗi chip là một string trong mảng.">
        <div style="width: 420px; display:flex; flex-direction:column; gap:8px">
          <sd-chip label="Kỹ năng" placeholder="Nhập rồi Enter..." helperText="Có thể thêm nhiều giá trị"
            [(model)]="skills" [form]="form"></sd-chip>
          <div style="font-size:12px; color:#555">
            Số chip: <b>{{ skills().length }}</b> — [{{ skills().join(', ') }}]
          </div>
        </div>
      </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-bat-buoc-so-toi-thieu') {
      <demo-section heading="Bắt buộc & số tối thiểu" [props]="[{ name: 'required', value: 'true' }, { name: 'min', value: '3' }, { name: 'hideInlineError', value: 'true' }]" note="Cần ít nhất 3 chip. Lỗi chỉ hiện khi đã chạm field hoặc đã bấm Gửi; field dưới ẩn lỗi vào icon.">
        <form [formGroup]="formValid" #validForm="ngForm" style="width: 420px; display:flex; flex-direction:column; gap:12px">
          <sd-chip label="required + min=3" placeholder="Nhập rồi Enter..."
            [(model)]="tags" [form]="formValid" required [min]="3"></sd-chip>
          <sd-chip label="hideInlineError" name="compactTags" size="sm" placeholder="Nhập rồi Enter..."
            [(model)]="compactTags" [form]="formValid" required hideInlineError></sd-chip>
          <div style="display:flex; gap:8px">
            <button type="submit">Gửi</button>
            <button type="button" (click)="check()">Kiểm tra</button>
            <button type="button" (click)="reset(validForm)">Đặt lại</button>
          </div>
        </form>
      </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-chip-khoa') {
      <demo-section heading="Chip khoá" [props]="[{ name: 'removable', value: 'predicate' }]" note="Predicate áp cho nút ✕, Backspace và Delete: chip “Quản trị” không xoá được.">
        <div style="width: 420px">
          <sd-chip label="Vai trò" placeholder="Nhập rồi Enter..." [(model)]="roles" [form]="form" [removable]="canRemoveRole"></sd-chip>
        </div>
      </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-vo-hieu-hoa') {
      <demo-section heading="Vô hiệu hoá" [props]="[{ name: 'disabled', value: 'true' }]" note="Không cho thêm / xoá chip.">
        <div style="width: 420px">
          <sd-chip label="disabled" [(model)]="lockedTags" [form]="form" disabled></sd-chip>
        </div>
      </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-kich-thuoc') {
      <demo-section heading="Kích thước" [props]="[{ name: 'size', value: 'sm' }]" note="Chip thu gọn cho bảng / toolbar.">
        <div style="width: 420px">
          <sd-chip label="sm" size="sm" placeholder="Nhập nhãn..." [(model)]="filters" [form]="form"></sd-chip>
        </div>
      </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-chinh-sua-noi-tuyen') {
      <demo-section heading="Chỉnh sửa nội tuyến" [props]="[{ name: 'viewed', value: 'inline' }]" note="Chip strip vẫn sửa được, nhưng khi disabled thì rơi về xem tĩnh (viewed=true).">
        <div style="width: 420px; display:flex; flex-direction:column; gap:8px">
          <sd-chip label="Tags (inline)" [viewed]="'inline'" [(model)]="inlineTags" [form]="form"></sd-chip>
          <sd-chip label="disabled + inline → tĩnh" [viewed]="'inline'" [(model)]="inlineTags" [form]="form" disabled></sd-chip>
        </div>
      </demo-section>
      }
    </demo-page>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChipDemoComponent {
  form = new FormGroup({});
  formValid = new FormGroup({});

  skills = signal<string[]>(['Angular', 'TypeScript', 'RxJS']);
  tags = signal<string[]>([]);
  compactTags = signal<string[]>([]);
  roles = signal<string[]>(['Quản trị', 'Biên tập', 'Xem']);
  lockedTags = signal<string[]>(['Đã khoá 1', 'Đã khoá 2']);
  filters = signal<string[]>([]);
  inlineTags = signal<(string | number)[]>(['alpha', 'beta']);

  canRemoveRole = (role: string | number) => role !== 'Quản trị';

  check() { this.formValid.markAllAsTouched(); }
  // why: resetForm() đưa cả cờ `submitted` về false, nên lỗi sau “Gửi” cũng mất.
  reset(form: FormGroupDirective) { form.resetForm(); }
}
