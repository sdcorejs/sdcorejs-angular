import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  HostListener,
  Injector,
  afterNextRender,
  computed,
  effect,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatIconModule } from '@angular/material/icon';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';
import { DocsClipboardService } from '../docs/core/docs-clipboard.service';
import { DocsI18nService } from '../docs/core/docs-i18n.service';
import { DocsThemeService } from '../docs/core/docs-theme.service';
import { DocsVersionService } from '../docs/core/docs-version.service';
import { DocsReleaseNotesService } from '../docs/core/docs-release-notes.service';
import { foldSearchText } from '../docs/core/docs-search.utils';
import { PublishedDocsService } from '../docs/core/published-docs.service';
import { DocsFragmentLinkDirective } from '../docs/shared/docs-fragment-link.directive';
import { resolveDocsPageAvailability } from '../docs/shared/docs-page-availability';
import { DocsVersionControlComponent } from '../docs/shared/docs-version-control.component';
import { GlobalSearchComponent } from '../docs/shared/global-search.component';
import {
  MOBILE_NAV_BREAKPOINT_PX,
  buildPrimaryNavigation,
  isTabSwitch,
  resolvePrimaryNavigationId,
  routeCategory,
  routeHasSidebar,
} from './primary-navigation.config';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [
    MatIconModule,
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    DocsFragmentLinkDirective,
    GlobalSearchComponent,
    DocsVersionControlComponent,
  ],
  templateUrl: './shell.component.html',
  styleUrl: './shell.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ShellComponent {
  readonly #router = inject(Router);
  readonly #injector = inject(Injector);
  readonly #publishedDocs = inject(PublishedDocsService);
  readonly versions = inject(DocsVersionService);
  readonly theme = inject(DocsThemeService);
  readonly i18n = inject(DocsI18nService);
  readonly clipboard = inject(DocsClipboardService);
  readonly mobileNavOpen = signal(false);
  readonly searchOpen = signal(false);
  readonly isMobile = signal(typeof window !== 'undefined' && window.innerWidth <= MOBILE_NAV_BREAKPOINT_PX);
  readonly sidebarHidden = computed(() => this.isMobile() && !this.mobileNavOpen());
  /** Groups the reader opened or closed; every other group is open only when it holds the current page. */
  readonly groupOverrides = signal<ReadonlyMap<string, boolean>>(new Map());
  readonly navQuery = signal('');
  readonly currentUrl = signal(this.#router.url);
  readonly hasSidebar = computed(() => routeHasSidebar(this.currentUrl()));
  readonly currentCategory = computed(() => routeCategory(this.currentUrl()));
  readonly publishedDocIds = signal<ReadonlySet<string> | null>(null);
  private readonly mobileMenu = viewChild<ElementRef<HTMLButtonElement>>('mobileMenu');
  private readonly sidebar = viewChild<ElementRef<HTMLElement>>('sidebar');
  private readonly content = viewChild<ElementRef<HTMLElement>>('content');
  readonly currentVersion = computed(() => (this.versions.selectedVersion() ?? this.versions.latestVersion()) || 'latest');
  readonly primaryNavigation = computed(() => {
    const t = this.i18n.t();
    return buildPrimaryNavigation(this.currentVersion()).map(item => ({ ...item, label: t[item.id] }));
  });
  readonly docsHomeLink = computed(() => this.primaryNavigation()[0]?.commands ?? ['/v', this.currentVersion()]);
  readonly activePrimaryNavigationId = computed(() => resolvePrimaryNavigationId(this.currentUrl()));
  readonly #releaseNotes = inject(DocsReleaseNotesService);
  readonly releaseBadges = this.#releaseNotes.badges;
  readonly navGroups = computed(() => {
    const term = foldSearchText(this.navQuery().trim());
    const overrides = this.groupOverrides();
    const badges = this.releaseBadges();
    const t = this.i18n.t();
    return this.i18n
      .navGroups()
      .map(group => ({
        ...group,
        title: t.categories[group.category],
        open: term ? true : (overrides.get(group.category) ?? group.category === this.currentCategory()),
        pages: group.pages
          .filter(page => !term || foldSearchText(page.title).includes(term) || page.slug.includes(term))
          .map(page => {
            const availability = resolveDocsPageAvailability(page, this.publishedDocIds());
            return {
              ...page,
              availability,
              badge: badges.get(page.id) ?? null,
              commands: ['/v', this.currentVersion(), page.category, page.slug, availability === 'live-demo' ? 'examples' : 'overview'],
            };
          })
          .filter(page => page.availability !== 'unavailable'),
      }))
      .filter(group => group.pages.length > 0);
  });
  readonly navMatchCount = computed(() => this.navGroups().reduce((total, group) => total + group.pages.length, 0));
  #indexLoadSequence = 0;

  constructor() {
    void this.versions.load().catch(() => undefined);
    void this.#releaseNotes.load();
    effect(() => {
      const version = this.versions.selectedVersion();
      if (!version) return;
      const sequence = ++this.#indexLoadSequence;
      this.publishedDocIds.set(null);
      void this.#publishedDocs
        .loadIndex(version)
        .then(index => {
          if (sequence !== this.#indexLoadSequence || this.versions.selectedVersion() !== version) return;
          this.publishedDocIds.set(new Set(index.docs.map(document => document.id)));
        })
        .catch(() => {
          if (sequence === this.#indexLoadSequence) this.publishedDocIds.set(null);
        });
    });
    this.#router.events
      .pipe(
        filter((event): event is NavigationEnd => event instanceof NavigationEnd),
        takeUntilDestroyed()
      )
      .subscribe(event => {
        const previousUrl = this.currentUrl();
        const nextUrl = event.urlAfterRedirects;
        const fragment = this.#router.parseUrl(nextUrl).fragment;
        const routeChanged = previousUrl.split('#', 1)[0] !== nextUrl.split('#', 1)[0];
        this.currentUrl.set(event.urlAfterRedirects);
        this.mobileNavOpen.set(false);
        if (fragment !== null) {
          if (routeChanged) {
            afterNextRender(
              () => {
                const target = document.getElementById(fragment);
                if (!target) return;
                target.tabIndex = -1;
                target.focus();
              },
              { injector: this.#injector }
            );
          }
          return;
        }
        // why: /pattern là một app mẫu có focus riêng; sd-page-list trả focus về link đã mở drawer hay trang con.
        // Focus h1 sau mỗi lần đổi route con sẽ lấy mất phần tử đó.
        if (/^\/pattern(?:[/?#]|$)/.test(nextUrl)) return;
        // why: a tab switch keeps focus on the tab the reader chose instead of jumping back to the page title.
        if (isTabSwitch(previousUrl, nextUrl)) return;
        queueMicrotask(() => {
          const content = this.content()?.nativeElement;
          const heading = content?.querySelector<HTMLElement>('h1');
          if (heading) {
            heading.tabIndex = -1;
            heading.focus();
          } else {
            content?.focus();
          }
        });
      });
  }

  @HostListener('window:resize')
  onResize(): void {
    const mobile = window.innerWidth <= MOBILE_NAV_BREAKPOINT_PX;
    this.isMobile.set(mobile);
    if (!mobile) this.mobileNavOpen.set(false);
  }

  @HostListener('document:keydown', ['$event'])
  onDocumentKeydown(event: KeyboardEvent): void {
    if (!this.mobileNavOpen()) return;
    if (event.key === 'Escape') {
      event.preventDefault();
      this.closeMobileNav(true);
      return;
    }
    if (event.key !== 'Tab') return;
    const sidebar = this.sidebar()?.nativeElement;
    const menu = this.mobileMenu()?.nativeElement;
    // why: the header button that closes the drawer stays in the Tab cycle with the drawer's own controls.
    const focusable = [
      ...(menu ? [menu] : []),
      ...(sidebar?.querySelectorAll<HTMLElement>('input, a[href], button:not([disabled])') ?? []),
    ];
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable.at(-1);
    if (!focusable.includes(document.activeElement as HTMLElement)) {
      event.preventDefault();
      (event.shiftKey ? last : first)?.focus();
    } else if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last?.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first?.focus();
    }
  }

  toggleGroup(category: string): void {
    const open = this.navGroups().find(group => group.category === category)?.open ?? false;
    this.groupOverrides.update(current => new Map(current).set(category, !open));
  }

  onNavQuery(event: Event): void {
    this.navQuery.set((event.target as HTMLInputElement).value);
  }

  clearNavQuery(event: Event): void {
    if (!this.navQuery()) return;
    event.stopPropagation();
    this.navQuery.set('');
  }

  toggleMobileNav(): void {
    if (this.mobileNavOpen()) {
      this.closeMobileNav(true);
      return;
    }
    this.mobileNavOpen.set(true);
    afterNextRender(
      () => {
        if (!this.mobileNavOpen()) return;
        this.sidebar()?.nativeElement.querySelector<HTMLElement>('input, a[href], button:not([disabled])')?.focus();
      },
      { injector: this.#injector }
    );
  }

  closeMobileNav(restoreFocus = false): void {
    this.mobileNavOpen.set(false);
    if (restoreFocus) queueMicrotask(() => this.mobileMenu()?.nativeElement.focus());
  }

  goToLatestRelease(): void {
    void this.versions.selectRelease(this.versions.latestRelease()).catch(() => undefined);
  }

  onSearchOpenChange(open: boolean): void {
    if (open) this.mobileNavOpen.set(false);
    this.searchOpen.set(open);
  }
}
