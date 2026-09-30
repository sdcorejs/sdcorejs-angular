import {
  computed,
  DestroyRef,
  EnvironmentProviders,
  ErrorHandler,
  inject,
  Injectable,
  makeEnvironmentProviders,
  provideEnvironmentInitializer,
  signal,
  Type,
} from '@angular/core';
import { Router, ROUTES } from '@angular/router';
import { ISdApiConfiguration } from './api.model';
import { sdTrackRouteApiConfigurations } from './api-route-configurations';

/**
 * Handler API đăng ký lúc runtime, sống ở root injector.
 *
 * why: `SdHttpInterceptor` được đăng ký qua `HTTP_INTERCEPTORS` ở ROOT, nên
 * `inject(SD_API_CONFIG)` của nó chỉ thấy provider ở root. Library nào khai
 * `{ provide: SD_API_CONFIG, multi: true }` trong NgModule mà shell nạp bằng
 * `loadChildren` thì provider nằm ở child injector của lazy route — interceptor không
 * bao giờ thấy, nên mất `intercept` / `beforeRemote` / `afterRemote` trong im lặng.
 * Registry này là điểm hẹn ở root mà mọi scope (root, eager, lazy) đều ghi vào được.
 *
 * Registry tự nhặt `SD_API_CONFIG` khai trong injector của lazy route (`Route.providers`,
 * NgModule của `loadChildren`) trong chính navigation Router tạo injector đó — trước guard,
 * resolver và component — và gỡ khi injector bị huỷ;
 * library giữ nguyên cách khai multi provider, không cần biết shell mount nó eager hay lazy.
 */
@Injectable({ providedIn: 'root' })
export class SdApiHandlerRegistry {
  // why: bọc từng lần đăng ký vào entry riêng để gỡ đúng lần đó, kể cả khi cùng một object
  // configuration được đăng ký ở hai scope.
  readonly #entries = signal<readonly { readonly configuration: ISdApiConfiguration }[]>([]);

  /** Các configuration đang được đăng ký, theo thứ tự đăng ký. */
  readonly configurations = computed(() => this.#entries().map(entry => entry.configuration));

  constructor() {
    // why: chỉ theo dõi khi app có Router — inject `Router` ở app không cấu hình route sẽ dựng
    // một Router thừa.
    if (inject(ROUTES, { optional: true })) {
      sdTrackRouteApiConfigurations(inject(Router), this, inject(ErrorHandler), inject(DestroyRef));
    }
  }

  /**
   * Đăng ký một configuration. Trả về hàm gỡ đăng ký (gọi nhiều lần vẫn an toàn); dùng
   * {@link provideSdApiConfiguration} để việc gỡ gắn với vòng đời của scope.
   */
  register(configuration: ISdApiConfiguration): () => void {
    const entry = { configuration };
    this.#entries.update(entries => [...entries, entry]);
    let registered = true;
    return () => {
      if (!registered) return;
      registered = false;
      this.#entries.update(entries => entries.filter(candidate => candidate !== entry));
    };
  }
}

/**
 * Đăng ký handler API cho scope hiện tại: root (`bootstrapApplication` / `AppModule`),
 * NgModule nạp eager, hay `Route.providers` / NgModule của lazy route.
 *
 * Configuration được đăng ký vào {@link SdApiHandlerRegistry} ngay khi injector của scope
 * được tạo — tức trước mọi request scope đó phát ra — và gỡ khi injector bị huỷ. Truyền
 * class thì class được provide trong chính scope đó, nên nó inject được dependency của scope.
 *
 * ```ts
 * // library
 * @NgModule({ providers: [provideSdApiConfiguration(ApiConfiguration)] })
 * export class OrdersModule {}
 *
 * // hoặc route
 * { path: 'orders', providers: [provideSdApiConfiguration(ApiConfiguration)], loadComponent: ... }
 * ```
 */
export function provideSdApiConfiguration(configuration: Type<ISdApiConfiguration> | ISdApiConfiguration): EnvironmentProviders {
  const configurationClass = typeof configuration === 'function' ? configuration : undefined;
  return makeEnvironmentProviders([
    ...(configurationClass ? [configurationClass] : []),
    provideEnvironmentInitializer(() => {
      const instance = configurationClass ? inject(configurationClass) : (configuration as ISdApiConfiguration);
      const unregister = inject(SdApiHandlerRegistry).register(instance);
      inject(DestroyRef).onDestroy(unregister);
    }),
  ]);
}
