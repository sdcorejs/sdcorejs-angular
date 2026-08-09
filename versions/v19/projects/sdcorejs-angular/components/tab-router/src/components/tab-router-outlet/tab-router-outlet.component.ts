import {
  afterNextRender,
  booleanAttribute,
  Component,
  Injector,
  OnDestroy,
  Type,
  inject,
  input,
  signal,
  viewChild,
  createNgModule,
  NgModuleFactory,
} from '@angular/core';
import {
  ActivatedRoute,
  ActivatedRouteSnapshot,
  NavigationCancel,
  NavigationEnd,
  NavigationError,
  NavigationSkipped,
  NavigationSkippedCode,
  Router,
  RouterOutlet,
  RoutesRecognized,
} from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatTooltipModule } from '@angular/material/tooltip';
import { from, Subject, Subscription, isObservable, lastValueFrom } from 'rxjs';
import { concatMap, filter, map } from 'rxjs/operators';

import { SdNotifyService } from '@sdcorejs/angular/services/notify';
import { I18nService } from '@sdcorejs/angular/i18n';
import { Utilities } from '@sdcorejs/utils/fns';
import { SdTabActivated, SdTabDeactivated } from '../../events/tab-router.event';
import { SdTabAction } from '../../actions/tab-router.action';
import { SdTabRouterTab, SD_TAB } from '../../models';
import { SdTabDecoratorService } from '../../services/tab-decorator.service';
import { SdTabRouterService } from '../../services/tab-router.service';
import { SdTabRouterNavComponent } from '../tab-router-nav/tab-router-nav.component';

type TabRouterNavigationEvent = RoutesRecognized | NavigationEnd | NavigationSkipped | NavigationCancel | NavigationError;

interface TabRouterNavigationContext {
  event: TabRouterNavigationEvent;
  navigationState: Record<string, any>;
}

@Component({
  selector: 'sd-tab-router-outlet',
  templateUrl: './tab-router-outlet.component.html',
  styleUrl: './tab-router-outlet.component.scss',
  standalone: true,
  imports: [CommonModule, MatTooltipModule, RouterOutlet, SdTabRouterNavComponent],
})
export class SdTabRouterOutletComponent implements OnDestroy {
  disabled = input(false, { transform: booleanAttribute });

  tabRouterNav = viewChild<SdTabRouterNavComponent>('tabRouterNav');

  tabs = signal<SdTabRouterTab[]>([]);

  #router = inject(Router);
  #injector = inject(Injector);
  #tabRouterService = inject(SdTabRouterService);
  #sdNotifyService = inject(SdNotifyService);
  readonly #i18n = inject(I18nService);
  // Inject để đảm bảo SdTabDecoratorService được khởi tạo (nó register BehaviorSubject
  // tĩnh để @SdTabComponent decorator có thể truy cập SdTabRouterService). Không dùng trực tiếp ở đây.
  #tabDecoratorService = inject(SdTabDecoratorService);

  #rootRoute?: ActivatedRoute;
  #subscription = new Subscription();

  // Lưu state theo navigation id để các navigation chồng lấn không ghi đè lẫn nhau.
  #pendingNavigationStates = new Map<number, Record<string, any>>();
  // Serialize mọi #activeRoute (router events + initial sync) để tránh race tạo duplicate tab.
  #activationQueue: Promise<void> = Promise.resolve();

