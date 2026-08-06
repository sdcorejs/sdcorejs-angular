import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'docs-not-found',
  standalone: true,
  imports: [RouterLink],
  template: `
    <main class="not-found">
      <span class="not-found__code">404</span>
      <h1>Documentation page not found</h1>
      <p>The requested component, form, service, version, or tab does not exist in this documentation catalog.</p>
      <div class="not-found__actions">
        <a routerLink="/">Go to documentation home</a>
        <a href="https://github.com/sdcorejs/sdcorejs-angular/issues" target="_blank" rel="noreferrer">Report a broken link</a>
      </div>
    </main>
  `,
  styles: [`
    .not-found {
      max-width: 680px;
      margin: 10vh auto;
      padding: 40px 24px;
      text-align: center;
    }
    .not-found__code { color: var(--sd-primary); font-size: 72px; font-weight: 700; line-height: 1; }
    h1 { margin-top: 14px; font-size: clamp(28px, 5vw, 44px); }
    p { margin: 16px auto 24px; color: var(--docs-text-secondary); line-height: 1.7; }
    .not-found__actions { display: flex; flex-wrap: wrap; justify-content: center; gap: 12px; }
    .not-found__actions a {
      border: 1px solid var(--docs-border-color);
      border-radius: 9px;
      background: var(--docs-surface-raised);
      padding: 10px 14px;
      font-weight: 600;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DocsNotFoundComponent {}
