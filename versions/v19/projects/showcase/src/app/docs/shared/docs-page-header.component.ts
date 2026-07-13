import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DocPageDefinition } from '../core/documentation.models';

@Component({
  selector: 'docs-page-header',
  standalone: true,
  imports: [RouterLink],
  template: `
    @let currentPage = page();
    <nav class="breadcrumbs" aria-label="Breadcrumb">
      <a routerLink="/">Docs</a><span>/</span>
      <a [routerLink]="['/v', version()]">v{{ version() }}</a><span>/</span>
      <span>{{ currentPage.category }}</span><span>/</span><span>{{ currentPage.title }}</span>
    </nav>

    @if (invalidVersion(); as invalid) {
      <div class="version-notice" role="status">Version “{{ invalid }}” is unavailable. Showing v{{ version() }} instead.</div>
    }

    <header class="page-header">
      <div>
        <div class="page-header__badges"><span>{{ currentPage.category }}</span><span>{{ currentPage.status }}</span></div>
        <h1>{{ currentPage.title }}</h1>
        <p lang="vi">{{ currentPage.description }}</p>
      </div>
      @if (sourceUrl(); as url) { <a [href]="url" target="_blank" rel="noreferrer">View source</a> }
    </header>
  `,
  styles: [`
    :host { display: block; }
    .breadcrumbs { display: flex; flex-wrap: wrap; gap: 7px; margin-bottom: 20px; color: var(--docs-text-muted); font-size: 12px; text-transform: capitalize; }
    .version-notice { margin-bottom: 18px; border: 1px solid var(--sd-info, #0288d1); border-radius: 9px; background: color-mix(in srgb, var(--sd-info, #0288d1) 9%, var(--docs-surface)); padding: 11px 14px; color: var(--docs-text-secondary); font-size: 13px; }
    .page-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 24px; }
    .page-header h1 { margin: 8px 0 9px; font-size: clamp(34px, 5vw, 52px); }
    .page-header p { max-width: 760px; margin: 0; color: var(--docs-text-secondary); font-size: 17px; line-height: 1.65; }
    .page-header > a { white-space: nowrap; }
    .page-header__badges { display: flex; gap: 6px; }
    .page-header__badges span { border-radius: 999px; background: var(--docs-surface-muted); padding: 4px 8px; color: var(--docs-text-secondary); font-size: 11px; text-transform: uppercase; }
    @media (max-width: 680px) { .page-header { flex-direction: column; } }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DocsPageHeaderComponent {
  readonly page = input.required<DocPageDefinition>();
  readonly version = input.required<string>();
  readonly invalidVersion = input<string | null>(null);
  readonly sourceUrl = input<string | null>(null);
}
