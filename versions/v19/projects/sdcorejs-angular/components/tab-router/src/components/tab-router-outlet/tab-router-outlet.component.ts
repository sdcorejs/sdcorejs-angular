/* eslint-disable @typescript-eslint/no-explicit-any */
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
  NavigationEnd,
  Router,
  RouterOutlet,
  RoutesRecognized,
} from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { from, Subject, Subscription, isObservable, lastValueFrom } from 'rxjs';
import { concatMap, filter } from 'rxjs/operators';

import { SdNotifyService } from '@sdcorejs/angular/services/notify';
import { I18nService } from '@sdcorejs/angular/i18n';
import { Utilities } from '@sdcorejs/utils/fns';
import { SdTabActivated, SdTabDeactivated } from '../../events/tab-router.event';
import { SdTabAction } from '../../actions/tab-router.action';
import { SdTab } from '../../models';
import { SdTabDecoratorService } from '../../services/tab-decorator.service';
import { SdTabRouterService } from '../../services/tab-router.service';
import { SdTabRouterNavComponent } from '../tab-router-nav/tab-router-nav.component';

// eslint-disable-next-line @angular-eslint/no-unused-standalone-imports
@Component({
  selector: 'sd-tab-router-outlet',
  templateUrl: './tab-router-outlet.component.html',
  styleUrls: ['./tab-router-outlet.component.scss'],
  standalone: true,
  imports: [CommonModule, MatIconModule, MatTooltipModule, RouterOutlet, SdTabRouterNavComponent],
})
export class SdTabRouterOutletComponent implements OnDestroy {
  disabled = input(false, { transform: booleanAttribute });

  tabRouterNav = viewChild<SdTabRouterNavComponent>('tabRouterNav');

  tabs = signal<SdTab[]>([]);

  #router = inject(Router);
  #injector = inject(Injector);
  #tabRouterService = inject(SdTabRouterService);
  #sdNotifyService = inject(SdNotifyService);
  readonly #i18n = inject(I18nService);
  // Inject Ä‘á»ƒ Ä‘áº£m báº£o SdTabDecoratorService Ä‘Æ°á»£c khá»Ÿi táº¡o (nÃ³ register BehaviorSubject
  // tÄ©nh Ä‘á»ƒ @SdTab decorator cÃ³ thá»ƒ truy cáº­p SdTabRouterService). KhÃ´ng dÃ¹ng trá»±c tiáº¿p á»Ÿ Ä‘Ã¢y.
  #tabDecoratorService = inject(SdTabDecoratorService);

  #rootRoute?: ActivatedRoute;
  #subscription = new Subscription();

  // State cá»§a navigation hiá»‡n táº¡i (replaceTab, switchTab, ...) Ä‘Æ°á»£c capture á»Ÿ RoutesRecognized
  // vÃ  dÃ¹ng láº¡i á»Ÿ NavigationEnd. LÃ½ do: táº¡i NavigationEnd, getCurrentNavigation() Ä‘Ã£ tráº£ vá» null,
  // cÃ²n lastSuccessfulNavigation vÃ  window.history.state khÃ´ng Ä‘Ã¡ng tin cáº­y vá»›i má»i case.
  #pendingNavigationState: Record<string, any> = {};
  // Serialize má»i #activeRoute (router events + initial sync) Ä‘á»ƒ trÃ¡nh race táº¡o duplicate tab.
  #activationQueue: Promise<void> = Promise.resolve();

