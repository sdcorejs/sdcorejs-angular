import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { DemoPageComponent, DemoSectionComponent } from '../../../shared/demo-page.component';
import { SdInputNumber } from '@sdcorejs/angular/forms/input-number';

@Component({
  selector: 'app-input-number-demo',
  standalone: true,
  imports: [DemoPageComponent, DemoSectionComponent, FormsModule, ReactiveFormsModule, SdInputNumber],
  template: `
    <demo-page #demoPage title="Input Number" description="sd-input-number – nhập số có format ngăn cách hàng nghìn, hỗ trợ min/max, prefix/suffix và các trạng thái khoá.">
      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-co-ban') {
      <demo-section heading="Cơ bản" [props]="[{ name: '[(model)]', value: 'two-way' }]" note="Tự động format khi gõ.">
        <div style="width: 320px; display:flex; flex-direction:column; gap:12px">
          <sd-input-number label="Số lượng" placeholder="Nhập số..." [(model)]="qty" [form]="form"></sd-input-number>
          <div style="font-size:12px; color:#555">Giá trị hiện tại: <b>{{ qty() ?? '(trống)' }}</b></div>
        </div>
      </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-validator') {
      <demo-section heading="Validator" [props]="[{ name: 'required', value: 'true' }, { name: 'min', value: '10' }, { name: 'max', value: '100' }]" note="min=10, max=100. Bấm Kiểm tra để hiện lỗi.">
        <div style="width: 320px; display:flex; flex-direction:column; gap:12px">
          <sd-input-number label="required + min=10 + max=100" [(model)]="age" [form]="formValid" required [min]="10" [max]="100"></sd-input-number>
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
        [props]="[{ name: 'required', value: 'true' }, { name: 'min', value: '10' }, { name: 'max', value: '100' }, { name: '[validator]', value: 'fn' }, { name: 'inlineError', value: 'text' }]"
        note="Mỗi ô minh hoạ một loại lỗi. Bấm Hiện lỗi để mark touched. Ô [validator] cấm số 13 — gõ 13 để thấy message (đây là lỗi đã được sửa: trước kia [validator] không hiện được message).">
        <div style="width: 340px; display:flex; flex-direction:column; gap:12px">
          <sd-input-number label="required (để trống)" [(model)]="errRequired" [form]="formErr" required></sd-input-number>
          <sd-input-number label="min = 10" [(model)]="errMin" [form]="formErr" [min]="10"></sd-input-number>
          <sd-input-number label="max = 100" [(model)]="errMax" [form]="formErr" [max]="100"></sd-input-number>
          <sd-input-number label="[validator] (cấm số 13)" [(model)]="errValidator" [form]="formErr" [validator]="forbidThirteen"></sd-input-number>
          <sd-input-number label="inlineError (lỗi do cha truyền)" [(model)]="errInline" [form]="formErr" [inlineError]="serverError()"></sd-input-number>
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
        note="hideInlineError=true: icon ⚠ đỏ sát mép phải, message qua tooltip. Các ô có giá trị nên nút xoá (×) hiện cạnh icon (xoá bên trái, icon lỗi sát mép phải — không bị đẩy vào trong).">
        <div style="width: 340px; display:flex; flex-direction:column; gap:12px">
          <sd-input-number label="min = 10" [(model)]="iconMin" [form]="formIcon" [min]="10" hideInlineError></sd-input-number>
          <sd-input-number label="max = 100" [(model)]="iconMax" [form]="formIcon" [max]="100" hideInlineError></sd-input-number>
          <sd-input-number label="[validator] (cấm số 13)" [(model)]="iconValidator" [form]="formIcon" [validator]="forbidThirteen" hideInlineError></sd-input-number>
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
          <sd-input-number style="width: 200px" label="disabled" [(model)]="lockedA" [form]="form" disabled></sd-input-number>
          <sd-input-number style="width: 200px" label="readonly" [(model)]="lockedB" [form]="form" readonly></sd-input-number>
          <sd-input-number style="width: 200px" label="viewed" [(model)]="lockedC" [form]="form" viewed></sd-input-number>
        </div>
      </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-chinh-sua-noi-tuyen') {
      <demo-section heading="Chỉnh sửa nội tuyến" [props]="[{ name: 'viewed', value: 'inline' }]" note="Input số trong suốt nhìn như text; focus để sửa, blur format lại (vd 12.345). Hover đậm nền.">
        <div style="width: 240px; font-size:13px; color:#555">
          Số lượng: <sd-input-number [viewed]="'inline'" [(model)]="lockedC" [form]="form"></sd-input-number>
        </div>
      </demo-section>
      }
    </demo-page>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InputNumberDemoComponent {
  form = new FormGroup({});
  formValid = new FormGroup({});
  formErr = new FormGroup({});
  formIcon = new FormGroup({});

  qty = signal<number | null>(1500);
  age = signal<number | null>(null);
  lockedA = signal<number | null>(12345);
  lockedB = signal<number | null>(9999);
  lockedC = signal<number | null>(42);

  // Error-state demo (inline)
  errRequired = signal<number | null>(null);
  errMin = signal<number | null>(5);
  errMax = signal<number | null>(500);
  errValidator = signal<number | null>(13);
  errInline = signal<number | null>(7);
  serverError = signal<string>('Số này đã tồn tại trong hệ thống');

  // Error-state demo (icon / hideInlineError) — pre-filled invalid so the clear button
  // also shows next to the error icon (demonstrates suffix ordering fix).
  iconMin = signal<number | null>(5);
  iconMax = signal<number | null>(500);
  iconValidator = signal<number | null>(13);

  // why: SdCustomValidator = (value) => string | Promise<string>. [validator] tạo async
  // validator (HandleSdCustomValidator) → cần đảm bảo event lan ra để message hiển thị.
  forbidThirteen = async (value: any): Promise<string> =>
    Number(value) === 13 ? 'Số 13 không được phép' : '';

  check() { this.formValid.markAllAsTouched(); }
  reset() { this.formValid.reset(); this.formValid.markAsUntouched(); }

  // why: "Đặt lại" KHÔNG dùng fg.reset() — reset() set control về null (rỗng) → min/max/validator
  // không bắt lỗi trên giá trị rỗng → bấm "Hiện lỗi" lần nữa không thấy lỗi (và ô số vẫn hiển thị
  // giá trị cũ vì inputControl hiển thị không nằm trong FormGroup). Gieo lại giá trị sai mẫu qua
  // [(model)] signal rồi markAsUntouched → demo lặp lại được.
  showErr() { this.formErr.markAllAsTouched(); }
  resetErr() {
    this.errRequired.set(null);
    this.errMin.set(5);
    this.errMax.set(500);
    this.errValidator.set(13);
    this.errInline.set(7);
    this.formErr.markAsUntouched();
  }
  showIcon() { this.formIcon.markAllAsTouched(); }
  resetIcon() {
    this.iconMin.set(5);
    this.iconMax.set(500);
    this.iconValidator.set(13);
    this.formIcon.markAsUntouched();
  }
}
