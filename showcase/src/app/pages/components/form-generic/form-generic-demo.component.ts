import { JsonPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, signal, viewChild } from '@angular/core';
import { SdButton } from '@sdcorejs/angular/components/button';
import {
  SdFormBuilder,
  SdFormRender,
  type SdFormGenericField,
  type SdFormGenericPageElement,
  type SdFormGenericSchema,
} from '@sdcorejs/angular/components/form-generic';
import { DemoPageComponent, DemoSectionComponent } from '../../../shared/demo-page.component';

const SEED: SdFormGenericSchema = {
  variables: [{ key: 'currentUserId', label: 'Current user id' }],
  pages: [
    {
      id: 'main',
      elements: [
        {
          id: 'g-personal',
          type: 'group',
          label: 'Thông tin cá nhân',
          icon: 'person',
          color: 'primary',
          collapsible: true,
          elements: [
            {
              id: 'c-fullName',
              key: 'fullName',
              type: 'textfield',
              subtype: 'text',
              label: 'Họ và tên',
              placeholder: 'Nhập họ và tên',
              layout: { span: { desktop: 6 } },
              validation: { required: true, maxLength: 120 },
            },
            {
              id: 'c-email',
              key: 'email',
              type: 'textfield',
              subtype: 'email',
              label: 'Email',
              placeholder: 'name@example.com',
              helperText: 'Nhập địa chỉ email hợp lệ, ví dụ: name@domain.com',
              layout: { span: { desktop: 6 } },
              validation: { required: true },
            },
            {
              id: 'c-phone',
              key: 'phone',
              type: 'textfield',
              subtype: 'phone',
              label: 'Số điện thoại',
              placeholder: 'VD: 0912 345 678',
              helperText: 'Giữ nguyên số 0 đầu và dấu +',
              layout: { span: { desktop: 4, tablet: 6, mobile: 6 } },
            },
            {
              id: 'c-birthDate',
              key: 'birthDate',
              type: 'datetime',
              subtype: 'date',
              label: 'Ngày sinh',
              placeholder: 'Chọn ngày sinh',
              layout: { span: { desktop: 4, tablet: 6, mobile: 6 } },
              validation: { max: 'today' },
            },
            {
              id: 'c-gender',
              key: 'gender',
              type: 'radio',
              label: 'Giới tính',
              direction: 'row',
              layout: { span: { desktop: 4, tablet: 12 } },
              options: {
                source: 'static',
                items: [
                  { value: 'male', label: 'Nam' },
                  { value: 'female', label: 'Nữ' },
                  { value: 'other', label: 'Khác' },
                ],
              },
            },
          ],
        },
        {
          id: 'g-address',
          type: 'group',
          label: 'Địa chỉ',
          icon: 'home',
          color: 'primary',
          elements: [
            {
              id: 'c-city',
              key: 'city',
              type: 'select',
              label: 'Tỉnh/Thành phố',
              placeholder: 'Chọn tỉnh/thành phố',
              layout: { span: { desktop: 6 } },
              validation: { required: true },
              options: {
                source: 'static',
                items: [
                  { value: 'hn', label: 'Hà Nội' },
                  { value: 'hcm', label: 'TP. Hồ Chí Minh' },
                  { value: 'dn', label: 'Đà Nẵng' },
                ],
              },
            },
            {
              id: 'c-website',
              key: 'website',
              type: 'textfield',
              subtype: 'url',
              label: 'Website',
              placeholder: 'https://',
              layout: { span: { desktop: 6 } },
            },
            {
              id: 'c-address',
              key: 'addressLine',
              type: 'textarea',
              label: 'Địa chỉ chi tiết',
              placeholder: 'Nhập địa chỉ chi tiết…',
              validation: { maxLength: 300 },
            },
          ],
        },
        {
          id: 'c-budget',
          key: 'budget',
          type: 'number',
          subtype: 'currency',
          label: 'Ngân sách dự kiến',
          layout: { span: { desktop: 4, tablet: 6 } },
          validation: { min: 0 },
          currency: 'VND',
          precision: 0,
        },
        {
          id: 'c-discount',
          key: 'discount',
          type: 'number',
          subtype: 'percent',
          label: 'Chiết khấu',
          helperText: 'Nhập 10 nghĩa là 10%',
          layout: { span: { desktop: 4, tablet: 6 } },
          validation: { min: 0, max: 100 },
          precision: 2,
        },
        {
          id: 'c-agree',
          key: 'agreedToTerms',
          type: 'checkbox',
          label: 'Tôi đồng ý với điều khoản sử dụng',
          // why: luôn mở hàng mới dù hàng trên còn 4 cột ở desktop — thay cho phần tử ngắt dòng cũ.
          layout: { newRow: true },
        },
        {
          id: 'c-note',
          key: 'note',
          type: 'textarea',
          label: 'Ghi chú nội bộ',
          rules: {
            visible: { field: 'agreedToTerms', operator: 'EQUAL', data: true },
            required: { field: 'budget', operator: 'GREATER_THAN', data: 100000000 },
          },
        },
      ],
    },
  ],
};

