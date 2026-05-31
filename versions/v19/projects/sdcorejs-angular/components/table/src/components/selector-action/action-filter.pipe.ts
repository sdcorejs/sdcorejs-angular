import { Pipe, PipeTransform } from '@angular/core';
// import hash from 'object-hash';
import { Utilities } from '@sdcorejs/utils/fns';
import { SdTableAction, SdTableActionNormal } from '../../models/table-option-selector.model';
import { SdTableItem } from '../../models/table-item.model';
import { SdButton } from '@sdcorejs/angular/components/button';
import { SdUnwrapSignal } from '@sdcorejs/angular/utilities/models';
@Pipe({
  name: 'actionFilter',
})
export class ActionFilterPipe implements PipeTransform {
  #convert = (action: SdTableAction): Action => {
    if ('children' in action) {
      return {
        variant: 'children',
        title: action.title,
        icon: action.icon,
        fontSet: action.fontSet,
        tooltip: action.tooltip,
        color: action.color,
        type: action.type,
        children: action.children.map(e => ({
          variant: 'normal',
          title: e.title,
          icon: e.icon,
          color: action.color,
          type: action.type,
          fontSet: e.fontSet,
          tooltip: e.tooltip,
          click: e.click,
        })),
      };
    }
    return {
      variant: 'normal',
      title: action.title,
      icon: action.icon,
      color: action.color,
      type: action.type,
      fontSet: action.fontSet,
      tooltip: action.tooltip,
      click: action.click,
    };
  };
  transform = (selectedItems: SdTableItem[] | undefined, actions: SdTableAction[] | undefined): Action[] => {
    const results: SdTableAction[] = [];
    if (!actions?.length || !selectedItems?.length) {
      return [];
    }
    for (const action of actions || []) {
      if ('children' in action) {
        const children: SdTableActionNormal[] = [];
        for (const childAction of action.children) {
          const key = Utilities.hash(childAction);
          if (selectedItems.every(e => e?.meta?.selector?.actions?.includes(key))) {
            children.push(childAction);
          }
        }
        if (children.length > 0) {
          results.push({ ...action, children });
        }
      } else {
        const key = Utilities.hash(action);
        if (selectedItems.every(e => e?.meta?.selector?.actions?.includes(key))) {
          results.push(action);
        }
      }
    }
    return results.map(result => this.#convert(result));
  };
}

export type Action<T = any> = ActionNormal<T> | ActionChildren<T>;

interface ActionNormal<T = any> {
  variant: 'normal';
  icon?: string;
  fontSet?: SdUnwrapSignal<SdButton['fontSet']>;
  tooltip?: SdUnwrapSignal<SdButton['tooltip']>;
  title?: SdUnwrapSignal<SdButton['title']>;
  color?: SdUnwrapSignal<SdButton['color']>;
  type?: SdUnwrapSignal<SdButton['type']>;
  click: (selectedItems?: T[]) => void;
}

interface ActionChildren<T = any> {
  variant: 'children'
  icon?: string;
  fontSet?: SdUnwrapSignal<SdButton['fontSet']>;
  tooltip?: SdUnwrapSignal<SdButton['tooltip']>;
  title?: SdUnwrapSignal<SdButton['title']>;
  color?: SdUnwrapSignal<SdButton['color']>;
  type?: SdUnwrapSignal<SdButton['type']>;
  children: ActionNormal<T>[];
}
