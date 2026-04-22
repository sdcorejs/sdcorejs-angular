import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, EventEmitter, Output, computed, input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { SdButton } from '@sdcorejs/angular/components/button';
import { SdQuickAction } from '@sdcorejs/angular/components/quick-action';
import { SdTableItem } from '../../models/table-item.model';
import { SdTableOption } from '../../models/table-option.model';
import { Action, ActionFilterPipe } from './action-filter.pipe';

@Component({
  selector: 'selector-action',
  templateUrl: './selector-action.component.html',
  styleUrls: ['./selector-action.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, MatIconModule, MatMenuModule, SdButton, SdQuickAction, ActionFilterPipe],
})
export class SelectorActionComponent {
  tableOption = input<SdTableOption | undefined>(undefined);
  selectedTableItems = input<SdTableItem[] | undefined>(undefined);
  @Output() clear = new EventEmitter();

  message = computed<string>(() => {
    const msg = this.tableOption()?.selector?.message;
    if (!msg) return 'dá»¯ liá»‡u Ä‘Æ°á»£c chá»n';
    if (typeof msg === 'function') {
      return msg(this.selectedTableItems()?.map(e => e.data));
    }
    return msg;
  });

  isOpened = computed(() => !!(this.selectedTableItems()?.length));

  constructor() {}
  onClear = () => {
    this.clear.emit();
  };

  onClickAction = (action: Action) => {
    if (action?.variant === 'normal' && action.click) {
      action.click(this.selectedTableItems()?.map(e => e.data));
    }
  };
}