/** Form lớn để đo hiệu năng canvas/preview (field thường + group + control nặng). */
const buildLargeForm = (fields: number): SdFormGenericSchema => {
  const elements: SdFormGenericPageElement[] = [];
  const kinds = ['text', 'email', 'phone', 'number', 'select', 'datetime', 'textarea', 'checkbox'] as const;
  let index = 0;
  while (index < fields) {
    const children: SdFormGenericField[] = [];
    for (let child = 0; child < 10 && index < fields; child += 1, index += 1) {
      const kind = kinds[index % kinds.length];
      const base = { id: `f${index}`, key: `field_${index}`, label: `Trường ${index + 1}`, layout: { span: { desktop: 6 } } };
      if (kind === 'number') children.push({ ...base, type: 'number', subtype: 'decimal' });
      else if (kind === 'select')
        children.push({
          ...base,
          type: 'select',
          options: {
            source: 'static',
            items: [
              { value: 'a', label: 'A' },
              { value: 'b', label: 'B' },
            ],
          },
        });
      else if (kind === 'datetime') children.push({ ...base, type: 'datetime', subtype: 'date' });
      else if (kind === 'textarea') children.push({ ...base, type: 'textarea' });
      else if (kind === 'checkbox') children.push({ ...base, type: 'checkbox' });
      else children.push({ ...base, type: 'textfield', subtype: kind });
    }
    elements.push({ id: `g${index}`, type: 'group', label: `Nhóm ${elements.length + 1}`, icon: 'category', color: 'primary', elements: children });
  }
  return { pages: [{ id: 'main', elements }] };
};

const EMPTY: SdFormGenericSchema = { pages: [{ id: 'main', elements: [] }] };

/** Bề rộng thử của vùng render — renderer chọn mức theo bề rộng FORM, không theo màn hình. */
const PREVIEW_WIDTHS = [null, 1100, 800, 480] as const;

