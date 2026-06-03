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
    <demo-page title="Autocomplete" description="sd-autocomplete – gõ để lọc, chọn 1 giá trị. Hỗ trợ cache, addable (thêm mới giá trị), required, disabled.">
      <demo-section [props]="[{ name: '[(model)]' }]" note="Gõ vài ký tự để lọc danh sách.">
        <div style="width: 320px; display:flex; flex-direction:column; gap:12px">
          <sd-autocomplete [items]="countries" valueField="code" displayField="name"
            label="Quốc tịch" placeholder="Gõ để tìm..."
            [(model)]="country" [form]="form"></sd-autocomplete>
          <div style="font-size:12px; color:#555">Mã đã chọn: <b>{{ country() ?? '(trống)' }}</b></div>
        </div>
      </demo-section>

      <demo-section [props]="[{ name: 'required' }]" note="Bỏ trống và bấm Kiểm tra để xem lỗi inline.">
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

      <demo-section [props]="[{ name: 'addable' }]" note="Cho phép thêm giá trị không có trong danh sách.">
        <div style="width: 320px">
          <sd-autocomplete [items]="countries" valueField="code" displayField="name"
            label="addable" placeholder="Gõ và Enter để thêm..."
            [(model)]="tag" [form]="form" addable></sd-autocomplete>
        </div>
      </demo-section>

      <demo-section [props]="[{ name: 'disabled' }, { name: 'viewed' }]" note="Khoá tương tác.">
        <div style="display:flex; gap:16px; flex-wrap:wrap; width:100%">
          <sd-autocomplete style="width: 240px" [items]="countries" valueField="code" displayField="name"
            label="disabled" [(model)]="lockedA" [form]="form" disabled></sd-autocomplete>
          <sd-autocomplete style="width: 240px" [items]="countries" valueField="code" displayField="name"
            label="viewed" [(model)]="lockedB" [form]="form" viewed></sd-autocomplete>
        </div>
      </demo-section>

      <demo-section [props]="[{ name: 'viewed', value: 'inline' }]" note="Bấm vào để mở panel gõ/lọc; text giữ nguyên tới khi chọn. Hover hiện × để xoá.">
        <div style="width: 280px; font-size:13px; color:#555">
          Quốc tịch:
          <sd-autocomplete [items]="countries" valueField="code" displayField="name"
            [viewed]="'inline'" [(model)]="lockedB" [form]="form"></sd-autocomplete>
        </div>
      </demo-section>
    </demo-page>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AutocompleteDemoComponent {
  form = new FormGroup({});
  formValid = new FormGroup({});

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

  check() { this.formValid.markAllAsTouched(); }
  reset() { this.formValid.reset(); this.formValid.markAsUntouched(); }
}
