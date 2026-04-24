import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { SdTableCommand } from '../../models/table-command.model';
import { SdTableItem } from '../../models/table-item.model';
import { CommonModule } from '@angular/common';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatMenuModule } from '@angular/material/menu';
import { MatIconModule } from '@angular/material/icon';
import { SdCommandDisablePipe } from '../../pipes/command-disable.pipe';
import { SdCommandFilterPipe } from '../../pipes/command-filter.pipe';
import { SdCommandTitlePipe } from '../../pipes/command-title.pipe';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'sd-desktop-command',
  templateUrl: './desktop-command.component.html',
  styleUrls: ['./desktop-command.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    CommonModule,
    MatTooltipModule,
    MatMenuModule,
    MatButtonModule,
    MatIconModule,
    SdCommandDisablePipe,
    SdCommandFilterPipe,
    SdCommandTitlePipe,
  ],
})
export class SdDesktopCommand {
  autoId?: string;
  @Input('autoId') set _autoId(val: string | undefined | null) {
    if (val) {
      this.autoId = `${val}-command-`;
    }
  }
  item!: SdTableItem;
  itemKey!: string;
  @Input({ required: true, alias: 'item' }) set _item(item: SdTableItem) {
    this.item = item;
    this.itemKey = item.data?.id?.toString() || item.data?.code?.toString() || item.data?.value?.toString();
  }
  @Input({ required: true }) itemIndex!: number;
  commands: SdTableCommand[] = [];
  @Input('commands') set _commands(commands: SdTableCommand[] | undefined | null) {
    this.commands = commands || [];
  }
}
