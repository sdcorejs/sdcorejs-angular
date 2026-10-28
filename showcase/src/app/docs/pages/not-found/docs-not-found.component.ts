import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatIconModule } from '@angular/material/icon';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { DocsI18nService } from '../../core/docs-i18n.service';
import { closestPages } from '../../core/docs-search-index';
import { DocsVersionService } from '../../core/docs-version.service';
import { DOC_NAV_GROUPS, DOC_PAGES } from '../../core/documentation.registry';

const ICONS = new Map(DOC_NAV_GROUPS.map(group => [group.category, group.icon]));

/** 404: the missing path, closest matches from its slug tokens, a prefilled search and recovery links. */
@Component({
  selector: 'docs-not-found',
  standalone: true,
  imports: [MatIconModule, RouterLink],
  template: `
    @let t = i18n.t();
    <main class="not-found">
      <p class="not-found__path"><span>404</span>{{ missingPath() }}</p>
      <h1>{{ i18n.format('nfTitle', { v: release() }) }}</h1>
      <p class="not-found__lead">{{ t.nfLead }}</p>
      <a class="not-found__search" [routerLink]="['/v', version(), 'search']" [queryParams]="{ q: searchTerm() }">
        <mat-icon aria-hidden="true">search</mat-icon>{{ i18n.format('searchFor', { q: searchTerm() }) }}
      </a>
      @if (suggestions().length) {
        <h2 class="not-found__label">{{ t.didYouMean }}</h2>
        <div class="not-found__list">
          @for (page of suggestions(); track page.id) {
            <a [routerLink]="page.commands">
              <mat-icon aria-hidden="true">{{ page.icon }}</mat-icon>
              <span><strong>{{ page.title }}</strong><code>{{ page.path }}</code></span>
              <mat-icon aria-hidden="true">arrow_forward</mat-icon>
            </a>
          }
        </div>
      }
      <h2 class="not-found__label">{{ t.orTry }}</h2>
      <div class="not-found__links">
        <a [routerLink]="['/v', version()]"><mat-icon aria-hidden="true">home</mat-icon>{{ t.docsHome }}</a>
        <a [routerLink]="['/v', version(), 'changelog']"><mat-icon aria-hidden="true">history</mat-icon>{{ t.changelog }} {{ release() }}</a>
        <a href="https://github.com/sdcorejs/sdcorejs-angular/issues" target="_blank" rel="noopener noreferrer"
          ><mat-icon aria-hidden="true">link_off</mat-icon>{{ t.reportLink }}</a
        >
      </div>
    </main>
  `,
  styleUrl: './docs-not-found.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DocsNotFoundComponent {
  readonly #router = inject(Router);
  readonly i18n = inject(DocsI18nService);
  readonly versions = inject(DocsVersionService);
  readonly queryParams = toSignal(inject(ActivatedRoute).queryParamMap);
  /** Path to report; defaults to the ?path= of a legacy redirect, then the current URL. */
  readonly path = input<string | null>(null);

  readonly version = computed(() => this.versions.resolvedPackageVersion() || 'latest');
  readonly release = computed(() => this.versions.selectedRelease() || this.version());
  readonly missingPath = computed(() => {
    const path = this.path() ?? this.queryParams()?.get('path');
    return path ? `/${path.replace(/^\/+/, '')}` : this.#router.url.split(/[?#]/, 1)[0];
  });
  readonly slug = computed(() => this.missingPath().split('/').filter(Boolean).at(-1) ?? '');
  readonly searchTerm = computed(() => {
    const tokens = this.slug().split(/[^A-Za-z0-9]+/).filter(token => token.length >= 4);
    return tokens.at(-1) ?? this.slug();
  });
  readonly suggestions = computed(() =>
    closestPages(this.slug(), DOC_PAGES).map(page => {
      const commands = ['/v', this.version(), page.category, page.slug, 'overview'];
      return { id: page.id, title: page.title, icon: ICONS.get(page.category) ?? 'article', commands, path: commands.slice(0, 4).join('/') };
    })
  );
}
