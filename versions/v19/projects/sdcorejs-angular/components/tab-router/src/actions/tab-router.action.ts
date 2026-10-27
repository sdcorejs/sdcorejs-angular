import { SdTabRouterTab } from '../models/tab-router.model';

export interface SdTabAction {
  type: 'close' | 'close-others';
  tab: SdTabRouterTab;
}
