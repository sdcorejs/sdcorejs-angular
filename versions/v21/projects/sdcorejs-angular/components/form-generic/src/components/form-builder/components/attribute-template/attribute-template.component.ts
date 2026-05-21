import { Component, EventEmitter, Inject, Input, Optional, Output } from '@angular/core';
import { ISdFormGenericConfiguration, SD_FORM_GENERIC_CONFIGURATION } from '../../../../configurations';
import { SdFormGenericComponent, SdFormGenericTemplate } from '../../../../models';
import { SdAutocomplete } from '@sdcorejs/angular/forms/autocomplete';
import { TranslatePipe } from '@sdcorejs/angular/i18n';

// Template lÃ  cÃ¡c máº«u do Portal Ä‘á»‹nh nghÄ©a sáºµn (key, label ....) Ä‘á»ƒ ngÆ°á»i dÃ¹ng chá»n nhanh
// Khi thá»±c hiá»‡n sao chÃ©p 1 template chÃºng ta sáº½ CLONE Ä‘á»ƒ trÃ¡nh áº£nh hÆ°á»Ÿng template gá»‘c
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
  @Output() sdChange = new EventEmitter<SdFormGenericComponent>();
  constructor(@Optional() @Inject(SD_FORM_GENERIC_CONFIGURATION) private formGenericConfiguration: ISdFormGenericConfiguration | null) {}

  onChange = (value: string | number | null) => {
    if (typeof value === 'string') {
      const template = this.templates?.find(e => e.value === value);
      if (template?.component) {
        this.sdChange.emit(JSON.parse(JSON.stringify(template.component)));
      }
    }
  };
}

