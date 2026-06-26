import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { DefaultMaterialIconFontSet } from '@sdcorejs/angular/utilities/models';
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
export class DesktopCommand {
  // ==========================================
  // 1. SIGNAL INPUTS
  // ==========================================
  readonly defaultIconFontSet = DefaultMaterialIconFontSet;

  autoIdInput = input<string | null | undefined>(undefined, { alias: 'autoId' });
  item = input.required<SdTableItem>();
  itemIndex = input.required<number>();
  commands = input<SdTableCommand[] | null | undefined>([]);

  // ==========================================
  // 2. COMPUTED
  // ==========================================
  // Row key for autoId: prefer id, then code, then value, then itemIndex.
  itemKey = computed(() => {
    const data = this.item()?.data as Record<string, unknown> | undefined;
    return data?.['id']?.toString() || data?.['code']?.toString() || data?.['value']?.toString() || this.itemIndex().toString();
  });

  // Host autoId: `<base>-command-<itemKey>`. Template appends command and child keys.
  autoId = computed(() => {
    const base = this.autoIdInput();
    return base ? `${base}-command-${this.itemKey()}` : '';
  });

  // Commands signal with an empty-array fallback.
  _commands = computed(() => this.commands() || []);
}
