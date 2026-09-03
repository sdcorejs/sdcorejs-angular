import { Injectable, Type } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { SdTabAction } from '../actions/tab-router.action';
import { SdTabComponentBuilder } from '../decorators/tab.decorator';
import { SdTabBase, SdTabEvent } from '../events/tab-router.event';
import { SdTabRouterTab } from '../models/tab-router.model';

@Injectable({
  providedIn: 'root',
})
export class SdTabRouterService {
  events = new BehaviorSubject<SdTabEvent>(new SdTabBase(undefined));
  actions = new BehaviorSubject<SdTabAction | undefined>(undefined);
  builders = new BehaviorSubject<SdTabComponentBuilder[]>([]);
  currentTabChanges = new BehaviorSubject<SdTabRouterTab | undefined>(undefined);
  newTabs = new BehaviorSubject<SdTabRouterTab | undefined>(undefined);
  updateTabs = new BehaviorSubject<SdTabRouterTab | undefined>(undefined);
  #currentTab: SdTabRouterTab | undefined = undefined;
  #componentBuilders: SdTabComponentBuilder[] = [];

  addBuilder = (builder: SdTabComponentBuilder) => {
    if (!this.#componentBuilders.some(e => e.component === builder.component)) {
      this.#componentBuilders.push(builder);
      this.builders.next(this.#componentBuilders);
    }
  };

  get currentTab() {
    return this.#currentTab;
  }

  get currentKey() {
    return this.#currentTab?.key || null;
  }

  // select = (tabOrKey: string | SdTabRouterTab): void => {
  //   const tab = this.#tabs.find(e => {
  //     if (typeof (tabOrKey) === 'string') {
  //       return e.key === tabOrKey;
  //     }
  //     return e.key === tabOrKey?.key;
  //   });
  //   if (tab) {
  //     this.#currentTab = tab;
  //   }
  // }

  // add = (tab: SdTabRouterTab): void => {
  //   if (!tab.key) {
  //     this.notifyService.notify.warning('Tab key is required');
  //   }
  //   if (!tab.component) {
  //     this.notifyService.notify.warning('Tab component is required');
  //   }
  //   const existedTab = this.#tabs.find(e => e.key === tab.key);
  //   if (!existedTab) {
  //     this.#tabs.push(tab);
  //     this.select(tab);
  //   } else {
  //     this.select(existedTab);
  //   }
  // }

  // remove = (tabOrKey: string | SdTabRouterTab): void => {
  //   this.#tabs = this.#tabs.filter(e => {
  //     if (typeof (tabOrKey) === 'string') {
  //       return e.key !== tabOrKey;
  //     }
  //     return e.key !== tabOrKey?.key;
  //   });
  // }

  setCurrentTab = (tab: SdTabRouterTab): void => {
    this.#currentTab = tab;
    this.currentTabChanges.next(tab);
  };

  pushEvent = (tab: SdTabRouterTab, Event: Type<SdTabEvent>) => {
    this.events.next(new Event(tab));
  };

  setOptions = () => {};

  close = (tab?: SdTabRouterTab) => {
    tab = tab || this.#currentTab;
    if (tab) {
      this.actions.next({
        type: 'close',
        tab,
      });
    }
  };

  // Gọi hàm này để thực hiện update tab
  updateTab = (tab: SdTabRouterTab) => {};
}
