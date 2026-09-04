import { A11yModule } from '@angular/cdk/a11y';
import { DOCUMENT } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, computed, effect, inject, input, signal, untracked } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router } from '@angular/router';
import { SdIcon } from '@sdcorejs/angular/modules/icon';
import { I18nService, SdTranslatePipe } from '@sdcorejs/angular/i18n';
import { sdIsExternalHttpUrl, sdOpenExternal } from '@sdcorejs/angular/utilities';
import { SdLayoutUserInfo, SidebarConfigurationV2 } from '../../configurations';
import { SdLayoutMenu, SdLayoutNavigationStateService, getMenuStableKey, selectPrimaryMenuGroups } from '../../services';
import { SdLayoutMenuTreeComponent } from '../shared/menu-tree/menu-tree.component';
import { SdLayoutSearchFieldComponent } from '../shared/search-field/search-field.component';
import { SdLayoutUserMenuComponent } from '../shared/user-menu/user-menu.component';

@Component({
  selector: 'sd-sidebar-mobile-v2',
  standalone: true,
  imports: [A11yModule, SdIcon, SdLayoutSearchFieldComponent, SdLayoutMenuTreeComponent, SdLayoutUserMenuComponent, SdTranslatePipe],
  templateUrl: './main.component.html',
  styleUrl: './main.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SdSidebarMobileV2 {
  readonly #router = inject(Router);
  readonly #i18n = inject(I18nService);
  readonly #document = inject(DOCUMENT);
  readonly #destroyRef = inject(DestroyRef);
  readonly #navigationState = inject(SdLayoutNavigationStateService);
  #restoreFocusElement: HTMLElement | null = null;
  #previousBodyOverflow = '';

  menus = input<SdLayoutMenu[]>([]);
  userInfo = input.required<SdLayoutUserInfo>();
  sidebar = input.required<SidebarConfigurationV2>();
  primaryMenus = computed(() => selectPrimaryMenuGroups(this.menus(), this.sidebar().primaryMenuIds));
  overflowMenus = computed(() => {
    const primaryKeys = new Set(this.primaryMenus().map(menu => getMenuStableKey(menu)));
    return this.menus().filter(menu => !primaryKeys.has(getMenuStableKey(menu)));
  });
  isSheetOpen = signal(false);
  sheetGroupKey = signal('');
  sheetTitle = signal('');
  sheetMenus = signal<SdLayoutMenu[]>([]);
  searchText = signal('');
  activePath = signal(this.#router.url.split(/[?#]/, 1)[0] ?? '');
  pinnedKeys = this.#navigationState.pinnedKeys;

  constructor() {
    effect(() => {
      const menus = this.menus();
      untracked(() => this.#navigationState.hydrate(menus));
    });
    this.#router.events.pipe(takeUntilDestroyed(this.#destroyRef)).subscribe(event => {
      if (!(event instanceof NavigationEnd)) return;
      this.activePath.set(event.urlAfterRedirects.split(/[?#]/, 1)[0] ?? '');
      this.closeSheet(false);
    });
    this.#destroyRef.onDestroy(() => this.#releaseBodyScroll());
  }

  openMore(trigger?: EventTarget | null): void {
    this.#openSheet('more', this.#i18n.t('core.module.layout.sidebar.more'), this.overflowMenus(), trigger);
  }

  activateMenu(menu: SdLayoutMenu, trigger?: EventTarget | null): void {
    if ('path' in menu) {
      this.#navigate(menu);
      return;
    }
    this.#openSheet(getMenuStableKey(menu), menu.title || 'Menu', menu.children ?? [], trigger);
  }

  closeSheet(restoreFocus = true): void {
    if (!this.isSheetOpen()) return;
    this.isSheetOpen.set(false);
    this.searchText.set('');
    this.#releaseBodyScroll();
    if (restoreFocus) this.#restoreFocusElement?.focus();
    this.#restoreFocusElement = null;
  }

  onSheetKeydown(event: KeyboardEvent): void {
    if (event.key !== 'Escape') return;
    event.preventDefault();
    this.closeSheet();
  }

  onNavigate(menu: SdLayoutMenu): void {
    if ('path' in menu) this.#navigate(menu);
  }

  onTogglePinned(menu: SdLayoutMenu): void {
    this.#navigationState.togglePinned(menu);
  }

  #openSheet(key: string, title: string, menus: SdLayoutMenu[], trigger?: EventTarget | null): void {
    this.sheetGroupKey.set(key);
    this.sheetTitle.set(title);
    this.sheetMenus.set(menus);
    this.searchText.set('');
    this.#restoreFocusElement =
      trigger instanceof HTMLElement ? trigger : this.#document.activeElement instanceof HTMLElement ? this.#document.activeElement : null;
    if (!this.isSheetOpen()) {
      this.#previousBodyOverflow = this.#document.body.style.overflow;
      this.#document.body.style.overflow = 'hidden';
    }
    this.isSheetOpen.set(true);
  }

  #navigate(menu: Extract<SdLayoutMenu, { path: string }>): void {
    this.#navigationState.recordRecent(menu, { enabled: true, maxItems: 5 });
    // why: `includes('http')` là substring test — `javascript:fetch(...)//http` lọt qua và chạy như
    // script trong origin của app. Parse URL thật rồi mới mở, kèm `noopener,noreferrer`.
    if (sdIsExternalHttpUrl(menu.path)) {
      sdOpenExternal(menu.path);
      this.closeSheet();
      return;
    }
    void this.#router
      .navigate([menu.path.split('?')[0]], { queryParams: menu.queryParams ?? {}, state: { switchTab: true } })
      .then(navigated => {
        if (navigated) this.closeSheet();
      });
  }

  #releaseBodyScroll(): void {
    this.#document.body.style.overflow = this.#previousBodyOverflow;
  }
}
