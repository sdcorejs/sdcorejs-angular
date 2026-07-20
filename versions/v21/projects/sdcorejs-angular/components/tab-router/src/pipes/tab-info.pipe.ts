import { Pipe, PipeTransform, inject } from '@angular/core';
import { SdTab, SdTabInfo } from '../models/tab-router.model';
import { SdTabRouterService } from '../services/tab-router.service';
@Pipe({
  name: 'sdTabInfo',
  standalone: true,
})
export class SdTabInfoPipe implements PipeTransform {
  private tabRouterService = inject(SdTabRouterService);

  /** Inserted by Angular inject() migration for backwards compatibility */
  constructor(...args: unknown[]);

  constructor() {}
  transform(tabInfo: SdTabInfo | undefined | null, tab: SdTab): SdTabInfo {
    if (tabInfo) {
      return tabInfo;
    }
    const builders = this.tabRouterService.builders.getValue();
    const builder = builders.find(e => e.component === tab.component);
    if (builder) {
      const { url, params, queryParams, data } = tab;
      return {
        name: typeof builder.name === 'function' ? builder.name({ url, params, queryParams, data }) : builder.name,
        icon: typeof builder.icon === 'function' ? builder.icon({ url, params, queryParams }) : builder.icon,
        tooltip: typeof builder.tooltip === 'function' ? builder.tooltip({ url, params, queryParams }) : builder.tooltip,
        color: typeof builder.color === 'function' ? builder.color({ url, params, queryParams }) : builder.color,
      };
    }
    return {
      name: tab.url,
      icon: undefined,
    };
  }
}
