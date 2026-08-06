import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'docs-about',
  standalone: true,
  imports: [RouterLink],
  template: `
    <main class="about">
      <nav class="about__breadcrumb" aria-label="Breadcrumb"><a routerLink="/">Docs</a><span>/</span><span>About</span></nav>

      <section class="about__hero" aria-labelledby="about-title">
        <div class="about__brand" aria-hidden="true">
          <img class="about__mark" src="assets/brand/sdcorejs-logo.png" alt="" />
        </div>
        <div class="about__intro">
          <span class="about__eyebrow">Open-source Angular UI library</span>
          <h1 id="about-title">&#64;sdcorejs/angular</h1>
          <p>Reusable components, forms, services, and application building blocks for data-rich Angular products.</p>
          <ul aria-label="Library highlights">
            <li>Standalone</li>
            <li>Signal-first</li>
            <li>OnPush</li>
            <li>i18n-ready</li>
          </ul>
          <div class="about__actions">
            <a href="https://www.npmjs.com/package/@sdcorejs/angular" target="_blank" rel="noreferrer">View npm package</a>
            <a href="https://github.com/sdcorejs/sdcorejs-angular" target="_blank" rel="noreferrer">Browse GitHub</a>
          </div>
        </div>
      </section>

      <div class="about__grid">
        <section>
          <span class="about__eyebrow">Purpose</span>
          <h2>Built for real Angular applications</h2>
          <p>
            SDCoreJS brings common product patterns into one typed library so teams can spend less time rebuilding tables, form controls,
            feedback, navigation, and document workflows.
          </p>
          <h3>What you get</h3>
          <ul class="about__feature-list">
            <li><strong>Composable UI</strong><span>Components for data, layout, editing, feedback, and workflow screens.</span></li>
            <li><strong>Consistent forms</strong><span>Controls with validation, form integration, and view states.</span></li>
            <li><strong>Application services</strong><span>Notifications, confirmation, loading, storage, and file tooling.</span></li>
            <li><strong>Practical documentation</strong><span>Versioned API references paired with interactive examples.</span></li>
          </ul>
        </section>

        <aside aria-label="Compatibility and project links">
          <section>
            <h2>Compatibility</h2>
            <p>Maintained for Angular 19, 20, and 21. Choose the package major that matches your Angular application.</p>
          </section>
          <section>
            <h2>Project links</h2>
            <a href="https://github.com/sdcorejs/sdcorejs-angular" target="_blank" rel="noreferrer">Source repository</a>
            <a href="https://www.npmjs.com/package/@sdcorejs/angular" target="_blank" rel="noreferrer">npm package</a>
            <a href="https://github.com/sdcorejs/sdcorejs-angular/blob/main/LICENSE" target="_blank" rel="noreferrer">License</a>
            <a routerLink="/v/latest/changelog">Changelog</a>
          </section>
        </aside>
      </div>

      <section class="about__contribute" aria-labelledby="contribute-title">
        <div>
          <span class="about__eyebrow">Community</span>
          <h2 id="contribute-title">Contribute to SDCoreJS</h2>
          <p>
            Report a reproducible issue, discuss a focused improvement, or open a pull request with tests and a clear explanation of the
            user impact.
          </p>
        </div>
        <div class="about__actions">
          <a href="https://github.com/sdcorejs/sdcorejs-angular/issues" target="_blank" rel="noreferrer">Open an issue</a>
          <a href="https://github.com/sdcorejs/sdcorejs-angular/pulls" target="_blank" rel="noreferrer">View pull requests</a>
        </div>
      </section>
    </main>
  `,
  styleUrl: './about.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AboutComponent {}
