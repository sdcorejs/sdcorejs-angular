import { Pipe, PipeTransform } from '@angular/core';
import { StringUtilities } from '@sdcorejs/utils/fns';
import { SdTableCommand, SdTableCommandChildren, SdTableCommandNormal } from '../../../models/table-command.model';
import { SdTableItem } from '../../../models/table-item.model';

/**
 * Filters visible commands and pre-resolves icon, title, and stable key for the current row.
 */
@Pipe({ name: 'filter', standalone: true })
export class CommandFilterPipe implements PipeTransform {
  transform(item: SdTableItem, commands: SdTableCommand[]): Promise<Command[]> {
    return sdResolveTableCommands(item, commands);
  }
}

export async function sdResolveTableCommands<T>(item: SdTableItem<T>, commands: SdTableCommand<T>[]): Promise<Command<T>[]> {
  const results: Command<T>[] = [];
  if (!commands) return results;

  for (const command of commands) {
    if (!(await visible(item, command))) continue;

    const icon = iconFor(item, command);
    const title = titleFor(item, command);

    if ('children' in command) {
      const children: CommandNormal<T>[] = [];
      for (const child of command.children) {
        if (!(await visible(item, child))) continue;
        children.push({
          ...child,
          type: 'normal',
          icon: iconFor(item, child),
          title: titleFor(item, child),
          key: keyFor(item, child),
        });
      }
      if (children.length > 0) {
        results.push({
          ...command,
          type: 'children',
          icon,
          title,
          key: keyFor(item, command),
          children,
        });
      }
    } else {
      results.push({
        ...command,
        type: 'normal',
        icon,
        title,
        key: keyFor(item, command),
      });
    }
  }
  return results;
}

const visible = async (item: SdTableItem, command: SdTableCommand): Promise<boolean> => {
  const { hidden } = command;
  if (hidden === undefined) return true;
  if (typeof hidden === 'boolean') return !hidden;
  const result = hidden(item.data);
  return !(result instanceof Promise ? await result : result);
};

const iconFor = (item: SdTableItem, command: SdTableCommand): string => {
  if (!command?.icon) return 'more_vert';
  return typeof command.icon === 'string' ? command.icon : command.icon(item.data);
};

const titleFor = (item: SdTableItem, command: SdTableCommand): string => {
  if (!command?.title) return '';
  return typeof command.title === 'string' ? command.title : command.title(item.data);
};

// Stable autoId key generated from resolved icon and title.
const keyFor = (item: SdTableItem, command: SdTableCommand): string => {
  const icon = iconFor(item, command);
  const title = titleFor(item, command);
  return `${icon || 'noicon'}-${StringUtilities.changeAliasLowerCase(title) || 'notitle'}`;
};

export type Command<T = any> = CommandNormal<T> | CommandChildren<T>;

export interface CommandNormal<T = any> extends SdTableCommandNormal<T> {
  type: 'normal';
  key: string;
  title: string;
  icon: string;
}

export interface CommandChildren<T = any> extends SdTableCommandChildren<T> {
  type: 'children';
  key: string;
  title: string;
  icon: string;
  children: CommandNormal<T>[];
}