  constructor() {
    this.#subscription.add(
      this.#router.events
        .pipe(
          // KHÃ”NG unwrap event.routerEvent (vd Scroll wrap NavigationEnd):
          // Angular emit NavigationEnd RAW trÆ°á»›c, RouterScroller emit Scroll(NavigationEnd) sau.
          // Náº¿u unwrap thÃªm Scroll â†’ handler fire 2 láº§n cho 1 nav â†’ race condition táº¡o duplicate tabs.
          // Hybrid: cáº§n Cáº¢ HAI event vÃ¬ má»—i event chá»©a data khÃ¡c nhau á»Ÿ thá»i Ä‘iá»ƒm khÃ¡c nhau.
          // - RoutesRecognized: navigation Ä‘ang in-flight â†’ getCurrentNavigation().extras.state Ä‘á»c Ä‘Æ°á»£c
          // - NavigationEnd: navigation hoÃ n táº¥t â†’ routerState.root Ä‘Ã£ update vá»›i route má»›i (cáº§n cho lazy routes)
          filter((event): event is RoutesRecognized | NavigationEnd =>
            event instanceof RoutesRecognized || event instanceof NavigationEnd),
          // Serialize: #handleEvent async (await getBestInjector). 2 nav liÃªn tiáº¿p
          // khÃ´ng await xen káº½ â†’ trÃ¡nh race Ä‘á»c this.tabs() = [] khi tab Ä‘áº§u chÆ°a ká»‹p set.
          concatMap(event => from(this.#handleEvent(event)))
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

    // Initial navigation cÃ³ thá»ƒ hoÃ n táº¥t trÆ°á»›c khi outlet subscribe router.events
    // (blocking init hoáº·c outlet mount muá»™n). Catch-up sau first render.
    afterNextRender(() => {
      void this.#syncCurrentRoute();
    });
  }

  ngOnDestroy(): void {
    this.#subscription.unsubscribe();
  }

  #scheduleActivation = (task: () => Promise<void>): Promise<void> => {
    const run = this.#activationQueue.then(task);
    this.#activationQueue = run.catch(() => undefined);
    return run;
  };

  #handleEvent = async (event: RoutesRecognized | NavigationEnd): Promise<void> => {
    if (this.disabled()) {
      this.#pendingNavigationState = {};
      return;
    }
    if (event instanceof RoutesRecognized) {
      // Capture state ngay lÃºc nav cÃ²n in-flight. ÄÃ¢y lÃ  Ä‘iá»ƒm duy nháº¥t cháº¯c cháº¯n
      // getCurrentNavigation() tráº£ vá» Navigation object vá»›i extras.state nguyÃªn váº¹n.
      this.#pendingNavigationState = this.#router.getCurrentNavigation()?.extras?.state ?? {};
      return;
    }
    // NavigationEnd: dÃ¹ng routerState.snapshot.root (canonical state táº¡i NavigationEnd),
    // KHÃ”NG dÃ¹ng injected ActivatedRoute.snapshot â€” cÃ³ thá»ƒ chÆ°a sync trÃªn initial load.
    const navigationState = this.#pendingNavigationState;
    this.#pendingNavigationState = {};
    await this.#scheduleActivation(async () => {
      const route = this.#getActivatedRouteSnapshot(this.#router.routerState.snapshot.root);
      this.#rootRoute = this.#router.routerState.root;
      await this.#activeRoute(event.urlAfterRedirects || event.url, route, navigationState);
    });
  };

  // BÃ¹ initial navigation náº¿u NavigationEnd Ä‘Ã£ fire trÆ°á»›c khi outlet subscribe.
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

  tabTrackBy = (index: number, tab: SdTab) => tab.key;

  #closeTab = (tab: SdTab) => {
    if (this.disabled()) return;

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

  #activeRoute = async (
    fullUrl: string,
    route: ActivatedRouteSnapshot | null,
    state: Record<string, any> = {}
  ) => {
    if (this.disabled()) return;
    if (!route?.component) return;

    const component = route.component as Type<any>;
    const queryParams = { ...(route.queryParams || {}) };
    const params = { ...(route.params || {}) };
    const data = { ...(route.data || {}) };
    const [url] = fullUrl.split('?');
    // Tab identity = hash(url + queryParams). CÃ¹ng key = cÃ¹ng tab, khÃ´ng táº¡o láº¡i.
    const key = Utilities.hash({ url, queryParams });

    let existedIndex = -1;
    let activatedIndex = -1;

    const currentTabs = this.tabs();

    // QUAN TRá»ŒNG: scan READ-ONLY, KHÃ”NG mutate tab.isActive trong loop nÃ y.
    //
    // LÃ½ do: NavigationEnd cÃ³ thá»ƒ fire nhiá»u láº§n cho 1 user-action (do nested outlets,
    // redirect, hoáº·c Angular internal). VÃ¬ #activeRoute lÃ  async (await getBestInjector),
    // 2 invocations cÃ³ thá»ƒ cháº¡y concurrent vÃ  interleave vá»›i nhau.
    //
    // Náº¿u mutate tab.isActive = false á»Ÿ Ä‘Ã¢y, call thá»© 2 sáº½ tháº¥y isActive Ä‘Ã£ bá»‹ call 1
    // set false rá»“i â†’ khÃ´ng tÃ¬m tháº¥y active tab â†’ activatedIndex stay -1 â†’ splice bá» qua
    // â†’ tab cÅ© khÃ´ng bá»‹ remove â†’ xuáº¥t hiá»‡n duplicate tabs.
    //
    // CÃ¡ch fix: chá»‰ Äá»ŒC isActive, sau Ä‘Ã³ dÃ¹ng .map() á»Ÿ dÆ°á»›i Ä‘á»ƒ táº¡o tab objects má»›i qua spread.
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

    // Resolve injector phÃ¹ há»£p vá»›i route. Cáº§n xá»­ lÃ½ 3 trÆ°á»ng há»£p:
    // - Standalone route (Angular Ä‘Ã£ set _injector trÃªn routeConfig sau khi activate)
    // - NgModule lazy load (cáº§n createNgModule tá»« class)
    // - Fallback: root injector
    const getBestInjector = async (snapshot: ActivatedRouteSnapshot): Promise<Injector> => {
      // Standalone route: Angular tá»± lÆ°u environment injector trÃªn routeConfig._injector
      const routeInjector = (snapshot as any)._resolvedGui || (snapshot as any).routeConfig?._injector;
      if (routeInjector) return routeInjector;

      // NgModule lazy: pháº£i gá»i láº¡i loadChildren() Ä‘á»ƒ láº¥y module class rá»“i createNgModule
      const loadChildren = snapshot.parent?.routeConfig?.loadChildren;
      if (typeof loadChildren === 'function') {
        let loaded: any = await loadChildren();

        if (isObservable(loaded)) {
          loaded = await lastValueFrom(loaded);
        }

        // ES module cÃ³ thá»ƒ export default
        if (loaded && typeof loaded === 'object' && 'default' in loaded) {
          loaded = loaded.default;
        }

        // Angular cÅ©: NgModuleFactory
        if (loaded instanceof NgModuleFactory) {
          return loaded.create(this.#injector).injector;
        }

        // Angular má»›i: NgModule class. Bá»c try/catch vÃ¬ createNgModule throw náº¿u khÃ´ng pháº£i NgModule.
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
    // Refresh root sau await: lazy route tree cÃ³ thá»ƒ hoÃ n táº¥t trong lÃºc resolve injector.
    this.#rootRoute = this.#router.routerState.root;
    const activatedRoute = this.#findActivatedRouteForSnapshot(this.#rootRoute, route);

    const newTab: SdTab = {
      key,
      component,
      injector: new SdOutletInjector(activatedRoute, finalInjector),
      isActive: true,
      url,
      params,
      queryParams,
      data,
      tabInfoChanges: new Subject(),
    };

    // Táº¡o updatedTabs qua spread thay vÃ¬ mutate (xem lÃ½ do á»Ÿ for loop phÃ­a trÃªn).
    // Vá»›i tab cÃ³ isActive khÃ´ng Ä‘á»•i: giá»¯ nguyÃªn reference (trÃ¡nh trigger ngComponentOutlet
    // re-evaluate khÃ´ng cáº§n thiáº¿t). Vá»›i tab cáº§n Ä‘á»•i isActive: táº¡o object má»›i qua spread,
    // cÃ¡c nested fields (component, injector) váº«n giá»¯ same reference nÃªn component khÃ´ng bá»‹ recreate.
    let updatedTabs = currentTabs.map(tab => {
      if (tab.key === key) return tab.isActive ? tab : { ...tab, isActive: true };
      return tab.isActive ? { ...tab, isActive: false } : tab;
    });

    // replaceTab: thay vÃ¬ má»Ÿ tab má»›i song song, xoÃ¡ tab Ä‘ang active rá»“i má»Ÿ tab má»›i á»Ÿ cuá»‘i.
    // Use case: tá»« tab "chi tiáº¿t" báº¥m "chá»‰nh sá»­a" vá»›i replaceTab â†’ tab chi tiáº¿t bá»‹ xoÃ¡,
    // tab chá»‰nh sá»­a thay tháº¿ (giá»¯ sá»‘ tab khÃ´ng tÄƒng).
    if (replaceTab && activatedIndex >= 0) {
      updatedTabs = updatedTabs.filter((_, i) => i !== activatedIndex);
    }

    if (existedIndex >= 0) {
      // Tab Ä‘Ã£ tá»“n táº¡i (cÃ¹ng url + queryParams) â†’ CHá»ˆ activate, KHÃ”NG thay tab object.
      // LÃ½ do: thay tab object = Ä‘á»•i reference cá»§a tab.injector â†’ ngComponentOutlet recreate
      // component â†’ tab bá»‹ "reload" má»—i khi click láº¡i hoáº·c navigate cÃ¹ng URL.
      //
      // splice phÃ­a trÃªn cÃ³ thá»ƒ Ä‘Ã£ shift index náº¿u activatedIndex < existedIndex.
      const idx = replaceTab && activatedIndex >= 0 && activatedIndex < existedIndex
        ? existedIndex - 1
        : existedIndex;
      this.#tabRouterService.setCurrentTab(updatedTabs[idx]);
      this.#tabRouterService.pushEvent(updatedTabs[idx], SdTabActivated);
      this.tabs.set(updatedTabs);
    } else {
      // Tab chÆ°a tá»“n táº¡i â†’ thÃªm má»›i á»Ÿ cuá»‘i.
      this.#tabRouterService.setCurrentTab(newTab);
      this.tabs.set([...updatedTabs, newTab]);

      if (this.tabs().length > 30) {
        this.#sdNotifyService.warning(this.#i18n.t('core.component.tab-router.too-many-tabs'));
      }
    }

    this.tabRouterNav()?.checkUI();
  };

  // Láº§n xuá»‘ng deepest firstChild Ä‘á»ƒ láº¥y snapshot cá»§a route lÃ¡ (route thá»±c sá»± render component).
  #getActivatedRouteSnapshot = (snapshot: ActivatedRouteSnapshot): ActivatedRouteSnapshot | null => {
    let node = snapshot;
    while (node.firstChild) node = node.firstChild;
    return node;
  };

  // DFS match leaf snapshot â†’ ActivatedRoute instance (á»•n Ä‘á»‹nh hÆ¡n so vá»›i so sÃ¡nh component class).
  #findActivatedRouteForSnapshot = (
    activatedRoute: ActivatedRoute,
    targetSnapshot: ActivatedRouteSnapshot,
  ): ActivatedRoute | null => {
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

// Custom Injector cho tá»«ng tab: override ActivatedRoute thÃ nh route cá»§a TAB ÄÃ“
// (khÃ´ng pháº£i route hiá»‡n táº¡i cá»§a router). Náº¿u khÃ´ng override, má»i tab sáº½ inject ActivatedRoute
// cá»§a route Ä‘ang active â†’ component cÅ© trong tab inactive nháº­n data sai khi user navigate.
class SdOutletInjector implements Injector {
  constructor(
    private route: ActivatedRoute | null,
    private parentInjector: Injector
  ) {}

  get(token: any, notFoundValue?: any): any {
    if (token === ActivatedRoute) {
      return this.route || notFoundValue;
    }
    return this.parentInjector.get(token, notFoundValue);
  }
}

