import { Pipe, PipeTransform } from '@angular/core';
import { SdTableCommand, SdTableCommandNormal } from '../../../models/table-command.model';
import { SdTableItem } from '../../../models/table-item.model';

/**
 * Resolves command metadata for the current row once, then lets the template reuse it with `@let`.
 */
@Pipe({ name: 'command', standalone: true })
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

  // Only child commands can provide htmlTemplate.
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
