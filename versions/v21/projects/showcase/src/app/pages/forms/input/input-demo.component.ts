import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { DemoPageComponent, DemoSectionComponent } from '../../../shared/demo-page.component';
import { SdInput } from '@sdcorejs/angular/forms/input';

@Component({
  selector: 'app-input-demo',
  standalone: true,
  imports: [DemoPageComponent, DemoSectionComponent, FormsModule, ReactiveFormsModule, SdInput],
  template: `
    <demo-page #demoPage title="Input" description="sd-input – ô nhập liệu một dòng. Hỗ trợ helper text, kiểu (text/number/password/email), trạng thái disabled / readonly / viewed và validator chuẩn.">
      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-co-ban') {
      <demo-section heading="Cơ bản" [props]="[{ name: '[(model)]', value: 'two-way' }]" note="Bind hai chiều với [(model)] và FormGroup chia sẻ.">
        <div style="width: 320px">
          <sd-input label="Họ và tên" placeholder="Nhập họ tên..." helperText="Tên đầy đủ theo CMND" [(model)]="basic" [form]="form"></sd-input>
        </div>
      </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-validator') {
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
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-cac-trang-thai-bao-loi-inline') {
      <demo-section
        heading="Các trạng thái báo lỗi (inline)"
        [props]="[{ name: 'required', value: 'true' }, { name: 'minlength', value: '6' }, { name: 'pattern', value: 'regex' }, { name: '[validator]', value: 'fn' }, { name: 'inlineError', value: 'text' }]"
        note="Mỗi ô minh hoạ một loại lỗi. Bấm Hiện lỗi để mark touched — lỗi xuất hiện dưới ô (đỏ). Ô [validator] cấm chữ 'admin'; gõ admin để thấy lỗi.">
        <div style="width: 340px; display:flex; flex-direction:column; gap:12px">
          <sd-input label="required (để trống)" [(model)]="errRequired" [form]="formErr" required></sd-input>
          <sd-input label="minlength = 6" [(model)]="errMinLen" [form]="formErr" [minlength]="6"></sd-input>
          <sd-input label="pattern = 10 chữ số" placeholder="vd: 0987654321" [(model)]="errPattern" [form]="formErr" pattern="^\\d{10}$" patternErrorMessage="Phải gồm đúng 10 chữ số"></sd-input>
          <sd-input label="[validator] (cấm 'admin')" [(model)]="errValidator" [form]="formErr" [validator]="forbidAdmin"></sd-input>
          <sd-input label="inlineError (lỗi do cha truyền)" [(model)]="errInline" [form]="formErr" [inlineError]="serverError()"></sd-input>
          <div style="display:flex; gap:8px">
            <button type="button" (click)="showErr()">Hiện lỗi</button>
            <button type="button" (click)="resetErr()">Đặt lại</button>
          </div>
        </div>
      </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-bao-loi-dang-icon-hideinlineerror') {
      <demo-section
        heading="Báo lỗi dạng icon (hideInlineError)"
        [props]="[{ name: 'hideInlineError', value: 'true' }, { name: '[validator]', value: 'fn' }]"
        note="Khi hideInlineError=true: không có dòng lỗi dưới ô — thay vào đó icon ⚠ đỏ nằm sát mép phải, message hiện qua tooltip khi hover. Các ô đã có giá trị nên nút xoá (×) cũng hiện cạnh icon lỗi (xoá nằm bên trái, icon lỗi sát mép phải).">
        <div style="width: 340px; display:flex; flex-direction:column; gap:12px">
          <sd-input label="minlength = 6" [(model)]="iconMinLen" [form]="formIcon" [minlength]="6" hideInlineError></sd-input>
          <sd-input label="pattern = 10 chữ số" [(model)]="iconPattern" [form]="formIcon" pattern="^\\d{10}$" patternErrorMessage="Phải gồm đúng 10 chữ số" hideInlineError></sd-input>
          <sd-input label="[validator] (cấm 'admin')" [(model)]="iconValidator" [form]="formIcon" [validator]="forbidAdmin" hideInlineError></sd-input>
          <div style="display:flex; gap:8px">
            <button type="button" (click)="showIcon()">Hiện lỗi</button>
            <button type="button" (click)="resetIcon()">Đặt lại</button>
          </div>
        </div>
      </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-trang-thai') {
      <demo-section heading="Trạng thái" [props]="[{ name: 'disabled', value: 'true' }, { name: 'readonly', value: 'true' }, { name: 'viewed', value: 'true' }]" note="Ba trạng thái không cho chỉnh sửa.">
        <div style="display:flex; gap:16px; flex-wrap:wrap; width:100%">
          <sd-input style="width: 220px" label="disabled" [(model)]="lockedA" [form]="form" disabled></sd-input>
          <sd-input style="width: 220px" label="readonly" [(model)]="lockedB" [form]="form" readonly></sd-input>
          <sd-input style="width: 220px" label="viewed" [(model)]="lockedC" [form]="form" viewed></sd-input>
        </div>
      </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-kich-thuoc') {
      <demo-section heading="Kích thước" [props]="[{ name: 'size', value: 'sm' }]" note="size='sm' cho UI gọn hơn.">
        <div style="width: 320px">
          <sd-input label="sm" size="sm" placeholder="VD: NV001" [(model)]="codeSm" [form]="form"></sd-input>
        </div>
      </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-chinh-sua-noi-tuyen') {
      <demo-section heading="Chỉnh sửa nội tuyến" [props]="[{ name: 'viewed', value: 'inline' }]" note="Input trong suốt nhìn như text; bấm/focus là gõ trực tiếp (không có panel). Hover đậm nền.">
        <div style="width: 260px; font-size:13px; color:#555">
          Họ tên: <sd-input [viewed]="'inline'" [(model)]="lockedB" [form]="form"></sd-input>
        </div>
      </demo-section>
      }
    </demo-page>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InputDemoComponent {
  form = new FormGroup({});
  formValid = new FormGroup({});
  formErr = new FormGroup({});
  formIcon = new FormGroup({});

  basic = signal<string | null>('Nguyễn Văn A');
  email = signal<string | null>(null);
  password = signal<string | null>(null);
  lockedA = signal<string | null>('Không thể sửa');
  lockedB = signal<string | null>('Chỉ đọc');
  lockedC = signal<string | null>('Chế độ xem');
  codeSm = signal<string | null>(null);

  // Error-state demo (inline)
  errRequired = signal<string | null>(null);
  errMinLen = signal<string | null>('abc');
  errPattern = signal<string | null>('12ab');
  errValidator = signal<string | null>('admin');
  errInline = signal<string | null>('user@corp.vn');
  serverError = signal<string>('Email đã tồn tại trong hệ thống');

  // Error-state demo (icon / hideInlineError) — pre-filled invalid values so the
  // clear button also shows next to the error icon (demonstrates suffix ordering).
  iconMinLen = signal<string | null>('abc');
  iconPattern = signal<string | null>('12ab');
  iconValidator = signal<string | null>('admin');

  // why: SdCustomValidator = (value) => string | Promise<string>. Trả chuỗi rỗng = hợp lệ,
  // trả message = lỗi. async để minh hoạ luồng validator bất đồng bộ ([validator] dùng async validator).
  forbidAdmin = async (value: any): Promise<string> =>
    (value ?? '').toString().trim().toLowerCase() === 'admin' ? 'Không được dùng "admin"' : '';

  check() { this.formValid.markAllAsTouched(); }
  reset() { this.formValid.reset(); this.formValid.markAsUntouched(); }

  // why: "Đặt lại" KHÔNG dùng fg.reset() — reset() set control về null (rỗng) → minlength/pattern/
  // validator không bắt lỗi trên giá trị rỗng → bấm "Hiện lỗi" lần nữa không thấy lỗi. Thay vào đó
  // gieo lại đúng các giá trị sai mẫu (qua [(model)] signal) rồi markAsUntouched → demo lặp lại được.
  showErr() { this.formErr.markAllAsTouched(); }
  resetErr() {
    this.errRequired.set(null);
    this.errMinLen.set('abc');
    this.errPattern.set('12ab');
    this.errValidator.set('admin');
    this.errInline.set('user@corp.vn');
    this.formErr.markAsUntouched();
  }
  showIcon() { this.formIcon.markAllAsTouched(); }
  resetIcon() {
    this.iconMinLen.set('abc');
    this.iconPattern.set('12ab');
    this.iconValidator.set('admin');
    this.formIcon.markAsUntouched();
  }
}
