import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { SdTooltipDirective } from '@sdcorejs/angular/directives';
import { SdTranslatePipe } from '@sdcorejs/angular/i18n';
import { SD_DATA_TYPE_LABEL, SdIcon, sdDataTypeIcon } from '@sdcorejs/angular/modules/icon';
import { sdGenericPropertyIconKey } from '../../core';
import type { SdGenericProperty } from '../../models';

/**
 * Identity of a property row on the configuration screen: data-type icon (tooltip and accessible name = the
 * translated type), the projected label or checkbox, and the property key under it (R-006, INV-003).
 */
@Component({
  selector: 'sd-generic-property-identity',
  templateUrl: './generic-property-identity.component.html',
  styleUrl: '../generic-configuration.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'cfg-identity' },
  imports: [SdIcon, SdTooltipDirective, SdTranslatePipe],
})
export class GenericPropertyIdentity {
  readonly property = input.required<Pick<SdGenericProperty, 'key' | 'dataType' | 'format' | 'multiple'>>();

  readonly #typeKey = computed(() => sdGenericPropertyIconKey(this.property()));
  readonly icon = computed(() => sdDataTypeIcon(this.#typeKey()));
  readonly typeLabelKey = computed(() => SD_DATA_TYPE_LABEL[this.#typeKey()]);
}
