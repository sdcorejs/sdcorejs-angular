import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { SdButton } from '@sdcorejs/angular/components/button';
import { SdTable, type SdTableOption } from '@sdcorejs/angular/components/table';
import { SdInput } from '@sdcorejs/angular/forms/input';
import { SdRadio } from '@sdcorejs/angular/forms/radio';
import { SdSelect } from '@sdcorejs/angular/forms/select';
import { SD_ICON_CONFIGURATION, resolveSdIconConfig, SdIcon, type SdIconFontSet } from '@sdcorejs/angular/modules/icon';
import { DemoPageComponent, DemoSectionComponent } from '../../../shared/demo-page.component';

interface FontSetOption {
  value: SdIconFontSet;
  display: string;
}

interface DepartmentOption {
  value: string;
  display: string;
}

interface ProductRow {
  code: string;
  name: string;
  category: string;
  stock: number;
}

const FONT_SET_OPTIONS: FontSetOption[] = [
  { value: 'material-icons', display: 'Material filled' },
  { value: 'material-icons-outlined', display: 'Material outlined' },
  { value: 'lucide', display: 'Lucide' },
];

const DEPARTMENT_OPTIONS: DepartmentOption[] = [
  { value: 'OPS', display: 'Operations' },
  { value: 'SALE', display: 'Sales' },
  { value: 'CS', display: 'Customer success' },
];

const PRODUCTS: ProductRow[] = [
  { code: 'SKU-001', name: 'Warehouse scanner', category: 'Hardware', stock: 12 },
  { code: 'SKU-002', name: 'Packing label', category: 'Supply', stock: 4 },
  { code: 'SKU-003', name: 'Delivery tablet', category: 'Hardware', stock: 8 },
];

