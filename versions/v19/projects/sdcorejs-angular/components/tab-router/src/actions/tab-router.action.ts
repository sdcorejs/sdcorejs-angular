import { SdTabRouterTab } from '../models/tab-router.model';

export interface SdTabAction {
  type: 'close';
  tab: SdTabRouterTab;
}
