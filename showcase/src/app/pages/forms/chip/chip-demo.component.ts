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
          <sd-chip label="Kỹ năng" placeholder="Nhập rồi Enter..." [(model)]="skills" [form]="form"></sd-chip>
          <div style="font-size:12px; color:#555">
            Số chip: <b>{{ skills().length }}</b> — [{{ skills().join(', ') }}]
          </div>
        </div>
      </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-bat-buoc-so-toi-thieu') {
      <demo-section heading="Bắt buộc & số tối thiểu" [props]="[{ name: 'required', value: 'true' }, { name: 'minCount', value: '3' }, { name: 'hideInlineError', value: 'true' }]" note="Cần ít nhất 3 chip. Lỗi chỉ hiện khi đã chạm field hoặc đã bấm Gửi; field dưới ẩn lỗi vào icon.">
        <form [formGroup]="formValid" #validForm="ngForm" style="width: 420px; display:flex; flex-direction:column; gap:12px">
          <sd-chip label="required + min=3" placeholder="Nhập rồi Enter..."
            [(model)]="tags" [form]="formValid" required [minCount]="3"></sd-chip>
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

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-nguoi-nhan-email') {
      <demo-section heading="Người nhận email" [props]="[{ name: 'separators', value: 'Enter , ;' }, { name: 'chipTransform', value: 'trim + chữ thường' }, { name: 'chipValidator', value: 'email' }, { name: 'maxCount', value: '5' }, { name: 'clearable', value: 'true' }]" note="Gõ abc rồi Enter: báo lỗi, chữ còn trong ô. Gõ AN@congty.vn: chip đã có nháy lên. Gõ rồi Tab ra ngoài: vẫn thành chip. Dán “a@x.vn, b@x.vn; abc”: thêm nhiều chip một lần. Đủ 5 thì không thêm được nữa. Chip toi@congty.vn không xoá được.">
        <div style="width: 420px">
          <sd-chip label="Người nhận" [(model)]="recipients" [form]="form" [separators]="emailSeparators"
            [chipTransform]="toEmail" [chipValidator]="checkEmail" [maxCount]="5" [removable]="canRemoveRecipient" clearable></sd-chip>
        </div>
      </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-gon-trong-o-bang') {
      <demo-section heading="Gọn trong ô bảng" [props]="[{ name: 'size', value: 'sm' }, { name: 'maxVisible', value: '2' }, { name: 'hideInlineError', value: 'true' }]" note="Khi không focus chỉ hiện 2 chip và “+N”; bấm “+N” hoặc focus vào ô để thấy hết. Chip dài hơn 240px bị cắt kèm tooltip.">
        <div style="width: 280px">
          <sd-chip size="sm" hideInlineError [maxVisible]="2" [(model)]="cellTags" [form]="form"></sd-chip>
        </div>
      </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-chip-khoa') {
      <demo-section heading="Chip khoá" [props]="[{ name: 'removable', value: 'predicate' }]" note="Predicate áp cho nút ✕, Backspace, Delete và nút bỏ hết: chip “Quản trị” không xoá được — nền nhạt hơn, icon khoá có tooltip “Không xoá được”, screen reader đọc “Quản trị, Không xoá được”.">
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
      <demo-section heading="Kích thước" [props]="[{ name: 'size', value: 'sm | md | lg' }]" note="Field một dòng 32 / 40 / 48px, chip 20 / 24 / 28px nằm giữa — cùng thang với sd-chip-calendar. Dùng sm cho bảng / toolbar.">
        <div style="width: 420px; display:flex; flex-direction:column; gap:12px">
          <sd-chip label="sm" size="sm" [(model)]="sizeTags" [form]="form" [removable]="canRemoveRole" clearable></sd-chip>
          <sd-chip label="md" [(model)]="sizeTags" [form]="form" [removable]="canRemoveRole" clearable></sd-chip>
          <sd-chip label="lg" size="lg" [(model)]="sizeTags" [form]="form" [removable]="canRemoveRole" clearable></sd-chip>
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
  sizeTags = signal<string[]>(['Quản trị', 'Angular', 'RxJS']);
  inlineTags = signal<(string | number)[]>(['alpha', 'beta']);

  canRemoveRole = (role: string | number) => role !== 'Quản trị';

  recipients = signal<string[]>(['toi@congty.vn', 'an@congty.vn']);
  readonly emailSeparators = ['Enter', ',', ';'];
  // why: so trùng phân biệt hoa thường, nên đưa email về chữ thường trước khi so và lưu.
  toEmail = (raw: string) => raw.trim().toLowerCase();
  checkEmail = (email: string | number) => (/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(String(email)) ? null : 'Email không hợp lệ');
  canRemoveRecipient = (email: string | number) => email !== 'toi@congty.vn';

  cellTags = signal<string[]>(['angular', 'typescript', 'rxjs', 'https://sdcorejs.github.io/sdcorejs-angular/latest/forms/chip', 'material']);

  check() { this.formValid.markAllAsTouched(); }
  // why: resetForm() đưa cả cờ `submitted` về false, nên lỗi sau “Gửi” cũng mất.
  reset(form: FormGroupDirective) { form.resetForm(); }
}
