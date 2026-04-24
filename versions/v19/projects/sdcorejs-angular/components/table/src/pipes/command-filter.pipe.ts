import { Pipe, PipeTransform } from '@angular/core';
import { SdTableCommand, SdTableCommandChildren, SdTableCommandNormal } from '../models/table-command.model';
import { SdTableItem } from '../models/table-item.model';
import { StringUtilities } from '@sdcorejs/angular/utilities';
@Pipe({
  name: 'commandFilter',
})
export class SdCommandFilterPipe implements PipeTransform {
  async transform(item: SdTableItem, commands: SdTableCommand[]): Promise<Command[]> {
    const results: Command[] = [];
    if (!commands) {
      return results;
    }
    for (const command of commands) {
      let flag = false;
      const { hidden } = command;
      if (hidden === undefined) {
        flag = true;
      } else if (typeof hidden === 'boolean') {
        if (!hidden) {
          flag = true;
        }
      } else {
        const isHidden = hidden(item.data);
        if (isHidden instanceof Promise) {
          if (!(await isHidden)) {
            flag = true;
          }
        } else {
          if (!isHidden) {
            flag = true;
          }
        }
      }
      if (flag) {
        const icon = this.#icon(item, command);
        const title = this.#title(item, command);
        if ('children' in command) {
          const children: CommandNormal[] = [];
          for (const childCommand of command.children) {
            const { hidden } = childCommand;
            const icon = this.#icon(item, childCommand);
            const title = this.#title(item, childCommand);
            if (hidden === undefined) {
              children.push({
                ...childCommand,
                type: 'normal',
                icon,
                title,
                key: this.#key(item, childCommand),
              });
            } else if (typeof hidden === 'boolean') {
              if (!hidden) {
                children.push({
                  ...childCommand,
                  type: 'normal',
                  icon,
                  title,
                  key: this.#key(item, childCommand),
                });
              }
            } else {
              const isHidden = hidden(item.data);
              if (isHidden instanceof Promise) {
                if (!(await isHidden)) {
                  children.push({
                    ...childCommand,
                    type: 'normal',
                    icon,
                    title,
                    key: this.#key(item, childCommand),
                  });
                }
              } else {
                if (!isHidden) {
                  children.push({
                    ...childCommand,
                    type: 'normal',
                    icon,
                    title,
                    key: this.#key(item, childCommand),
                  });
                }
              }
            }
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
            key: this.#key(item, command)
          });
        }
      }
    }
    return results;
  }

  #icon = (item: SdTableItem, command: SdTableCommand) => {
    if (!command?.icon) {
      return 'more_vert';
    }
    if (typeof command.icon === 'string') {
      return command.icon;
    }
    return command.icon(item.data);
  };

  #title = (item: SdTableItem, command: SdTableCommand) => {
    if (!command?.title) {
      return '';
    }
    if (typeof command.title === 'string') {
      return command.title;
    }
    return command.title(item.data);
  };

  // Key dÃ¹ng Ä‘á»ƒ gÃ¡n cho autoId
  #key = (item: SdTableItem, command: SdTableCommand) => {
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

