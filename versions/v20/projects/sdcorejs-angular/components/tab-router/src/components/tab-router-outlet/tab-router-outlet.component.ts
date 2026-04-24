/* eslint-disable @typescript-eslint/no-explicit-any */
import { 
  Component, 
  Injector, 
  OnDestroy, 
  Type, 
  ViewChild, 
  inject, 
  signal, 
  createNgModule,
  NgModuleFactory
} from '@angular/core';
import { 
  ActivatedRoute, 
  ActivatedRouteSnapshot, 
  NavigationEnd, 
  Router, 
  RouterEvent, 
  RoutesRecognized 
} from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Subject, Subscription, isObservable, lastValueFrom } from 'rxjs';
import { filter, map } from 'rxjs/operators';

import { SdNotifyService } from '@sdcorejs/angular/services/notify';
import { SdUtilities } from '@sdcorejs/angular/utilities';
import { SdTabActivated, SdTabDeactivated } from '../../events/tab-router.event';
import { SdTabAction } from '../../actions/tab-router.action';
import { SdTab } from '../../models';
import { SdTabDecoratorService } from '../../services/tab-decorator.service';
import { SdTabRouterService } from '../../services/tab-router.service';
import { SdTabRouterNavComponent } from '../tab-router-nav/tab-router-nav.component';

@Component({
  selector: 'sd-tab-router-outlet',
  templateUrl: './tab-router-outlet.component.html',
  styleUrls: ['./tab-router-outlet.component.scss'],
  standalone: true,
  imports: [CommonModule, MatIconModule, MatTooltipModule, SdTabRouterNavComponent],
})
export class SdTabRouterOutletComponent implements OnDestroy {
  @ViewChild('tabRouterNav') tabRouterNav?: SdTabRouterNavComponent;
  
  tabs = signal<SdTab[]>([]);

  #router = inject(Router);
  #activatedRoute = inject(ActivatedRoute);
  #injector = inject(Injector);
  #tabRouterService = inject(SdTabRouterService);
  #sdNotifyService = inject(SdNotifyService);
  #tabDecoratorService = inject(SdTabDecoratorService);

  #rootRoute?: ActivatedRoute;
  #subscription = new Subscription();
  #firstLoad = true;

  constructor() {
    this.#subscription.add(
      this.#router.events
        .pipe(
          map((event: any) => (event instanceof RouterEvent ? event : event.routerEvent)),
          filter(event => event instanceof RoutesRecognized || event instanceof NavigationEnd)
        )
        .subscribe(async (event: any) => {
          if (this.#firstLoad && event instanceof NavigationEnd) {
            this.#firstLoad = false;
            const route = this.#getActivatedRouteSnapshot(this.#activatedRoute.snapshot);
            this.#rootRoute = this.#router.routerState.root;
            await this.#activeRoute(event.urlAfterRedirects || event.url, route);
            return;
          }
          if (!this.#firstLoad && event instanceof RoutesRecognized) {
            const route = this.#getActivatedRouteSnapshot(event.state.root);
            this.#rootRoute = this.#router.routerState.root;
            await this.#activeRoute(event.urlAfterRedirects || event.url, route);
          }
        })
    );

