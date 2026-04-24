import { SdTab } from '../models/tab-router.model';

export interface SdTabAction {
  type: 'close';
  tab: SdTab;
}
