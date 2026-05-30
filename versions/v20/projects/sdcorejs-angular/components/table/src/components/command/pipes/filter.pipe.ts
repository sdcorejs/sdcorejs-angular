import { Pipe, PipeTransform } from '@angular/core';
import { StringUtilities } from '@sdcorejs/angular/utilities';
import { SdTableCommand, SdTableCommandChildren, SdTableCommandNormal } from '../../../models/table-command.model';
import { SdTableItem } from '../../../models/table-item.model';

/**
 * Lá»c danh sÃ¡ch commands theo `hidden` (sync / async) + pre-resolve `icon`, `title`, `key`
 * cho tá»«ng row. Output dÃ¹ng trá»±c tiáº¿p trong template khÃ´ng cáº§n thÃªm pipe phá»¥.
 *
 * ÄÃ£ rename tá»« `commandFilter` â†’ `filter` sau khi gom toÃ n bá»™ pipe command vÃ o
 * `components/command/pipes/`.
 *
 * @example
 *   @let filteredCommands = item | filter:commands | async;
 */
@Pipe({ name: 'filter' })
export class CommandFilterPipe implements PipeTransform {
  async transform(item: SdTableItem, commands: SdTableCommand[]): Promise<Command[]> {
    const results: Command[] = [];
    if (!commands) return results;

    for (const command of commands) {
      if (!(await this.#visible(item, command))) continue;

      const icon = this.#icon(item, command);
      const title = this.#title(item, command);

      if ('children' in command) {
        const children: CommandNormal[] = [];
        for (const child of command.children) {
          if (!(await this.#visible(item, child))) continue;
          children.push({
            ...child,
            type: 'normal',
            icon: this.#icon(item, child),
            title: this.#title(item, child),
            key: this.#key(item, child),
          });
        }
        if (children.length > 0) {
          results.push({
            ...command,
            type: 'children',
            icon,
            title,
            key: this.#key(item, command),
            children,
          });
        }
      } else {
        results.push({
          ...command,
          type: 'normal',
          icon,
          title,
          key: this.#key(item, command),
        });
      }
    }
    return results;
  }

  #visible = async (item: SdTableItem, command: SdTableCommand): Promise<boolean> => {
    const { hidden } = command;
    if (hidden === undefined) return true;
    if (typeof hidden === 'boolean') return !hidden;
    const result = hidden(item.data);
    return !(result instanceof Promise ? await result : result);
  };

  #icon = (item: SdTableItem, command: SdTableCommand): string => {
    if (!command?.icon) return 'more_vert';
    return typeof command.icon === 'string' ? command.icon : command.icon(item.data);
  };

  #title = (item: SdTableItem, command: SdTableCommand): string => {
    if (!command?.title) return '';
    return typeof command.title === 'string' ? command.title : command.title(item.data);
  };

  // Key dÃ¹ng Ä‘á»ƒ gÃ¡n cho autoId â€” cáº§n stable theo (icon, title).
  #key = (item: SdTableItem, command: SdTableCommand): string => {
    const icon = this.#icon(item, command);
    const title = this.#title(item, command);
    return `${icon || 'noicon'}-${StringUtilities.changeAliasLowerCase(title) || 'notitle'}`;
  };
}

type Command<T = any> = CommandNormal<T> | CommandChildren<T>;

interface CommandNormal<T = any> extends SdTableCommandNormal<T> {
  type: 'normal';
  key: string;
  title: string;
  icon: string;
}

interface CommandChildren<T = any> extends SdTableCommandChildren<T> {
  type: 'children';
  key: string;
  title: string;
  icon: string;
  children: CommandNormal<T>[];
}

