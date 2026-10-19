import { A11yModule } from '@angular/cdk/a11y';
import { DOCUMENT } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  Injector,
  computed,
  effect,
  inject,
  input,
  signal,
  untracked,
  viewChild,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router } from '@angular/router';
import { SdIcon } from '@sdcorejs/angular/modules/icon';
import { sdIsExternalHttpUrl, sdOpenExternal } from '@sdcorejs/angular/utilities';
import { SdLayoutUserInfo, SidebarConfigurationV3, resolveSidebarV3Recent } from '../../configurations';
import { SdLayoutContextService, SdLayoutMenu, SdLayoutNavigationStateService, SdLayoutRootMenu, searchMenuLeaves } from '../../services';
import { SdLayoutContextSwitcher } from '../shared/context-switcher/context-switcher.component';
import { SdLayoutMenuTreeComponent } from '../shared/menu-tree/menu-tree.component';
import { SdLayoutSearchFieldComponent } from '../shared/search-field/search-field.component';
import { SdLayoutUserMenuComponent } from '../shared/user-menu/user-menu.component';
import { SdTranslatePipe } from '@sdcorejs/angular/i18n';

@Component({
  selector: 'sd-sidebar-mobile-v3',
  standalone: true,
  imports: [
    A11yModule,
    SdIcon,
    SdLayoutContextSwitcher,
    SdLayoutSearchFieldComponent,
    SdLayoutMenuTreeComponent,
    SdLayoutUserMenuComponent,
    SdTranslatePipe,
  ],
  templateUrl: './main.component.html',
  styleUrl: './main.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SdSidebarMobileV3 {
  readonly #router = inject(Router);
  readonly #document = inject(DOCUMENT);
  readonly #destroyRef = inject(DestroyRef);
  readonly #injector = inject(Injector);
  readonly #navigationState = inject(SdLayoutNavigationStateService);
  private readonly trigger = viewChild<ElementRef<HTMLButtonElement>>('trigger');
  #restoreFocusElement: HTMLElement | null = null;
  #previousBodyOverflow = '';

  menus = input<SdLayoutMenu[]>([]);
  userInfo = input.required<SdLayoutUserInfo>();
  sidebar = input.required<SidebarConfigurationV3>();
  isDrawerOpen = signal(false);
  searchText = signal('');
  activePath = signal(this.#router.url.split(/[?#]/, 1)[0] ?? '');
  searchResults = computed<SdLayoutRootMenu[]>(() => searchMenuLeaves(this.menus(), this.searchText()));
  recentConfiguration = computed(() => resolveSidebarV3Recent(this.sidebar()));
  pinnedKeys = this.#navigationState.pinnedKeys;
  pinnedMenus = this.#navigationState.pinnedMenus;
  recentMenus = this.#navigationState.recentMenus;

  constructor() {
    effect(() => {
      const menus = this.menus();
      const maximum = resolveSidebarV3Recent(this.sidebar()).maxItems;
      untracked(() => this.#navigationState.hydrate(menus, maximum));
    });
    // why: switcher chỉ mount khi drawer mở — đối chiếu context ngay lúc khởi tạo (EXEC-D1, D-021) để listener nhiều tab
    // chạy từ đầu và lần chạm đầu vào menu không kích reload đối chiếu. Không có `context` thì không lấy service: app
    // không cấu hình context không tạo service lẫn listener.
    effect(() => {
      const context = this.sidebar().context;
      if (!context) return;
      const items = context.items;
      untracked(() => this.#injector.get(SdLayoutContextService).syncItems(items));
    });
    this.#router.events.pipe(takeUntilDestroyed(this.#destroyRef)).subscribe(event => {
      if (!(event instanceof NavigationEnd)) return;
      this.activePath.set(event.urlAfterRedirects.split(/[?#]/, 1)[0] ?? '');
      this.closeFromNavigation();
    });
    this.#destroyRef.onDestroy(() => this.#releaseBodyScroll());
  }

  openDrawer(trigger?: EventTarget | null): void {
    this.#restoreFocusElement =
      trigger instanceof HTMLElement
        ? trigger
        : this.#document.activeElement instanceof HTMLElement
          ? this.#document.activeElement
          : (this.trigger()?.nativeElement ?? null);
    if (!this.isDrawerOpen()) {
      this.#previousBodyOverflow = this.#document.body.style.overflow;
      this.#document.body.style.overflow = 'hidden';
    }
    this.isDrawerOpen.set(true);
  }

  closeFromBackdrop(): void {
    this.#closeDrawer();
  }

  closeFromEscape(): void {
    this.#closeDrawer();
  }

  closeFromNavigation(): void {
    this.#closeDrawer();
  }

  onDrawerKeydown(event: KeyboardEvent): void {
    if (event.key !== 'Escape') return;
    event.preventDefault();
    this.closeFromEscape();
  }

  navigateMenu(menu: SdLayoutMenu): void {
    if (!('path' in menu)) return;
    this.#navigationState.recordRecent(menu, this.recentConfiguration());
    // why: `includes('http')` là substring test — `javascript:fetch(...)//http` lọt qua và chạy như
    // script trong origin của app. Parse URL thật rồi mới mở, kèm `noopener,noreferrer`.
    if (sdIsExternalHttpUrl(menu.path)) {
      sdOpenExternal(menu.path);
      this.closeFromNavigation();
      return;
    }
    void this.#router
      .navigate([menu.path.split('?')[0]], { queryParams: menu.queryParams ?? {}, state: { switchTab: true } })
      .then(navigated => {
        if (navigated) this.closeFromNavigation();
      });
  }

  onTogglePinned(menu: SdLayoutMenu): void {
    this.#navigationState.togglePinned(menu);
  }

  #closeDrawer(): void {
    if (!this.isDrawerOpen()) return;
    this.isDrawerOpen.set(false);
    this.searchText.set('');
    this.#releaseBodyScroll();
    (this.#restoreFocusElement ?? this.trigger()?.nativeElement)?.focus();
    this.#restoreFocusElement = null;
  }

  #releaseBodyScroll(): void {
    this.#document.body.style.overflow = this.#previousBodyOverflow;
  }
}