@Component({
  selector: 'app-icon-configuration-preview',
  standalone: true,
  imports: [FormsModule, ReactiveFormsModule, SdButton, SdIcon, SdInput, SdSelect, SdTable],
  template: `
    <div class="icon-config-preview">
      <section class="icon-config-preview__block">
        <h3>Primitive icons</h3>
        <div class="icon-config-row">
          <span class="icon-config-token"><sd-icon name="add" size="lg"></sd-icon><span>add</span></span>
          <span class="icon-config-token"><sd-icon name="visibility" size="lg"></sd-icon><span>visibility</span></span>
          <span class="icon-config-token"><sd-icon name="delete" size="lg"></sd-icon><span>delete</span></span>
          <span class="icon-config-token"><sd-icon name="keyboard_arrow_down" size="lg"></sd-icon><span>arrow</span></span>
        </div>
        <div class="icon-config-row">
          <sd-button type="fill" color="primary" prefixIcon="add" title="Create"></sd-button>
          <sd-button type="light" color="secondary" suffixIcon="more_vert" title="More"></sd-button>
        </div>
      </section>

      <section class="icon-config-preview__block">
        <h3>Input and dropdown</h3>
        <div class="icon-config-form">
          <sd-input
            label="Search keyword"
            helperText="The helper, clear, and error icons use default fontSet"
            [(model)]="keyword"
            [form]="form"
            hideInlineError>
          </sd-input>
          <sd-select
            [items]="departments"
            valueField="value"
            displayField="display"
            label="Department"
            helperText="Open the dropdown to compare the suffix/search icons"
            [(model)]="department"
            [form]="form">
          </sd-select>
        </div>
      </section>

      <section class="icon-config-preview__block icon-config-preview__block--wide">
        <h3>Table</h3>
        <sd-table [option]="tableOption"></sd-table>
      </section>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      width: 100%;
    }

    .icon-config-preview {
      display: grid;
      grid-template-columns: minmax(240px, 1fr) minmax(280px, 1fr);
      gap: 16px;
      width: 100%;
      align-items: start;
    }

    .icon-config-preview__block {
      min-width: 0;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .icon-config-preview__block--wide {
      grid-column: 1 / -1;
    }

    .icon-config-preview h3 {
      margin: 0;
      color: #1f2937;
      font-size: 14px;
      font-weight: 600;
    }

    .icon-config-row {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
      align-items: center;
    }

    .icon-config-token {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      min-width: 124px;
      padding: 8px 10px;
      border: 1px solid #e5e7eb;
      border-radius: 6px;
      color: #1f2937;
      font-size: 13px;
    }

    .icon-config-form {
      width: min(100%, 360px);
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    @media (max-width: 820px) {
      .icon-config-preview {
        grid-template-columns: 1fr;
      }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IconConfigurationPreviewComponent {
  readonly form = new FormGroup({});
  readonly keyword = signal<string | null>('scanner');
  readonly department = signal<string | null>('OPS');
  readonly departments = DEPARTMENT_OPTIONS;

  readonly tableOption: SdTableOption<ProductRow> = {
    type: 'local',
    key: 'showcase-icon-configuration-table',
    items: () => PRODUCTS,
    index: { enabled: true },
    rowReorder: { enabled: true },
    export: { visible: 'ALL' },
    filter: { hideInlineFilter: false },
    command: {
      align: 'right',
      commands: [
        { icon: 'visibility', title: 'View', click: row => alert(`View ${row.code}`) },
        { icon: 'edit', title: 'Edit', click: row => alert(`Edit ${row.code}`) },
        { icon: 'delete', title: 'Delete', color: 'error', click: row => alert(`Delete ${row.code}`) },
      ],
    },
    columns: [
      { field: 'code', type: 'string', title: 'Code', width: '130px', filter: { default: '' } },
      { field: 'name', type: 'string', title: 'Product', width: '260px', filter: { default: '' } },
      { field: 'category', type: 'string', title: 'Category', width: '150px' },
      { field: 'stock', type: 'number', title: 'Stock', width: '120px', align: 'right' },
    ],
    style: { shadow: true, maxHeight: '320px' },
  };
}

@Component({
  selector: 'app-icon-configuration-preview-material-filled',
  standalone: true,
  imports: [IconConfigurationPreviewComponent],
  providers: [{ provide: SD_ICON_CONFIGURATION, useValue: resolveSdIconConfig({ defaultFontSet: 'material-icons' }) }],
  template: `<app-icon-configuration-preview></app-icon-configuration-preview>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IconConfigurationPreviewMaterialFilledComponent {}

@Component({
  selector: 'app-icon-configuration-preview-material-outlined',
  standalone: true,
  imports: [IconConfigurationPreviewComponent],
  providers: [{ provide: SD_ICON_CONFIGURATION, useValue: resolveSdIconConfig({ defaultFontSet: 'material-icons-outlined' }) }],
  template: `<app-icon-configuration-preview></app-icon-configuration-preview>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IconConfigurationPreviewMaterialOutlinedComponent {}

@Component({
  selector: 'app-icon-configuration-preview-lucide',
  standalone: true,
  imports: [IconConfigurationPreviewComponent],
  providers: [{ provide: SD_ICON_CONFIGURATION, useValue: resolveSdIconConfig({ defaultFontSet: 'lucide' }) }],
  template: `<app-icon-configuration-preview></app-icon-configuration-preview>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IconConfigurationPreviewLucideComponent {}

@Component({
  selector: 'app-icon-configuration-demo',
  standalone: true,
  imports: [
    DemoPageComponent,
    DemoSectionComponent,
    FormsModule,
    ReactiveFormsModule,
    SdRadio,
    IconConfigurationPreviewMaterialFilledComponent,
    IconConfigurationPreviewMaterialOutlinedComponent,
    IconConfigurationPreviewLucideComponent,
  ],
  template: `
    <demo-page
      title="Icon Configuration"
      description="Switch defaultFontSet in SdIcon configuration and compare how Core UI icons render in table, input, and dropdown controls.">
      <demo-section
        heading="Configuration"
        [props]="[{ name: 'provideSdIcon', value: 'defaultFontSet: ' + selectedFontSet() }]"
        note="Controls below do not pass fontSet directly; they inherit the value from SD_ICON_CONFIGURATION.">
        <div class="icon-config-toolbar">
          <sd-radio
            label="defaultFontSet"
            [items]="fontSetOptions"
            valueField="value"
            displayField="display"
            [(model)]="selectedFontSet"
            [form]="form">
          </sd-radio>

          <code class="icon-config-snippet">provideSdIcon(&#123; defaultFontSet: '{{ selectedFontSet() }}' &#125;)</code>
        </div>
      </demo-section>

      <demo-section
        heading="Core UI preview"
        [props]="[{ name: 'defaultFontSet', value: selectedFontSet() }]"
        note="Change the radio and compare primitive icons, SdInput helper/clear icons, SdSelect suffix/search icons, and SdTable command/export/reorder icons.">
        @switch (selectedFontSet()) {
          @case ('material-icons') {
            <app-icon-configuration-preview-material-filled></app-icon-configuration-preview-material-filled>
          }
          @case ('lucide') {
            <app-icon-configuration-preview-lucide></app-icon-configuration-preview-lucide>
          }
          @default {
            <app-icon-configuration-preview-material-outlined></app-icon-configuration-preview-material-outlined>
          }
        }
      </demo-section>
    </demo-page>
  `,
  styles: [`
    .icon-config-toolbar {
      width: 100%;
      display: flex;
      flex-direction: column;
      gap: 12px;
      align-items: flex-start;
    }

    .icon-config-snippet {
      max-width: 100%;
      padding: 8px 10px;
      border: 1px solid #e5e7eb;
      border-radius: 6px;
      background: #f8fafc;
      color: #1f2937;
      font-size: 12px;
      white-space: normal;
      overflow-wrap: anywhere;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IconConfigurationDemoComponent {
  readonly form = new FormGroup({});
  readonly selectedFontSet = signal<SdIconFontSet>('material-icons-outlined');
  readonly fontSetOptions = FONT_SET_OPTIONS;
}
