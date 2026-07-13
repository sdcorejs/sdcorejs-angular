import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { DocsVersionService } from '../core/docs-version.service';

@Component({
  selector: 'docs-version-selector',
  standalone: true,
  imports: [MatIconModule],
  template: `
    <label class="version-selector">
      <span class="docs-visually-hidden">Documentation version</span>
      @if (versions.loading()) {
        <span class="version-selector__state">Loading versions…</span>
      } @else if (versions.error()) {
        <button type="button" (click)="retry()">Retry versions</button>
      } @else {
        <select
          aria-label="Documentation version"
          [value]="versions.selectedVersion() ?? versions.latestVersion()"
          (change)="onChange($event)">
          @for (group of versions.versionGroups(); track group.major) {
            <optgroup [label]="'Angular ' + group.label">
              @for (entry of group.versions; track entry.version) {
                <option [value]="entry.version">
                  v{{ entry.version }}{{ entry.version === versions.latestVersion() ? ' · latest' : '' }}
                </option>
              }
            </optgroup>
          }
        </select>
        <mat-icon class="version-selector__chevron" aria-hidden="true">expand_more</mat-icon>
      }
    </label>
  `,
  styles: [
    `
      :host {
        display: flex;
        align-items: center;
        line-height: normal;
      }
      .version-selector {
        position: relative;
        display: inline-flex;
        align-items: center;
        margin: 0;
      }
      .version-selector select,
      .version-selector button {
        max-width: 170px;
        height: var(--docs-control-height-lg, 44px);
        box-sizing: border-box;
        border: 1px solid var(--docs-border-color);
        border-radius: 10px;
        background: var(--docs-surface-raised);
        color: var(--docs-text);
        font: inherit;
        cursor: pointer;
      }
      .version-selector select {
        appearance: none;
        padding: 0 36px 0 12px;
      }
      .version-selector button {
        padding: 0 12px;
      }
      .version-selector__chevron {
        position: absolute;
        right: 10px;
        width: 18px;
        height: 18px;
        color: var(--docs-text-muted);
        font-size: 18px;
        pointer-events: none;
      }
      .version-selector__state {
        color: var(--docs-text-muted);
        font-size: 12px;
      }
      @media (max-width: 620px) {
        .version-selector select,
        .version-selector button {
          width: 116px;
          max-width: 116px;
        }
        .version-selector select {
          padding: 0 32px 0 8px;
        }
        .version-selector__chevron {
          right: 8px;
        }
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VersionSelectorComponent {
  readonly versions = inject(DocsVersionService);

  constructor() {
    void this.versions.load().catch(() => undefined);
  }

  onChange(event: Event): void {
    void this.versions.select((event.target as HTMLSelectElement).value).catch(() => undefined);
  }

  retry(): void {
    void this.versions.load(true).catch(() => undefined);
  }
}
