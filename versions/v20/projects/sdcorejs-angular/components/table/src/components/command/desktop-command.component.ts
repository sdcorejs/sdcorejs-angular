import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { SdTableCommand } from '../../models/table-command.model';
import { SdTableItem } from '../../models/table-item.model';
import { CommandPipe } from './pipes/command.pipe';
import { CommandFilterPipe } from './pipes/filter.pipe';

@Component({
  selector: 'desktop-command',
  templateUrl: './desktop-command.component.html',
  styleUrls: ['./desktop-command.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  host: {
    '[attr.data-autoid]': 'autoId()',
  },
  imports: [CommonModule, MatTooltipModule, MatMenuModule, MatButtonModule, MatIconModule, CommandPipe, CommandFilterPipe],
})
// eslint-disable-next-line @angular-eslint/component-class-suffix
export class DesktopCommand {
  // ==========================================
  // 1. SIGNAL INPUTS
  // ==========================================
  autoIdInput = input<string | null | undefined>(undefined, { alias: 'autoId' });
  item = input.required<SdTableItem>();
  itemIndex = input.required<number>();
  commands = input<SdTableCommand[] | null | undefined>([]);

  // ==========================================
  // 2. COMPUTED
  // ==========================================
  // Key định danh row dùng để build autoId: ưu tiên id → code → value → fallback itemIndex.
  itemKey = computed(() => {
    const data = this.item()?.data as Record<string, unknown> | undefined;
    return data?.['id']?.toString() || data?.['code']?.toString() || data?.['value']?.toString() || this.itemIndex().toString();
  });

  // autoId của host: `<base>-command-<itemKey>` — đã unique theo row.
  // Template ghép tiếp `-<commandKey>` (và `-<childKey>` nếu child) cho mỗi button.
  autoId = computed(() => {
    const base = this.autoIdInput();
    return base ? `${base}-command-${this.itemKey()}` : '';
  });

  // Commands signal (mặc định mảng rỗng).
  _commands = computed(() => this.commands() || []);
}
