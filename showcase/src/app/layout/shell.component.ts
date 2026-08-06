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
import { DocsVersionService } from '../docs/core/docs-version.service';
import { DOC_NAV_GROUPS } from '../docs/core/documentation.registry';
import { PublishedDocsService } from '../docs/core/published-docs.service';
import { DocsFragmentLinkDirective } from '../docs/shared/docs-fragment-link.directive';
import { resolveDocsPageAvailability } from '../docs/shared/docs-page-availability';
import { GlobalSearchComponent } from '../docs/shared/global-search.component';
import { VersionSelectorComponent } from '../docs/shared/version-selector.component';
import { MOBILE_NAV_BREAKPOINT_PX, buildPrimaryNavigation, resolvePrimaryNavigationId } from './primary-navigation.config';

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
    VersionSelectorComponent,
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
  readonly mobileNavOpen = signal(false);
  readonly searchOpen = signal(false);
  readonly isMobile = signal(typeof window !== 'undefined' && window.innerWidth <= MOBILE_NAV_BREAKPOINT_PX);
  readonly sidebarHidden = computed(() => this.isMobile() && !this.mobileNavOpen());
  readonly collapsed = signal<ReadonlySet<string>>(new Set());
  readonly currentUrl = signal(this.#router.url);
  readonly publishedDocIds = signal<ReadonlySet<string> | null>(null);
  private readonly mobileMenu = viewChild<ElementRef<HTMLButtonElement>>('mobileMenu');
  private readonly sidebar = viewChild<ElementRef<HTMLElement>>('sidebar');
  private readonly content = viewChild<ElementRef<HTMLElement>>('content');
  readonly currentVersion = computed(() => (this.versions.selectedVersion() ?? this.versions.latestVersion()) || 'latest');
  readonly primaryNavigation = computed(() => buildPrimaryNavigation(this.currentVersion()));
  readonly docsHomeLink = computed(() => this.primaryNavigation()[0]?.commands ?? ['/v', this.currentVersion()]);
  readonly activePrimaryNavigationId = computed(() => resolvePrimaryNavigationId(this.currentUrl()));
  readonly navGroups = computed(() =>
    DOC_NAV_GROUPS.map(group => ({
      ...group,
      collapsed: this.collapsed().has(group.category),
      pages: group.pages
        .map(page => {
          const availability = resolveDocsPageAvailability(page, this.publishedDocIds());
          return {
            ...page,
            availability,
            commands: ['/v', this.currentVersion(), page.category, page.slug, availability === 'live-demo' ? 'examples' : 'overview'],
          };
        })
        .filter(page => page.availability !== 'unavailable'),
    })).filter(group => group.pages.length > 0)
  );
  #indexLoadSequence = 0;

  constructor() {
    void this.versions.load().catch(() => undefined);
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
    const focusable = [...(sidebar?.querySelectorAll<HTMLElement>('a[href], button:not([disabled])') ?? [])];
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable.at(-1);
    if (!sidebar?.contains(document.activeElement)) {
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
    this.collapsed.update(current => {
      const next = new Set(current);
      if (next.has(category)) next.delete(category);
      else next.add(category);
      return next;
    });
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
        this.sidebar()?.nativeElement.querySelector<HTMLElement>('a[href], button:not([disabled])')?.focus();
      },
      { injector: this.#injector }
    );
  }

  closeMobileNav(restoreFocus = false): void {
    this.mobileNavOpen.set(false);
    if (restoreFocus) queueMicrotask(() => this.mobileMenu()?.nativeElement.focus());
  }

  onSearchOpenChange(open: boolean): void {
    if (open) this.mobileNavOpen.set(false);
    this.searchOpen.set(open);
  }
}
