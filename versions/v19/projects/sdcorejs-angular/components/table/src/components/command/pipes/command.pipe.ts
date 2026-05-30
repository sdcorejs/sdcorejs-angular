import { Pipe, PipeTransform } from '@angular/core';
import { SdTableCommand, SdTableCommandNormal } from '../../../models/table-command.model';
import { SdTableItem } from '../../../models/table-item.model';

/**
 * Pipe gộp resolve metadata của 1 command theo row hiện tại — return 1 object
 * chứa `disabled`, `title`, `icon`, và `htmlTemplate` (khi command là child có
 * htmlTemplate). Một lần gọi cho cả 4 truy vấn, template dùng `@let` để alias.
 *
 * Trước đây tách thành 3 pipe `commandDisable` / `commandTitle` / `commandIcon`.
 *
 * @example
 *   @let meta = item | command:cmd;
 *   <button [disabled]="meta.disabled" [matTooltip]="meta.title">
 *     <mat-icon>{{ meta.icon }}</mat-icon>
 *     <div [innerHTML]="meta.htmlTemplate"></div>
 *   </button>
 */
@Pipe({ name: 'command' })
export class CommandPipe implements PipeTransform {
  transform(item: SdTableItem, command: SdTableCommand): CommandMeta {
    return {
      disabled: this.#disabled(item, command),
      title: this.#title(item, command),
      icon: this.#icon(item, command),
      htmlTemplate: this.#htmlTemplate(item, command),
    };
  }

  #disabled = (item: SdTableItem, command: SdTableCommand): boolean => {
    const d = command?.disabled;
    if (d == null) return false;
    return typeof d === 'boolean' ? d : d(item.data);
  };

  #title = (item: SdTableItem, command: SdTableCommand): string => {
    if (!command?.title) return '';
    return typeof command.title === 'string' ? command.title : command.title(item.data);
  };

  #icon = (item: SdTableItem, command: SdTableCommand): string => {
    if (!command?.icon) return '';
    return typeof command.icon === 'string' ? command.icon : command.icon(item.data);
  };

  // Chỉ child command (SdTableCommandNormal) mới có htmlTemplate.
  // Parent (SdTableCommandChildren) không khai báo — trả về undefined.
  #htmlTemplate = (item: SdTableItem, command: SdTableCommand): string | undefined => {
    const tpl = (command as SdTableCommandNormal)?.htmlTemplate;
    return typeof tpl === 'function' ? tpl(item.data) : undefined;
  };
}

export interface CommandMeta {
  disabled: boolean;
  title: string;
  icon: string;
  htmlTemplate: string | undefined;
}