    this.#subscription.add(
      this.#tabRouterService.actions.subscribe((event: SdTabAction | undefined) => {
        if (event?.type === 'close') {
          this.#closeTab(event.tab);
        }
      })
    );
  }

  ngOnDestroy(): void {
    this.#subscription.unsubscribe();
  }

  tabTrackBy = (index: number, tab: SdTab) => tab.key;

  #closeTab = (tab: SdTab) => {
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
      this.tabRouterNav?.checkUI();
    }
  };

  #activeRoute = async (fullUrl: string, route: ActivatedRouteSnapshot | null) => {
    if (!route?.component) return;

    const component = route.component as Type<any>;
    const queryParams = { ...(route.queryParams || {}) };
    const params = { ...(route.params || {}) };
    const data = { ...(route.data || {}) };
    const [url] = fullUrl.split('?');
    const key = SdUtilities.hash({ url, queryParams });

    let existedIndex = -1;
    let activatedIndex = -1;
    
    const currentTabs = this.tabs();
    currentTabs.forEach((tab, index) => {
      if (tab.key === key) {
        tab.isActive = true;
        existedIndex = index;
      } else {
        if (tab.isActive) {
          activatedIndex = index;
          this.#tabRouterService.pushEvent(tab, SdTabDeactivated);
        }
        tab.isActive = false;
      }
    });

    const currentNavigation = this.#router.getCurrentNavigation();
    const switchTab = currentNavigation?.extras?.state?.['switchTab'];
    const replaceTab = currentNavigation?.extras?.state?.['replaceTab'];

    // --- Xá»¬ LÃ INJECTOR VÃ€ FIX Lá»–I TYPE TS(2345) ---
    const getBestInjector = async (snapshot: ActivatedRouteSnapshot): Promise<Injector> => {
      // 1. Náº¿u lÃ  Standalone Route, láº¥y injector tá»« chÃ­nh route config (Ä‘Ã£ Ä‘Æ°á»£c router resolve)
      const routeInjector = (snapshot as any)._resolvedGui || (snapshot as any).routeConfig?._injector;
      if (routeInjector) return routeInjector;

      // 2. Xá»­ lÃ½ NgModule (Lazy load kiá»ƒu cÅ©)
      const loadChildren = snapshot.parent?.routeConfig?.loadChildren;
      if (typeof loadChildren === 'function') {
        let loaded: any = await loadChildren();
        
        // Unwrap Observable
        if (isObservable(loaded)) {
          loaded = await lastValueFrom(loaded);
        }
        
        // Unwrap Default Export (ES Module)
        if (loaded && typeof loaded === 'object' && 'default' in loaded) {
          loaded = loaded.default;
        }

        // Náº¿u lÃ  NgModuleFactory (Angular cÅ© hÆ¡n)
        if (loaded instanceof NgModuleFactory) {
          return loaded.create(this.#injector).injector;
        }

        // Náº¿u lÃ  Type (Class NgModule) - ÄÃ¢y lÃ  chá»— fix lá»—i TS(2345)
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
    const activatedRoute = this.#getActivatedRoute(this.#rootRoute!, component);
    
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

    if (existedIndex >= 0) {
      const updatedTabs = [...currentTabs];
      if (replaceTab && activatedIndex >= 0) {
        updatedTabs.splice(activatedIndex, 1);
      }
      if (switchTab) {
        this.#tabRouterService.setCurrentTab(updatedTabs[existedIndex]);
        this.#tabRouterService.pushEvent(updatedTabs[existedIndex], SdTabActivated);
      } else {
        updatedTabs[existedIndex] = newTab;
      }
      this.tabs.set(updatedTabs);
    } else {
      const updatedTabs = [...currentTabs];
      this.#tabRouterService.setCurrentTab(newTab);
      if (activatedIndex >= 0 && replaceTab) {
        updatedTabs.splice(activatedIndex, 1);
      }
      this.tabs.set([...updatedTabs, newTab]);
      
      if (this.tabs().length > 10) {
        this.#sdNotifyService.warning('Báº¡n Ä‘Ã£ má»Ÿ quÃ¡ nhiá»u tab.');
      }
    }
    
    this.tabRouterNav?.checkUI();
  };

  #getActivatedRouteSnapshot = (snapshot: ActivatedRouteSnapshot): ActivatedRouteSnapshot | null => {
    let node = snapshot;
    while (node.firstChild) node = node.firstChild;
    return node;
  };

  #getActivatedRoute = (activatedRoute: ActivatedRoute, component: any): ActivatedRoute | null => {
    if (activatedRoute.component === component) return activatedRoute;
    for (const child of activatedRoute.children) {
      const result = this.#getActivatedRoute(child, component);
      if (result) return result;
    }
    return null;
  };
}

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
