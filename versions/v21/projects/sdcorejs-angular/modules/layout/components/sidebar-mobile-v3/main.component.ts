import { A11yModule } from '@angular/cdk/a11y';
import { DOCUMENT } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
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
import { SdLayoutUserInfo, SidebarConfigurationV3, resolveSidebarV3Recent } from '../../configurations';
import { SdLayoutMenu, SdLayoutNavigationStateService, SdLayoutRootMenu, searchMenuLeaves } from '../../services';
import { SdLayoutMenuTreeComponent } from '../shared/menu-tree/menu-tree.component';
import { SdLayoutSearchFieldComponent } from '../shared/search-field/search-field.component';
import { SdLayoutUserMenuComponent } from '../shared/user-menu/user-menu.component';

@Component({
  selector: 'sidebar-mobile-v3',
  standalone: true,
  imports: [A11yModule, SdIcon, SdLayoutSearchFieldComponent, SdLayoutMenuTreeComponent, SdLayoutUserMenuComponent],
  templateUrl: './main.component.html',
  styleUrl: './main.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SidebarMobileV3Component {
  readonly #router = inject(Router);
  readonly #document = inject(DOCUMENT);
  readonly #destroyRef = inject(DestroyRef);
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
    if (menu.path.includes('http')) {
      this.#document.defaultView?.open(menu.path, '_blank', 'noopener');
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
