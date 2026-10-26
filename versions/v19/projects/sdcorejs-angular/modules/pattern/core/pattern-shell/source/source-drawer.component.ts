import { ChangeDetectionStrategy, Component, computed, signal, viewChild } from '@angular/core';
import { SdSideDrawer } from '@sdcorejs/angular/components/side-drawer';

/** Files of one scope: a feature folder, or the README and docs on the catalog page. */
export interface PatternSourceScope {
  readonly title: string;
  /** Path prefixes under `modules/pattern/`, e.g. `features/product/`. */
  readonly prefixes: readonly string[];
}

/**
 * "Xem source" of the pattern toolbar: the code that runs on the current screen, read from the manifest that
 * `scripts/generate-pattern-source.mjs` builds from `features/`, `docs/` and `README.md`.
 */
@Component({
  selector: 'sd-pattern-source-drawer',
  standalone: true,
  imports: [SdSideDrawer],
  template: `
    <sd-side-drawer [title]="'Source · ' + scope().title" width="960px" autoId="pattern-source">
      <div class="sd-pattern-source">
        <nav class="sd-pattern-source__files" aria-label="Tệp">
          @for (file of files(); track file.path) {
            <button
              type="button"
              class="sd-pattern-source__file"
              [class.sd-pattern-source__file--active]="file.path === selected()"
              [attr.aria-current]="file.path === selected() ? 'true' : null"
              (click)="selected.set(file.path)">
              {{ file.label }}
            </button>
          } @empty {
            <span class="sd-pattern-source__empty">{{ loaded() ? 'Không có tệp.' : 'Đang tải…' }}</span>
          }
        </nav>
        <div class="sd-pattern-source__code">
          @if (selected(); as path) {
            <div class="sd-pattern-source__path">{{ path }}</div>
            <pre><code>{{ content() }}</code></pre>
          }
        </div>
      </div>
    </sd-side-drawer>
  `,
  styles: `
    .sd-pattern-source {
      display: flex;
      height: 100%;
      min-height: 0;
    }
    .sd-pattern-source__files {
      flex: 0 0 260px;
      display: flex;
      flex-direction: column;
      padding: 8px;
      overflow: auto;
      border-right: 1px solid var(--sd-border);
    }
    .sd-pattern-source__file {
      padding: 6px 8px;
      border: 0;
      border-radius: 4px;
      background: transparent;
      color: var(--sd-text);
      font: 12px/18px var(--sd-font-mono, monospace);
      text-align: left;
      cursor: pointer;
      overflow-wrap: anywhere;
    }
    .sd-pattern-source__file:hover {
      background: var(--sd-surface-muted);
    }
    .sd-pattern-source__file--active {
      background: var(--sd-primary-light);
      color: var(--sd-primary);
    }
    .sd-pattern-source__empty {
      padding: 8px;
      color: var(--sd-text-secondary);
      font-size: 13px;
    }
    .sd-pattern-source__code {
      flex: 1 1 0;
      min-width: 0;
      overflow: auto;
      padding: 12px 16px;
    }
    .sd-pattern-source__path {
      margin-bottom: 8px;
      color: var(--sd-text-secondary);
      font: 12px/18px var(--sd-font-mono, monospace);
    }
    pre {
      margin: 0;
      font: 12px/18px var(--sd-font-mono, monospace);
      white-space: pre;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PatternSourceDrawerComponent {
  private readonly drawer = viewChild.required(SdSideDrawer);
  readonly #source = signal<Readonly<Record<string, string>> | null>(null);
  readonly scope = signal<PatternSourceScope>({ title: '', prefixes: [] });
  readonly selected = signal<string | null>(null);
  readonly loaded = computed(() => this.#source() !== null);
  readonly files = computed(() => {
    const source = this.#source();
    const { prefixes } = this.scope();
    if (!source) return [];
    return Object.keys(source)
      .filter(path => prefixes.some(prefix => path === prefix || path.startsWith(prefix)))
      .sort((left, right) => left.localeCompare(right))
      .map(path => {
        const prefix = prefixes.find(item => path.startsWith(item) && item.endsWith('/'));
        return { path, label: prefix ? path.slice(prefix.length) : path };
      });
  });
  readonly content = computed(() => {
    const path = this.selected();
    return path ? (this.#source()?.[path] ?? '') : '';
  });

  /** Opens the drawer on `scope`, selecting `path` or the first file (the feature's `routes.ts` when there is one). */
  async open(scope: PatternSourceScope, path?: string): Promise<void> {
    this.scope.set(scope);
    this.drawer().open();
    if (!this.#source()) {
      const { PATTERN_SOURCE } = await import('./pattern-source.generated');
      this.#source.set(PATTERN_SOURCE);
    }
    const files = this.files().map(file => file.path);
    this.selected.set(path && files.includes(path) ? path : (files.find(file => file.endsWith('/routes.ts')) ?? files[0] ?? null));
  }
}
