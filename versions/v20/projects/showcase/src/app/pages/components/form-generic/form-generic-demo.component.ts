import { ChangeDetectionStrategy, Component, signal, viewChild } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { DemoPageComponent, DemoSectionComponent } from '../../../shared/demo-page.component';
import { SdButton } from '@sdcorejs/angular/components/button';
import { SdFormBuilder, SdFormGeneric } from '@sdcorejs/angular/components/form-generic';

// Cấu hình form mẫu (đăng ký khách hàng) — phối hợp nhiều loại field + group.
const SEED: SdFormGeneric = {
  variables: [{ id: 'v1', key: 'currentUserId', label: 'Current user id' }],
  components: [
    {
      id: 'c1',
      key: 'customerEmail',
      type: 'textfield',
      label: 'Email khách hàng',
      helperText: 'Chỉ dùng cho thông báo tài khoản quan trọng.',
      layout: { columns: '12' },
      validate: { required: true },
      properties: {},
    },
    {
      id: 'c2',
      key: 'firstName',
      type: 'textfield',
      label: 'Tên',
      layout: { columns: '6' },
      validate: { required: true },
      properties: {},
    },
    {
      id: 'c3',
      key: 'lastName',
      type: 'textfield',
      label: 'Họ',
      layout: { columns: '6' },
      validate: { required: true },
      properties: {},
    },
    {
      id: 'c4',
      key: 'birthDate',
      type: 'datetime',
      subtype: 'date',
      label: 'Ngày sinh',
      layout: { columns: '6' },
      validate: {},
      properties: {},
    } as any,
    {
      id: 'c5',
      key: 'phone',
      type: 'textfield',
      label: 'Số điện thoại',
      layout: { columns: '6' },
      validate: {},
      properties: {},
    },
    {
      id: 'c6',
      key: 'plan',
      type: 'select',
      label: 'Gói dịch vụ',
      layout: { columns: '6' },
      validate: { required: true },
      values: [
        { value: 'free', label: 'Miễn phí' },
        { value: 'pro', label: 'Pro' },
        { value: 'enterprise', label: 'Doanh nghiệp' },
      ],
      properties: {},
    } as any,
    {
      id: 'c7',
      key: 'paymentMethod',
      type: 'radio',
      label: 'Phương thức thanh toán',
      layout: { columns: '6' },
      validate: {},
      values: [
        { value: 'card', label: 'Thẻ tín dụng' },
        { value: 'wire', label: 'Chuyển khoản' },
      ],
      properties: { direction: 'row' },
    } as any,
    {
      id: 'c8',
      key: 'notes',
      type: 'textarea',
      label: 'Ghi chú nội bộ',
      layout: { columns: '12' },
      validate: { maxlength: 500 },
      properties: {},
    },
    {
      id: 'c11',
      key: 'seats',
      type: 'number',
      label: 'Số lượng người dùng',
      layout: { columns: '4' },
      validate: { min: 1, max: 100 },
      properties: {},
    } as any,
    {
      id: 'c12',
      key: 'agreedToTerms',
      type: 'checkbox',
      label: 'Tôi đồng ý với điều khoản dịch vụ',
      layout: { columns: '8' },
      validate: { required: true },
      properties: {},
    } as any,
    {
      id: 'g1',
      type: 'group',
      label: 'Địa chỉ giao hàng',
      layout: { columns: '12' },
      properties: { icon: 'inventory_2', color: 'secondary' },
      components: [
        {
          id: 'g1c1',
          key: 'addressLine',
          type: 'textfield',
          label: 'Số nhà / Đường',
          layout: { columns: '12' },
          validate: { required: true },
          properties: {},
        } as any,
        {
          id: 'g1c2',
          key: 'city',
          type: 'textfield',
          label: 'Thành phố',
          layout: { columns: '6' },
          validate: {},
          properties: {},
        } as any,
        {
          id: 'g1c3',
          key: 'zipCode',
          type: 'textfield',
          label: 'Mã bưu chính',
          layout: { columns: '6' },
          validate: { pattern: '\\d{5}' },
          properties: {},
        } as any,
      ],
    } as any,
  ],
  validations: [],
};

@Component({
  selector: 'app-form-generic-demo',
  standalone: true,
  imports: [DemoPageComponent, DemoSectionComponent, SdFormBuilder, SdButton],
  template: `
    <demo-page
      title="Form Generic"
      description="Bộ dựng form động — kéo thả các field (textfield, number, select, checkbox, table…), nhóm thành group, xuất ra cấu hình JSON dùng cho form-render.">

      <demo-section heading="Trình dựng form đăng ký khách hàng">
        <div class="row-actions">
          <sd-button type="outline" color="primary" title="Đặt lại" prefixIcon="restart_alt" (click)="reset()"></sd-button>
          <sd-button type="outline" color="secondary" title="Tải form rỗng" prefixIcon="layers_clear" (click)="loadEmpty()"></sd-button>
          <sd-button type="fill" color="primary" title="Xuất JSON" prefixIcon="code" (click)="dumpJson()"></sd-button>
        </div>
        <div class="builder-box">
          <sd-form-builder [formGeneric]="seed()"></sd-form-builder>
        </div>
        @if (output()) {
          <pre class="json">{{ output() }}</pre>
        }
      </demo-section>
    </demo-page>
  `,
  styles: [`
    .row-actions {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
      margin-bottom: 12px;
      width: 100%;
    }
    .builder-box {
      width: 100%;
      min-height: 480px;
    }
    .json {
      width: 100%;
      max-height: 320px;
      overflow: auto;
      background: #f5f5f5;
      padding: 12px;
      border-radius: 6px;
      font-size: 12px;
      margin: 12px 0 0;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FormGenericDemoComponent {
  readonly builder = viewChild(SdFormBuilder);

  readonly seed = signal<SdFormGeneric>(structuredClone(SEED));
  readonly output = signal<string>('');
  readonly form = new FormGroup({});

  reset(): void {
    this.seed.set(structuredClone(SEED));
    this.output.set('');
  }

  loadEmpty(): void {
    this.seed.set({ components: [], variables: [], validations: [] });
    this.output.set('');
  }

  dumpJson(): void {
    const b = this.builder();
    if (!b) return;
    this.output.set(JSON.stringify(b.getForm(), null, 2));
  }
}