  constructor() {
    this.#subscription.add(
      this.#router.events
        .pipe(
          // KHÔNG unwrap event.routerEvent (vd Scroll wrap NavigationEnd):
          // Angular emit NavigationEnd RAW trước, RouterScroller emit Scroll(NavigationEnd) sau.
          // Nếu unwrap thêm Scroll → handler fire 2 lần cho 1 nav → race condition tạo duplicate tabs.
          // Navigation thành công cần CẢ HAI event vì mỗi event chứa data ở thời điểm khác nhau.
          // - RoutesRecognized: navigation đang in-flight → getCurrentNavigation().extras.state đọc được
          // - NavigationEnd: navigation hoàn tất → routerState.root đã update với route mới (cần cho lazy routes)
          // Các terminal event khác chỉ xử lý same-URL forceReload hoặc dọn state theo navigation id.
          filter(
            (event): event is TabRouterNavigationEvent =>
              event instanceof RoutesRecognized ||
              event instanceof NavigationEnd ||
              event instanceof NavigationSkipped ||
              event instanceof NavigationCancel ||
              event instanceof NavigationError
          ),
          // Chụp getCurrentNavigation đồng bộ vì concatMap có thể chạy sau khi Angular đã xoá navigation hiện tại.
          map(
            (event): TabRouterNavigationContext => ({
              event,
              navigationState: this.#router.getCurrentNavigation()?.extras?.state ?? {},
            })
          ),
          // Serialize: #handleEvent async (await getBestInjector). 2 nav liên tiếp
          // không await xen kẽ → tránh race đọc this.tabs() = [] khi tab đầu chưa kịp set.
          concatMap(context => from(this.#handleEvent(context)))
        )
        .subscribe()
    );

    this.#subscription.add(
      this.#tabRouterService.actions.subscribe((event: SdTabAction | undefined) => {
        if (this.disabled()) return;

        if (event?.type === 'close') {
          this.#closeTab(event.tab);
        }
      })
    );

    // Initial navigation có thể hoàn tất trước khi outlet subscribe router.events
    // (blocking init hoặc outlet mount muộn). Catch-up sau first render.
    afterNextRender(() => {
      void this.#syncCurrentRoute();
    });
  }

  ngOnDestroy(): void {
    this.#subscription.unsubscribe();
    this.#pendingNavigationStates.clear();
  }

  #scheduleActivation = (task: () => Promise<void>): Promise<void> => {
    const run = this.#activationQueue.then(task);
    this.#activationQueue = run.catch(() => undefined);
    return run;
  };

  #handleEvent = async ({ event, navigationState }: TabRouterNavigationContext): Promise<void> => {
    if (this.disabled()) {
      this.#pendingNavigationStates.clear();
      return;
    }
    if (event instanceof RoutesRecognized) {
      this.#pendingNavigationStates.set(event.id, navigationState);
      return;
    }

    if (event instanceof NavigationCancel || event instanceof NavigationError) {
      this.#pendingNavigationStates.delete(event.id);
      return;
    }

    let state: Record<string, any>;
    let fullUrl: string;
    if (event instanceof NavigationSkipped) {
      this.#pendingNavigationStates.delete(event.id);
      if (event.code !== NavigationSkippedCode.IgnoredSameUrlNavigation || navigationState['forceReload'] !== true) {
        return;
      }
      state = navigationState;
      fullUrl = event.url;
    } else {
      state = this.#pendingNavigationStates.get(event.id) ?? navigationState;
      this.#pendingNavigationStates.delete(event.id);
      fullUrl = event.urlAfterRedirects || event.url;
    }

    await this.#scheduleActivation(async () => {
      const route = this.#getActivatedRouteSnapshot(this.#router.routerState.snapshot.root);
      this.#rootRoute = this.#router.routerState.root;
      await this.#activeRoute(fullUrl, route, state);
    });
  };

  // Bù initial navigation nếu NavigationEnd đã fire trước khi outlet subscribe.
  #syncCurrentRoute = (): Promise<void> => {
    if (this.disabled() || !this.#router.navigated) {
      return Promise.resolve();
    }

    const route = this.#getActivatedRouteSnapshot(this.#router.routerState.snapshot.root);
    if (!route?.component) {
      return Promise.resolve();
    }

    const [urlPath] = this.#router.url.split('?');
    const key = Utilities.hash({
      url: urlPath,
      queryParams: { ...(route.queryParams || {}) },
    });

    if (this.tabs().some(tab => tab.key === key)) {
      return Promise.resolve();
    }

    return this.#scheduleActivation(async () => {
      if (this.tabs().some(tab => tab.key === key)) {
        return;
      }
      this.#rootRoute = this.#router.routerState.root;
      await this.#activeRoute(this.#router.url, route, {});
    });
  };

  tabTrackBy = (index: number, tab: SdTabRouterTab) => tab.key;

  #closeTab = async (tab: SdTabRouterTab): Promise<void> => {
    if (this.disabled()) return;

    if (tab.beforeClose) {
      let canClose: boolean;
      try {
        const result = tab.beforeClose();
        canClose = typeof result === 'boolean' ? result : await result;
      } catch {
        canClose = false;
      }
      if (!canClose) return;
    }

    const currentTabs = this.tabs();
    const { isActive, key: activeKey } = tab;

    if (isActive) {
      const activeIndex = currentTabs.findIndex(({ key }) => key === activeKey);
      const nextTab = currentTabs[activeIndex + 1] || currentTabs[activeIndex - 1];

      this.tabs.set(currentTabs.filter(({ key }) => key !== activeKey));

      if (nextTab) {
        this.#router.navigate([nextTab.url], {
          queryParams: { ...(nextTab.queryParams || {}) },
          state: { switchTab: true },
        });
      } else {
        this.#router.navigateByUrl('/', { state: { switchTab: true } });
      }
    } else {
      this.tabs.set(currentTabs.filter(({ key }) => key !== tab.key));
      this.tabRouterNav()?.checkUI();
    }
  };

  #activeRoute = async (fullUrl: string, route: ActivatedRouteSnapshot | null, state: Record<string, any> = {}) => {
    if (this.disabled()) return;
    if (!route?.component) return;

    const component = route.component as Type<any>;
    const queryParams = { ...(route.queryParams || {}) };
    const params = { ...(route.params || {}) };
    const data = { ...(route.data || {}) };
    const [url] = fullUrl.split('?');
    // Tab identity = hash(url + queryParams). Cùng key mặc định giữ tab cũ; forceReload mới tạo lại.
    const key = Utilities.hash({ url, queryParams });

    let existedIndex = -1;
    let activatedIndex = -1;

    const currentTabs = this.tabs();

    // QUAN TRỌNG: scan READ-ONLY, KHÔNG mutate tab.isActive trong loop này.
    //
    // Lý do: NavigationEnd có thể fire nhiều lần cho 1 user-action (do nested outlets,
    // redirect, hoặc Angular internal). Vì #activeRoute là async (await getBestInjector),
    // 2 invocations có thể chạy concurrent và interleave với nhau.
    //
    // Nếu mutate tab.isActive = false ở đây, call thứ 2 sẽ thấy isActive đã bị call 1
    // set false rồi → không tìm thấy active tab → activatedIndex stay -1 → splice bỏ qua
    // → tab cũ không bị remove → xuất hiện duplicate tabs.
    //
    // Cách fix: chỉ ĐỌC isActive, sau đó dùng .map() ở dưới để tạo tab objects mới qua spread.
    for (let i = 0; i < currentTabs.length; i++) {
      const tab = currentTabs[i];
      if (tab.key === key) {
        existedIndex = i;
      } else if (tab.isActive) {
        activatedIndex = i;
        this.#tabRouterService.pushEvent(tab, SdTabDeactivated);
      }
    }

    const replaceTab = state['replaceTab'];
    const forceReload = state['forceReload'] === true;

    // Resolve injector phù hợp với route. Cần xử lý 3 trường hợp:
    // - Standalone route (Angular đã set _injector trên routeConfig sau khi activate)
    // - NgModule lazy load (cần createNgModule từ class)
    // - Fallback: root injector
    const getBestInjector = async (snapshot: ActivatedRouteSnapshot): Promise<Injector> => {
      // Standalone route: Angular tự lưu environment injector trên routeConfig._injector
      const routeInjector = (snapshot as any)._resolvedGui || (snapshot as any).routeConfig?._injector;
      if (routeInjector) return routeInjector;

      // NgModule lazy: phải gọi lại loadChildren() để lấy module class rồi createNgModule
      const loadChildren = snapshot.parent?.routeConfig?.loadChildren;
      if (typeof loadChildren === 'function') {
        let loaded: any = await loadChildren();

        if (isObservable(loaded)) {
          loaded = await lastValueFrom(loaded);
        }

        // ES module có thể export default
        if (loaded && typeof loaded === 'object' && 'default' in loaded) {
          loaded = loaded.default;
        }

        // Angular cũ: NgModuleFactory
        if (loaded instanceof NgModuleFactory) {
          return loaded.create(this.#injector).injector;
        }

        // Angular mới: NgModule class. Bọc try/catch vì createNgModule throw nếu không phải NgModule.
        if (typeof loaded === 'function' && !Array.isArray(loaded)) {
          try {
            return createNgModule(loaded, this.#injector).injector;
          } catch {
            return this.#injector;
          }
        }
      }
      return this.#injector;
    };

    const finalInjector = await getBestInjector(route);
    // Refresh root sau await: lazy route tree có thể hoàn tất trong lúc resolve injector.
    this.#rootRoute = this.#router.routerState.root;
    const activatedRoute = this.#findActivatedRouteForSnapshot(this.#rootRoute, route);

    const sdInjector = new SdOutletInjector(activatedRoute, finalInjector);
    const newTab: SdTabRouterTab = {
      key,
      component,
      injector: sdInjector,
      isActive: true,
      url,
      params,
      queryParams,
      data,
      tabInfoChanges: new Subject(),
    };
    sdInjector.setTab(newTab);

    // Tạo updatedTabs qua spread thay vì mutate (xem lý do ở for loop phía trên).
    // Với tab có isActive không đổi: giữ nguyên reference (tránh trigger ngComponentOutlet
    // re-evaluate không cần thiết). Với tab cần đổi isActive: tạo object mới qua spread,
    // các nested fields (component, injector) vẫn giữ same reference nên component không bị recreate.
    let updatedTabs = currentTabs.map(tab => {
      if (tab.key === key) return tab.isActive ? tab : { ...tab, isActive: true };
      return tab.isActive ? { ...tab, isActive: false } : tab;
    });

    // replaceTab: thay vì mở tab mới song song, xoá tab đang active rồi mở tab mới ở cuối.
    // Use case: từ tab "chi tiết" bấm "chỉnh sửa" với replaceTab → tab chi tiết bị xoá,
    // tab chỉnh sửa thay thế (giữ số tab không tăng).
    if (replaceTab && activatedIndex >= 0) {
      updatedTabs = updatedTabs.filter((_, i) => i !== activatedIndex);
    }

    if (existedIndex >= 0) {
      // Mặc định tab đã tồn tại chỉ được activate, không thay tab object. forceReload là nhánh
      // explicit duy nhất thay SdTabRouterTab + injector để body và nav item được tạo lại.
      //
      // splice phía trên có thể đã shift index nếu activatedIndex < existedIndex.
      const idx = replaceTab && activatedIndex >= 0 && activatedIndex < existedIndex ? existedIndex - 1 : existedIndex;
      if (forceReload) {
        updatedTabs = updatedTabs.map((tab, index) => (index === idx ? newTab : tab));
        this.#tabRouterService.setCurrentTab(newTab);
        this.#tabRouterService.pushEvent(newTab, SdTabActivated);
        this.tabs.set(updatedTabs);
      } else {
        this.#tabRouterService.setCurrentTab(updatedTabs[idx]);
        this.#tabRouterService.pushEvent(updatedTabs[idx], SdTabActivated);
        this.tabs.set(updatedTabs);
      }
    } else {
      // Tab chưa tồn tại → thêm mới ở cuối.
      this.#tabRouterService.setCurrentTab(newTab);
      this.tabs.set([...updatedTabs, newTab]);

      if (this.tabs().length > 30) {
        this.#sdNotifyService.warning(this.#i18n.t('core.component.tab-router.too-many-tabs'));
      }
    }

    this.tabRouterNav()?.checkUI();
  };

  // Lần xuống deepest firstChild để lấy snapshot của route lá (route thực sự render component).
  #getActivatedRouteSnapshot = (snapshot: ActivatedRouteSnapshot): ActivatedRouteSnapshot | null => {
    let node = snapshot;
    while (node.firstChild) node = node.firstChild;
    return node;
  };

  // DFS match leaf snapshot → ActivatedRoute instance (ổn định hơn so với so sánh component class).
  #findActivatedRouteForSnapshot = (activatedRoute: ActivatedRoute, targetSnapshot: ActivatedRouteSnapshot): ActivatedRoute | null => {
    if (activatedRoute.snapshot === targetSnapshot) {
      return activatedRoute;
    }
    for (const child of activatedRoute.children) {
      const result = this.#findActivatedRouteForSnapshot(child, targetSnapshot);
      if (result) {
        return result;
      }
    }
    return null;
  };
}

// Custom Injector cho từng tab: override ActivatedRoute thành route của TAB ĐÓ
// (không phải route hiện tại của router). Nếu không override, mọi tab sẽ inject ActivatedRoute
// của route đang active → component cũ trong tab inactive nhận data sai khi user navigate.
class SdOutletInjector implements Injector {
  #tab?: SdTabRouterTab;

  constructor(
    private route: ActivatedRoute | null,
    private parentInjector: Injector
  ) {}

  setTab(tab: SdTabRouterTab): void {
    this.#tab = tab;
  }

  get(token: any, notFoundValue?: any): any {
    if (token === ActivatedRoute) {
      return this.route || notFoundValue;
    }
    if (token === SD_TAB) {
      return this.#tab ?? notFoundValue;
    }
    return this.parentInjector.get(token, notFoundValue);
  }
}
