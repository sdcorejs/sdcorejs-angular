import { Pipe, PipeTransform, inject } from '@angular/core';
import { SdTabComponentBuilder } from '../decorators/tab.decorator';
import { SdTabRouterTab, SdTabInfo } from '../models/tab-router.model';
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
  transform(tabInfo: SdTabInfo | undefined | null, tab: SdTabRouterTab): SdTabInfo {
    if (tabInfo) {
      return tabInfo;
    }
    return sdTabInfoFromBuilders(this.tabRouterService.builders.getValue(), tab);
  }
}

/**
 * Thông tin tab từ `@SdTabComponent` của component trong tab, khi màn chưa gửi gì qua `tabInfoChanges`; không có builder
 * thì tên là URL. Dùng chung cho tab trên thanh và tiêu đề trình duyệt (`syncBrowserTitle`). Nội bộ, không export ra
 * entry point.
 */
export function sdTabInfoFromBuilders(builders: SdTabComponentBuilder[], tab: SdTabRouterTab): SdTabInfo {
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
