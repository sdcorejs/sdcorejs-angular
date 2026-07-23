import { Component, inject, Input, output } from '@angular/core';
import { ISdFormGenericConfiguration, SD_FORM_GENERIC_CONFIGURATION } from '../../../../configurations';
import { SdFormGenericComponent, SdFormGenericTemplate } from '../../../../models';
import { SdAutocomplete } from '@sdcorejs/angular/forms/autocomplete';
import { TranslatePipe } from '@sdcorejs/angular/i18n';

// Template là các mẫu do Portal định nghĩa sẵn (key, label ....) để người dùng chọn nhanh
// Khi thực hiện sao chép 1 template chúng ta sẽ CLONE để tránh ảnh hưởng template gốc
@Component({
  selector: 'attribute-template',
  templateUrl: './attribute-template.component.html',
  imports: [SdAutocomplete, TranslatePipe],
})
export class AttributeTemplate {
  templates: SdFormGenericTemplate[] = [];
  component!: SdFormGenericComponent;
  @Input({ alias: 'component', required: true }) set _component(component: SdFormGenericComponent) {
    this.component = component;
    this.templates = this.formGenericConfiguration?.form?.templates?.filter(e => e.component?.type === this.component?.type) || [];
  }
  readonly sdChange = output<SdFormGenericComponent>();
  private readonly formGenericConfiguration: ISdFormGenericConfiguration | null = inject(SD_FORM_GENERIC_CONFIGURATION, { optional: true });

  onChange = (value: string | number | null) => {
    if (typeof value === 'string') {
      const template = this.templates?.find(e => e.value === value);
      if (template?.component) {
        this.sdChange.emit(JSON.parse(JSON.stringify(template.component)));
      }
    }
  };
}
