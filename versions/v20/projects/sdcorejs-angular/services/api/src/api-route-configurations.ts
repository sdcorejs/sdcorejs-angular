import { DestroyRef, EnvironmentInjector, ErrorHandler } from '@angular/core';
import { Route, Router, RoutesRecognized } from '@angular/router';
import { ISdApiConfiguration, SD_API_CONFIG } from './api.model';

/** Nơi nhận configuration nhặt được từ route; {@link SdApiHandlerRegistry} là hiện thực. */
interface SdApiConfigurationSink {
  register(configuration: ISdApiConfiguration): () => void;
}

/**
 * Field Router gắn lên route: `_injector` (dựng từ `Route.providers`), `_loadedInjector` (NgModule
 * của `loadChildren`) và `_loadedRoutes` (route con đã nạp).
 *
 * why: Router không có API public trả injector của route. Các field này có mặt ở mọi bản Angular
 * 19–22 (chính Router đọc chúng trong `getClosestRouteInjector`); code chỉ nhận giá trị đúng kiểu,
 * nên bản Angular nào đổi tên field thì chỉ mất tính năng, không vỡ.
 */
type SdRouterRoute = Route & { _injector?: unknown; _loadedInjector?: unknown; _loadedRoutes?: unknown };

/**
 * Nhặt `SD_API_CONFIG` khai trong injector của lazy route và đăng ký vào registry ở root.
 *
 * why: interceptor sống ở root nên không thấy `{ provide: SD_API_CONFIG, multi: true }` nằm trong
 * `Route.providers` hay NgModule nạp bằng `loadChildren`. Library không biết shell mount nó eager
 * hay lazy, nên Core phải tự tìm các injector đó thay vì bắt library đổi cách khai.
 *
 * Duyệt cây route của Router lúc registry được tạo và ở mỗi `RoutesRecognized` — lúc recognize vừa
 * tạo xong mọi injector của navigation, trước guard (`canActivate`), resolver và component. Mỗi
 * injector được đọc một lần và gỡ khi nó bị huỷ, nên handler sống đúng bằng injector của route.
 */
export function sdTrackRouteApiConfigurations(
  router: Router,
  sink: SdApiConfigurationSink,
  errorHandler: ErrorHandler,
  destroyRef: DestroyRef
): void {
  const tracked = new WeakSet<EnvironmentInjector>();

  const register = (injector: EnvironmentInjector): void => {
    if (tracked.has(injector)) return;
    tracked.add(injector);
    try {
      // why: `self` — chỉ provider của chính scope này; root và scope cha đã được tính ở chỗ khác.
      const configurations = injector.get<ISdApiConfiguration[] | null>(SD_API_CONFIG, null, { self: true, optional: true }) ?? [];
      if (!configurations.length) return;
      const unregisters = configurations.map(configuration => sink.register(configuration));
      injector.get(DestroyRef).onDestroy(() => unregisters.forEach(unregister => unregister()));
    } catch (error) {
      errorHandler.handleError(error);
    }
  };

  const collect = (routes: readonly SdRouterRoute[]): void => {
    for (const route of routes) {
      for (const injector of [route._injector, route._loadedInjector]) {
        if (injector instanceof EnvironmentInjector) register(injector);
      }
      if (Array.isArray(route.children)) collect(route.children);
      if (Array.isArray(route._loadedRoutes)) collect(route._loadedRoutes);
    }
  };

  // why: registry có thể được tạo giữa chừng — sau navigation đầu, hay trong guard của chính lazy
  // route — nên đọc cả những injector Router đã dựng trước đó.
  collect(router.config);
  const subscription = router.events.subscribe(event => {
    if (event instanceof RoutesRecognized) collect(router.config);
  });
  destroyRef.onDestroy(() => subscription.unsubscribe());
}
