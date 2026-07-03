import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { SdTableCommand } from '../../models/table-command.model';
import { SdTableItem } from '../../models/table-item.model';
import { CommandPipe } from './pipes/command.pipe';
import { CommandFilterPipe } from './pipes/filter.pipe';
import { SdIcon } from '@sdcorejs/angular/modules/icon';

@Component({
  selector: 'desktop-command',
  templateUrl: './desktop-command.component.html',
  styleUrl: './desktop-command.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  host: {
    '[attr.data-autoid]': 'autoId()',
  },
  imports: [SdIcon, CommonModule, MatTooltipModule, MatMenuModule, MatButtonModule, CommandPipe, CommandFilterPipe],
})
export class DesktopCommand {

  readonly autoIdInput = input<string | null | undefined>(undefined, { alias: 'autoId' });
  readonly item = input.required<SdTableItem>();
  readonly itemIndex = input.required<number>();
  readonly commands = input<SdTableCommand[] | null | undefined>([]);

  // Row key for autoId: prefer id, then code, then value, then itemIndex.
  readonly itemKey = computed(() => {
    const data = this.item()?.data as Record<string, unknown> | undefined;
    return data?.['id']?.toString() || data?.['code']?.toString() || data?.['value']?.toString() || this.itemIndex().toString();
  });

  // Host autoId: `<base>-command-<itemKey>`. Template appends command and child keys.
  readonly autoId = computed(() => {
    const base = this.autoIdInput();
    return base ? `${base}-command-${this.itemKey()}` : '';
  });

  readonly _commands = computed(() => this.commands() || []);
}