@Component({
  selector: 'app-form-generic-demo',
  standalone: true,
  imports: [JsonPipe, DemoPageComponent, DemoSectionComponent, SdFormBuilder, SdFormRender, SdButton],
  template: `
    <demo-page #demoPage
      title="Form Generic"
      description="Form builder nhúng (Desktop | Tablet | Mobile, span theo mức, bắt đầu hàng mới, điều kiện Filter, preset Email/SĐT/Tiền tệ…, kéo-thả, undo/redo) và renderer dùng chung schema SdFormGenericSchema.">
      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-builder-render') {
      <demo-section heading="Builder + Render"
        [props]="[{ name: '[(schema)]', value: 'SdFormGenericSchema' }, { name: '[(value)]', value: 'Record<string, unknown>' }]"
        note="Lưu/nháp/xuất bản thuộc về consumer — builder chỉ phát (schemaChange). Nút bên dưới là của trang demo.">
        <div class="row-actions">
          <sd-button type="outline" color="primary" title="Form mẫu" prefixIcon="restart_alt" (click)="load(seedForm())"></sd-button>
          <sd-button type="outline" color="secondary" title="Form rỗng" prefixIcon="layers_clear" (click)="load(emptyForm())"></sd-button>
          <sd-button type="outline" color="secondary" title="Form 100 trường" prefixIcon="speed" (click)="load(large(100))"></sd-button>
          <sd-button type="outline" color="secondary" title="Form 300 trường" prefixIcon="speed" (click)="load(large(300))"></sd-button>
          <span class="row-actions__meta">Thay đổi: {{ changes() }}</span>
        </div>

        <div class="builder-box">
          <sd-form-builder [(schema)]="schema" (schemaChange)="onChange()"></sd-form-builder>
        </div>

        <div class="render-preview">
          <div class="render-preview__head">
            <span class="render-preview__title">Runtime render từ [(schema)] · mức {{ renderer.level() }}</span>
            <span class="render-preview__widths">
              @for (width of widths; track $index) {
                <sd-button
                  size="sm"
                  [type]="previewWidth() === width ? 'fill' : 'outline'"
                  color="secondary"
                  [title]="width ? width + 'px' : 'Tự do'"
                  (click)="previewWidth.set(width)"></sd-button>
              }
              <sd-button size="sm" type="fill" color="primary" title="Kiểm tra" prefixIcon="task_alt" (click)="check()"></sd-button>
            </span>
          </div>
          <div class="render-preview__frame" [style.max-width.px]="previewWidth()">
            <sd-form-render #renderer [schema]="schema() ?? emptySchema" [(value)]="value" [variables]="variables"></sd-form-render>
          </div>
          @if (result(); as _result) {
            <p class="render-preview__result">{{ _result }}</p>
          }
          <pre class="render-preview__value">{{ value() | json }}</pre>
        </div>
      </demo-section>
      }
    </demo-page>
  `,
  styles: [
    `
      .row-actions {
        display: flex;
        gap: 8px;
        flex-wrap: wrap;
        align-items: center;
        margin-bottom: 12px;
        width: 100%;
      }
      .row-actions__meta {
        margin-left: auto;
        font-size: 12px;
        color: var(--sd-text-secondary);
      }
      .builder-box {
        width: 100%;
        height: 780px;
      }
      .render-preview {
        width: 100%;
        margin-top: 16px;
        padding-top: 12px;
        border-top: 1px solid var(--sd-border);
      }
      .render-preview__head {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        justify-content: space-between;
        gap: 8px;
        margin-bottom: 8px;
      }
      .render-preview__title {
        font-size: 13px;
        font-weight: 600;
      }
      .render-preview__widths {
        display: inline-flex;
        flex-wrap: wrap;
        gap: 6px;
      }
      .render-preview__frame {
        border: 1px dashed var(--sd-border-strong);
        border-radius: 8px;
      }
      .render-preview__result {
        margin: 8px 0 0;
        font-size: 13px;
      }
      .render-preview__value {
        max-height: 200px;
        overflow: auto;
        margin: 8px 0 0;
        padding: 8px;
        border-radius: 6px;
        background: var(--sd-surface-muted);
        font-size: 12px;
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FormGenericDemoComponent {
  readonly render = viewChild(SdFormRender);
  readonly schema = signal<SdFormGenericSchema | undefined>(structuredClone(SEED));
  readonly value = signal<Record<string, unknown>>({});
  readonly variables = { currentUserId: 'u-001' };
  readonly changes = signal(0);
  readonly widths = PREVIEW_WIDTHS;
  readonly emptySchema = EMPTY;
  readonly previewWidth = signal<number | null>(null);
  readonly result = signal('');

  seedForm = (): SdFormGenericSchema => structuredClone(SEED);
  emptyForm = (): SdFormGenericSchema => structuredClone(EMPTY);
  large = (fields: number): SdFormGenericSchema => buildLargeForm(fields);

  load(schema: SdFormGenericSchema): void {
    this.schema.set(schema);
    this.value.set({});
    this.result.set('');
    this.changes.set(0);
  }

  onChange(): void {
    this.changes.update(value => value + 1);
  }

  async check(): Promise<void> {
    const outcome = await this.render()?.validate();
    if (!outcome) return;
    const { error, warning } = outcome.messages;
    this.result.set(outcome.valid ? `Hợp lệ${warning.length ? ` · ${warning.join('; ')}` : ''}` : `Chưa hợp lệ${error.length ? `: ${error.join('; ')}` : ''}`);
  }
}
