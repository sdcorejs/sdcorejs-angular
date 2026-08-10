import { ChangeDetectionStrategy, Component, computed, inject, input, output } from '@angular/core';
import { MatMenuModule } from '@angular/material/menu';
import { SdButton } from '@sdcorejs/angular/components/button';
import { I18nService } from '@sdcorejs/angular/i18n';
import { SdQuickAction } from '@sdcorejs/angular/components/quick-action';
import { SdTableItem } from '../../models/table-item.model';
import { SdTableOption } from '../../models/table-option.model';
import { Action, ActionFilterPipe } from './action-filter.pipe';
import { SdIcon } from '@sdcorejs/angular/modules/icon';

@Component({
  selector: 'selector-action',
  templateUrl: './selector-action.component.html',
  styleUrl: './selector-action.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SdIcon, MatMenuModule, SdButton, SdQuickAction, ActionFilterPipe],
})
export class SelectorActionComponent {
  // ==========================================
  // 1. SIGNAL INPUTS / OUTPUTS
  // ==========================================
  autoIdInput = input<string | null | undefined>(undefined, { alias: 'autoId' });
  tableOption = input<SdTableOption | undefined>(undefined);
  selectedTableItems = input<SdTableItem[] | undefined>(undefined);
  sdClear = output<void>();

  // Base autoId (đã là `components-table-<scope>` từ parent), '' khi parent không set.
  autoId = computed(() => this.autoIdInput() || '');

  // ==========================================
  // 2. INJECT
  // ==========================================
  readonly #i18n = inject(I18nService);

  // ==========================================
  // 3. COMPUTED
  // ==========================================
  message = computed<string>(() => {
    const msg = this.tableOption()?.selector?.message;
    if (!msg) return this.#i18n.t('core.component.table.selector-action.default-msg');
    if (typeof msg === 'function') {
      return msg(this.selectedTableItems()?.map(e => e.data));
    }
    return msg;
  });

  opened = computed(() => !!this.selectedTableItems()?.length);

  // ==========================================
  // 4. HANDLERS
  // ==========================================
  onClear = () => this.sdClear.emit();

  onClickAction = (action: Action) => {
    if (action?.variant === 'normal' && action.click) {
      action.click(this.selectedTableItems()?.map(e => e.data));
    }
  };
}
