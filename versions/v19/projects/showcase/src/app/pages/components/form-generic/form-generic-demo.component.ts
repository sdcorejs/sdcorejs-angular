import { ChangeDetectionStrategy, Component, computed, signal, viewChild } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { SdButton } from '@sdcorejs/angular/components/button';
import { SdFormBuilder, SdFormGeneric, SdFormRender } from '@sdcorejs/angular/components/form-generic';
import { DemoPageComponent, DemoSectionComponent } from '../../../shared/demo-page.component';

const SEED: SdFormGeneric = {
  variables: [{ id: 'v1', key: 'currentUserId', label: 'Current user id' }],
  components: [
    {
      id: 'c1',
      key: 'customerEmail',
      type: 'textfield',
      label: 'Email khách hàng',
      helperText: 'Dùng cho thông báo tài khoản quan trọng.',
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
      layout: { columns: '4' },
      validate: {},
      properties: {},
    } as any,
    {
      id: 'c5',
      key: 'seats',
      type: 'number',
      label: 'Số người dùng',
      layout: { columns: '4' },
      validate: { min: 1, max: 100 },
      properties: {},
    } as any,
    {
      id: 'c6',
      key: 'agreedToTerms',
      type: 'checkbox',
      label: 'Đồng ý điều khoản',
      layout: { columns: '4' },
      validate: { required: true },
      properties: {},
    } as any,
    {
      id: 'c7',
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
      id: 'c8',
      key: 'paymentMethod',
      type: 'radio',
      label: 'Phương thức thanh toán',
      layout: { columns: '6' },
      validate: {},
      values: [
        { value: 'card', label: 'Thẻ' },
        { value: 'wire', label: 'Chuyển khoản' },
      ],
      properties: { direction: 'row' },
    } as any,
    {
      id: 'c9',
      key: 'tags',
      type: 'chip-string',
      label: 'Nhãn nội bộ',
      layout: { columns: '6' },
      validate: { maxOfItems: 5 },
      properties: {},
    } as any,
    {
      id: 'c10',
      key: 'busyDates',
      type: 'chip-calendar',
      label: 'Ngày bận',
      layout: { columns: '6' },
      validate: {},
      properties: {},
    } as any,
    {
      id: 'c11',
      key: 'notes',
      type: 'textarea',
      label: 'Ghi chú nội bộ',
      layout: { columns: '12' },
      validate: { maxlength: 500 },
      properties: {},
    },
    {
      id: 'c12',
      key: 'summaryHtml',
      type: 'html',
      label: 'HTML tóm tắt',
      content: '<strong>Thông tin hồ sơ</strong><br/>Có thể kéo thả, đổi vị trí và render lại an toàn.',
      layout: { columns: '12' },
      validate: {},
      properties: {},
    } as any,
    {
      id: 'c13',
      key: 'lineItems',
      type: 'table',
      label: 'Dòng chi phí',
      layout: { columns: '12' },
      validate: {},
      columns: [
        { key: 'name', label: 'Tên', type: 'string' },
        { key: 'quantity', label: 'Số lượng', type: 'number' },
        { key: 'billable', label: 'Tính phí', type: 'boolean', displayOnTrue: 'Có', displayOnFalse: 'Không' },
      ],
      properties: { type: 'inline', titleButtonCreate: 'Thêm dòng' },
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
  imports: [DemoPageComponent, DemoSectionComponent, SdFormBuilder, SdFormRender, SdButton],
  template: `
    <demo-page
      title="Form Generic"
      description="Dynamic form builder and renderer with schema-safe drag/drop, group detail editing, query-builder conditions, and runtime preview.">
      <demo-section heading="Builder + Render" [props]="[{ name: 'formGeneric', value: 'SdFormGeneric' }]">
        <div class="row-actions">
          <sd-button type="outline" color="primary" title="Đặt lại" prefixIcon="restart_alt" (click)="reset()"></sd-button>
          <sd-button type="outline" color="secondary" title="Tải form rỗng" prefixIcon="layers_clear" (click)="loadEmpty()"></sd-button>
          <sd-button type="fill" color="primary" title="Cập nhật preview" prefixIcon="visibility" (click)="refreshPreview()"></sd-button>
          <sd-button type="outline" color="primary" title="Xuất JSON" prefixIcon="code" (click)="dumpJson()"></sd-button>
        </div>

        <div class="builder-box">
          <sd-form-builder [formGeneric]="seed()"></sd-form-builder>
        </div>

        <div class="render-preview">
          <div class="render-preview__title">Runtime render từ schema hiện tại</div>
          <sd-form-render [configuration]="previewConfig()" [form]="form" [entity]="entity()"></sd-form-render>
        </div>

        @if (output()) {
          <pre class="json">{{ output() }}</pre>
        }
      </demo-section>
    </demo-page>
  `,
  styles: [
    `
      .row-actions {
        display: flex;
        gap: 8px;
        flex-wrap: wrap;
        margin-bottom: 12px;
        width: 100%;
      }
      .builder-box {
        width: 100%;
        min-height: 560px;
      }
      .render-preview {
        width: 100%;
        margin-top: 16px;
        padding-top: 12px;
        border-top: 1px solid #e0e0e0;
      }
      .render-preview__title {
        font-size: 13px;
        font-weight: 600;
        margin-bottom: 8px;
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
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FormGenericDemoComponent {
  readonly builder = viewChild(SdFormBuilder);
  readonly seed = signal<SdFormGeneric>(structuredClone(SEED));
  readonly preview = signal<SdFormGeneric>(structuredClone(SEED));
  readonly output = signal<string>('');
  readonly form = new FormGroup({});
  readonly entity = signal<Record<string, any>>({
    customerEmail: 'customer@example.com',
    firstName: 'An',
    lastName: 'Nguyễn',
    birthDate: '1994-06-25',
    seats: 12,
    agreedToTerms: true,
    plan: 'pro',
    paymentMethod: 'card',
    tags: ['priority', 'enterprise'],
    busyDates: ['2026-06-25'],
    notes: 'Khách hàng cần onboarding nhanh.',
    addressLine: '12 Lý Tự Trọng',
    city: 'TP. Hồ Chí Minh',
    zipCode: '70000',
    lineItems: [
      { name: 'Implementation', quantity: 1, billable: true },
      { name: 'Training', quantity: 2, billable: true },
    ],
  });

  readonly previewConfig = computed(() => ({
    components: this.preview().components,
    variables: this.preview().variables,
    validations: this.preview().validations,
  }));

  reset(): void {
    const fresh = structuredClone(SEED);
    this.seed.set(fresh);
    this.preview.set(structuredClone(fresh));
    this.output.set('');
  }

  loadEmpty(): void {
    const empty = { components: [], variables: [], validations: [] };
    this.seed.set(empty);
    this.preview.set(structuredClone(empty));
    this.output.set('');
  }

  refreshPreview(): void {
    const b = this.builder();
    if (!b) return;
    const form = b.getForm();
    this.preview.set(form);
  }

  dumpJson(): void {
    const b = this.builder();
    if (!b) return;
    const form = b.getForm();
    this.preview.set(form);
    this.output.set(JSON.stringify(form, null, 2));
  }
}
