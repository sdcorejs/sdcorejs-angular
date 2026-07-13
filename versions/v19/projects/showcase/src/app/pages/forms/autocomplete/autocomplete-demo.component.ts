import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { DemoPageComponent, DemoSectionComponent } from '../../../shared/demo-page.component';
import { SdAutocomplete } from '@sdcorejs/angular/forms/autocomplete';

interface Country { code: string; name: string; }

@Component({
  selector: 'app-autocomplete-demo',
  standalone: true,
  imports: [DemoPageComponent, DemoSectionComponent, FormsModule, ReactiveFormsModule, SdAutocomplete],
  template: `
    <demo-page #demoPage title="Autocomplete" description="sd-autocomplete – gõ để lọc, chọn 1 giá trị. Hỗ trợ cache, addable (thêm mới giá trị), required, disabled.">
      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-co-ban') {
      <demo-section heading="Cơ bản" [props]="[{ name: '[(model)]', value: 'two-way' }]" note="Gõ vài ký tự để lọc danh sách.">
        <div style="width: 320px; display:flex; flex-direction:column; gap:12px">
          <sd-autocomplete [items]="countries" valueField="code" displayField="name"
            label="Quốc tịch" placeholder="Gõ để tìm..."
            [(model)]="country" [form]="form"></sd-autocomplete>
          <div style="font-size:12px; color:#555">Mã đã chọn: <b>{{ country() ?? '(trống)' }}</b></div>
        </div>
      </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-validator') {
      <demo-section heading="Validator" [props]="[{ name: 'required', value: 'true' }]" note="Bỏ trống và bấm Kiểm tra để xem lỗi inline.">
        <div style="width: 320px; display:flex; flex-direction:column; gap:12px">
          <sd-autocomplete [items]="countries" valueField="code" displayField="name"
            label="required"
            [(model)]="countryR" [form]="formValid" required></sd-autocomplete>
          <div style="display:flex; gap:8px">
            <button type="button" (click)="check()">Kiểm tra</button>
            <button type="button" (click)="reset()">Đặt lại</button>
          </div>
        </div>
      </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-them-moi') {
      <demo-section heading="Thêm mới" [props]="[{ name: 'addable', value: 'true' }]" note="Cho phép thêm giá trị không có trong danh sách.">
        <div style="width: 320px">
          <sd-autocomplete [items]="countries" valueField="code" displayField="name"
            label="addable" placeholder="Gõ và Enter để thêm..."
            [(model)]="tag" [form]="form" addable></sd-autocomplete>
        </div>
      </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-cac-trang-thai-bao-loi') {
      <demo-section
        heading="Các trạng thái báo lỗi"
        [props]="[{ name: 'required', value: 'true' }, { name: '[validator]', value: 'fn' }, { name: 'inlineError', value: 'text' }]"
        note="Bấm Hiện lỗi để mark touched. Ô [validator] cấm chọn 'Hoa Kỳ' — chọn Hoa Kỳ để thấy message (đây là lỗi đã sửa: [validator] bất đồng bộ trước kia không hiện được message). Đặt lại gieo lại giá trị mẫu để demo lặp được.">
        <div style="width: 340px; display:flex; flex-direction:column; gap:12px">
          <sd-autocomplete [items]="countries" valueField="code" displayField="name"
            label="required (để trống)" [(model)]="errRequired" [form]="formErr" required></sd-autocomplete>
          <sd-autocomplete [items]="countries" valueField="code" displayField="name"
            label="[validator] (cấm Hoa Kỳ)" [(model)]="errValidator" [form]="formErr" [validator]="forbidUS"></sd-autocomplete>
          <sd-autocomplete [items]="countries" valueField="code" displayField="name"
            label="inlineError (lỗi do cha truyền)" [(model)]="errInline" [form]="formErr" [inlineError]="serverError()"></sd-autocomplete>
          <div style="display:flex; gap:8px">
            <button type="button" (click)="showErr()">Hiện lỗi</button>
            <button type="button" (click)="resetErr()">Đặt lại</button>
          </div>
        </div>
      </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-trang-thai') {
      <demo-section heading="Trạng thái" [props]="[{ name: 'disabled', value: 'true' }, { name: 'viewed', value: 'true' }]" note="Khoá tương tác.">
        <div style="display:flex; gap:16px; flex-wrap:wrap; width:100%">
          <sd-autocomplete style="width: 240px" [items]="countries" valueField="code" displayField="name"
            label="disabled" [(model)]="lockedA" [form]="form" disabled></sd-autocomplete>
          <sd-autocomplete style="width: 240px" [items]="countries" valueField="code" displayField="name"
            label="viewed" [(model)]="lockedB" [form]="form" viewed></sd-autocomplete>
        </div>
      </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-chinh-sua-noi-tuyen') {
      <demo-section heading="Chỉnh sửa nội tuyến" [props]="[{ name: 'viewed', value: 'inline' }]" note="Bấm vào để mở panel gõ/lọc; text giữ nguyên tới khi chọn. Hover hiện × để xoá.">
        <div style="width: 280px; font-size:13px; color:#555">
          Quốc tịch:
          <sd-autocomplete [items]="countries" valueField="code" displayField="name"
            [viewed]="'inline'" [(model)]="lockedB" [form]="form"></sd-autocomplete>
        </div>
      </demo-section>
      }
    </demo-page>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AutocompleteDemoComponent {
  form = new FormGroup({});
  formValid = new FormGroup({});
  formErr = new FormGroup({});

  countries: Country[] = [
    { code: 'VN', name: 'Việt Nam' },
    { code: 'US', name: 'Hoa Kỳ' },
    { code: 'JP', name: 'Nhật Bản' },
    { code: 'KR', name: 'Hàn Quốc' },
    { code: 'SG', name: 'Singapore' },
    { code: 'TH', name: 'Thái Lan' },
  ];

  country = signal<string | null>(null);
  countryR = signal<string | null>(null);
  tag = signal<string | null>(null);
  lockedA = signal<string | null>('VN');
  lockedB = signal<string | null>('JP');

  // Error-state demo
  errRequired = signal<string | null>(null);
  errValidator = signal<string | null>('US'); // 'US' bị validator chặn
  errInline = signal<string | null>('VN');
  serverError = signal<string>('Quốc gia này đã được đăng ký');

  // why: SdCustomValidator = (value) => string | Promise<string>. async để minh hoạ validator
  // bất đồng bộ ([validator] gắn async validator → message phải hiện được sau khi resolve).
  forbidUS = async (value: any): Promise<string> =>
    value === 'US' ? 'Tạm thời không hỗ trợ Hoa Kỳ' : '';

  check() { this.formValid.markAllAsTouched(); }
  reset() { this.formValid.reset(); this.formValid.markAsUntouched(); }

  showErr() { this.formErr.markAllAsTouched(); }
  // why: gieo lại giá trị mẫu (không fg.reset → reset() set null làm [validator] hết lỗi) để demo lặp được.
  resetErr() {
    this.errRequired.set(null);
    this.errValidator.set('US');
    this.errInline.set('VN');
    this.formErr.markAsUntouched();
  }
}
