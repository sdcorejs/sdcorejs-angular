import { booleanAttribute, ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'sd-quick-action',
  templateUrl: './quick-action.component.html',
  styleUrl: './quick-action.component.scss',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SdQuickAction {
  /**
   * Toggle visibility of the floating toolbar. Bare attribute = true.
   */
  readonly opened = input(false, { transform: booleanAttribute });
  /** Keep the toolbar in its owner's layout (for a sticky table footer or a drawer). */
  readonly contained = input(false, { transform: booleanAttribute });
}
