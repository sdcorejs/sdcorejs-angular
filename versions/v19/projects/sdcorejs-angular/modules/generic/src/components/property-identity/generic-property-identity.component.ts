import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { SdTooltipDirective } from '@sdcorejs/angular/directives';
import { I18nService } from '@sdcorejs/angular/i18n';
import { SD_DATA_TYPE_LABEL_KEY, SdIcon, sdDataTypeIcon } from '@sdcorejs/angular/modules/icon';
import { sdGenericPropertyIconKey } from '../../core';
import type { SdGenericProperty } from '../../models';

/**
 * Identity of a property row on the configuration screen: data-type icon (tooltip and accessible name = the
 * translated type), the projected label or checkbox, and the property key under it (R-006, INV-003).
 */
@Component({
  selector: 'sd-generic-property-identity',
  templateUrl: './generic-property-identity.component.html',
  styleUrl: './generic-property-identity.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'cfg-identity' },
  imports: [SdIcon, SdTooltipDirective],
})
export class GenericPropertyIdentity {
  readonly #i18n = inject(I18nService);
  readonly property = input.required<Pick<SdGenericProperty, 'key' | 'dataType' | 'format' | 'multiple'>>();

  readonly #typeKey = computed(() => sdGenericPropertyIconKey(this.property()));
  readonly icon = computed(() => sdDataTypeIcon(this.#typeKey()));
  /** Translated type name; a data type outside the icon set has no i18n key, so its raw value is shown as is. */
  readonly typeLabel = computed(() => {
    const key = this.#typeKey();
    return key ? this.#i18n.t(SD_DATA_TYPE_LABEL_KEY[key]) : String(this.property().dataType);
  });
}
