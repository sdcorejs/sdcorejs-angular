import { SdTab } from '../models/tab-router.model';

export class SdTabBase {
  #tab: SdTab | undefined;

  constructor(tab: SdTab | undefined) {
    this.#tab = tab;
  }

  get tab(): SdTab | undefined {
    return this.#tab;
  }
}

export class SdTabActivated extends SdTabBase {}

export class SdTabDeactivated extends SdTabBase {}

export declare type SdTabEvent = SdTabActivated | SdTabDeactivated;
