import { InjectionToken, makeEnvironmentProviders, type EnvironmentProviders, type Provider } from '@angular/core';
import { provideLucideConfig, provideLucideIcons } from '@lucide/angular';
import {
  SD_ICON_DEFAULT_CONFIG,
  type ISdIconConfiguration,
  type ISdIconResolvedConfiguration,
  type SdLucideIconRegistration,
  type SdLucideIconRegistrations,
} from './icon.model';

/**
 * Injection token chứa cấu hình icon đã resolve cho toàn bộ app.
 *
 * Token có factory mặc định để `SdIcon` vẫn chạy khi app chưa gọi `provideSdIcon`.
 */
export const SD_ICON_CONFIGURATION = new InjectionToken<ISdIconResolvedConfiguration>('SD_ICON_CONFIGURATION', {
  providedIn: 'root',
  factory: () => resolveSdIconConfig(),
});

/**
 * Đăng ký cấu hình icon Core UI ở app-level.
 *
 * Provider này gom cả cấu hình `SdIcon` và registry của `@lucide/angular` để consumer chỉ cần gọi một hàm.
 *
 * @param config - cấu hình app-level cho Material/Lucide icon.
 * @returns environment providers dùng được trong `ApplicationConfig.providers`.
 */
export function provideSdIcon(config: ISdIconConfiguration = {}): EnvironmentProviders {
  const providers: Provider[] = [
    {
      provide: SD_ICON_CONFIGURATION,
      useValue: resolveSdIconConfig(config),
    },
  ];

  if (config.lucideConfig) {
    providers.push(provideLucideConfig(config.lucideConfig));
  }

  const lucideIcons = normalizeSdLucideIcons(config.lucideIcons);
  if (lucideIcons.length) {
    // why: @lucide/angular chỉ render dynamic icon đã được đăng ký trước qua provider
    providers.push(provideLucideIcons(...lucideIcons));
  }

  return makeEnvironmentProviders(providers);
}

/**
 * Resolve cấu hình `SdIcon` thành object đầy đủ, không còn field optional.
 *
 * Alias mặc định đứng trước để app có thể override từng key mà không phải copy toàn bộ bảng alias.
 *
 * @param config - cấu hình rời rạc từ consumer hoặc mặc định rỗng.
 * @returns cấu hình đầy đủ dùng trực tiếp trong component.
 */
export function resolveSdIconConfig(config: ISdIconConfiguration = {}): ISdIconResolvedConfiguration {
  return {
    defaultFontSet: config.defaultFontSet ?? SD_ICON_DEFAULT_CONFIG.defaultFontSet,
    materialAliases: {
      ...SD_ICON_DEFAULT_CONFIG.materialAliases,
      ...config.materialAliases,
    },
    lucideAliases: {
      ...SD_ICON_DEFAULT_CONFIG.lucideAliases,
      ...config.lucideAliases,
    },
    lucideConfig: {
      ...SD_ICON_DEFAULT_CONFIG.lucideConfig,
      ...config.lucideConfig,
    },
  };
}

/**
 * Chuẩn hóa nhiều kiểu khai báo Lucide icon về array cho `provideLucideIcons`.
 *
 * @param registrations - array hoặc object map icon Lucide từ consumer.
 * @returns danh sách icon Lucide đã sẵn sàng để spread vào provider của Lucide.
 */
export function normalizeSdLucideIcons(registrations?: SdLucideIconRegistrations): SdLucideIconRegistration[] {
  if (!registrations) {
    return [];
  }

  return Array.isArray(registrations) ? registrations : Object.values(registrations);
}
