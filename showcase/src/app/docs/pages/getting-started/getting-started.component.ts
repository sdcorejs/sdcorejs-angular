import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { buildCoreUiSetupCommand } from '../../core/docs-installation.utils';
import { DOC_NAV_GROUPS } from '../../core/documentation.registry';

@Component({
  selector: 'docs-getting-started',
  standalone: true,
  imports: [RouterLink],
  template: `
    <main class="getting-started">
      <nav class="breadcrumbs" aria-label="Breadcrumb">
        <a [routerLink]="['/v', version()]">Docs</a><span>/</span> <a [routerLink]="['/v', version()]">v{{ version() }}</a
        ><span>/</span>
        <span>Getting started</span>
      </nav>

      <header class="intro">
        <span>Start here</span>
        <h1>Get started with &#64;sdcorejs/angular</h1>
        <p>Install Core UI, load its shared theme and configure Angular animations before choosing your first building block.</p>
        <div class="intro__requirements"><span>Angular 19–22</span><span>Angular Material</span><span>Standalone ready</span></div>
      </header>

      <ol class="setup" aria-label="Installation steps">
        <li class="setup-step">
          <span class="setup-step__number">1</span>
          <div>
            <h2>Install the package</h2>
            <p>Use the package line that matches your Angular major.</p>
            <pre><code>{{ installCommand() }}</code></pre>
          </div>
        </li>
        <li class="setup-step">
          <span class="setup-step__number">2</span>
          <div>
            <h2>Load Core UI styles</h2>
            <p>Add the public SCSS entry point to your global <code>styles.scss</code>.</p>
            <pre><code>&#64;use '&#64;sdcorejs/angular/assets/scss/sd-core.scss';</code></pre>
          </div>
        </li>
        <li class="setup-step">
          <span class="setup-step__number">3</span>
          <div>
            <h2>Load the icon and text fonts</h2>
            <p>Add the Material Symbols and Roboto font stylesheets to <code>index.html</code>.</p>
            <pre><code>&lt;link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined" rel="stylesheet" /&gt;
&lt;link href="https://fonts.googleapis.com/css2?family=Roboto:wght&#64;400;500;600&amp;display=swap" rel="stylesheet" /&gt;</code></pre>
          </div>
        </li>
        <li class="setup-step">
          <span class="setup-step__number">4</span>
          <div>
            <h2>Enable Angular animations</h2>
            <p>
              Add <code>provideAnimationsAsync()</code> to your application providers, then import standalone Core UI features where they
              are used.
            </p>
            <pre><code>import &#123; provideAnimationsAsync &#125; from '&#64;angular/platform-browser/animations/async';

providers: [provideAnimationsAsync()]</code></pre>
          </div>
        </li>
      </ol>

      <section class="next-steps" aria-labelledby="next-steps-title">
        <header>
          <span>Explore the catalog</span>
          <h2 id="next-steps-title">Choose your next step</h2>
          <p>Each category combines versioned API reference material with live examples where a showcase is available.</p>
        </header>
        <div class="category-links">
          @for (item of categoryLinks(); track item.category) {
            <a class="category-link" [routerLink]="item.commands">
              <strong>{{ item.title }}</strong>
              <span>{{ item.pages.length }} references</span>
              <span class="category-link__action">Browse <span aria-hidden="true">→</span></span>
            </a>
          }
        </div>
      </section>
    </main>
  `,
  styleUrl: './getting-started.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GettingStartedComponent {
  readonly #route = inject(ActivatedRoute);
  readonly params = toSignal(this.#route.paramMap, { initialValue: this.#route.snapshot.paramMap });
  readonly version = computed(() => this.params().get('version') || 'latest');
  readonly installCommand = computed(() => buildCoreUiSetupCommand(this.version()));
  readonly categoryLinks = computed(() =>
    DOC_NAV_GROUPS.map(group => ({
      ...group,
      commands: ['/v', this.version(), group.category],
    }))
  );
}
