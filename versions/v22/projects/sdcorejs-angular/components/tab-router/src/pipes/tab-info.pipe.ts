import { I18nService } from '@sdcorejs/angular/i18n';
import { computed, Pipe, PipeTransform, Signal, inject } from '@angular/core';
import { SdTabComponentBuilder } from '../decorators/tab.decorator';
import { SdTabRouterTab, SdTabInfo } from '../models/tab-router.model';
import { SdTabRouterService } from '../services/tab-router.service';
@Pipe({
  name: 'sdTabInfo',
  pure: false,
  standalone: true,
})
export class SdTabInfoPipe implements PipeTransform {
  #tab?: SdTabRouterTab;
  #resolved?: Signal<SdTabInfo>;
  private readonly i18n = inject(I18nService);
  private tabRouterService = inject(SdTabRouterService);

  /** Inserted by Angular inject() migration for backwards compatibility */
  constructor(...args: unknown[]);

  constructor() {}
  transform(tabInfo: SdTabInfo | undefined | null, tab: SdTabRouterTab): SdTabInfo {
    if (tabInfo) {
      return tabInfo;
    }
    if (tab !== this.#tab || !this.#resolved) {
      this.#tab = tab;
      this.#resolved = computed(() => sdTabInfoFromBuilders(this.tabRouterService.builders.getValue(), tab, this.i18n));
    }
    return this.#resolved();
  }
}

/**
 * Thông tin tab từ `@SdTabComponent` của component trong tab, khi màn chưa gửi gì qua `tabInfoChanges`; không có builder
 * thì tên là URL. Dùng chung cho tab trên thanh và tiêu đề trình duyệt (`syncBrowserTitle`). Nội bộ, không export ra
 * entry point.
 */
export function sdTabInfoFromBuilders(builders: SdTabComponentBuilder[], tab: SdTabRouterTab, i18n: I18nService): SdTabInfo {
  const builder = builders.find(e => e.component === tab.component);
  if (builder) {
    const { url, params, queryParams, data } = tab;
    const name = typeof builder.name === 'function' ? builder.name({ url, params, queryParams, data }) : builder.name;
    return {
      name: builder.translateName ? i18n.t(name) : name,
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
