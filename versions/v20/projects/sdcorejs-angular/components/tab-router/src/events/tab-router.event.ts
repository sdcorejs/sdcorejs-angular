import { SdTabRouterTab } from '../models/tab-router.model';

export class SdTabBase {
  #tab: SdTabRouterTab | undefined;

  constructor(tab: SdTabRouterTab | undefined) {
    this.#tab = tab;
  }

  get tab(): SdTabRouterTab | undefined {
    return this.#tab;
  }
}

export class SdTabActivated extends SdTabBase {}

export class SdTabDeactivated extends SdTabBase {}

export declare type SdTabEvent = SdTabActivated | SdTabDeactivated;
