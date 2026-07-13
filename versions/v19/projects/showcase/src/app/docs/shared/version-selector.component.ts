import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { DocsVersionService } from '../core/docs-version.service';

@Component({
  selector: 'docs-version-selector',
  standalone: true,
  template: `
    <label class="version-selector">
      <span class="docs-visually-hidden">Documentation version</span>
      @if (versions.loading()) {
        <span class="version-selector__state">Loading versions…</span>
      } @else if (versions.error()) {
        <button type="button" (click)="retry()">Retry versions</button>
      } @else {
        <select aria-label="Documentation version" [value]="versions.selectedVersion() ?? versions.latestVersion()" (change)="onChange($event)">
          @for (group of versions.versionGroups(); track group.major) {
            <optgroup [label]="'Angular ' + group.label">
              @for (entry of group.versions; track entry.version) {
                <option [value]="entry.version">v{{ entry.version }}{{ entry.version === versions.latestVersion() ? ' · latest' : '' }}</option>
              }
            </optgroup>
          }
        </select>
      }
    </label>
  `,
  styles: [`
    .version-selector { display: inline-flex; align-items: center; }
    .version-selector select,
    .version-selector button {
      max-width: 170px;
      height: 36px;
      border: 1px solid var(--docs-border-color);
      border-radius: 8px;
      background: var(--docs-surface-raised);
      padding: 0 10px;
      color: var(--docs-text);
      cursor: pointer;
    }
    .version-selector__state { color: var(--docs-text-muted); font-size: 12px; }
    @media (max-width: 620px) {
      .version-selector select,
      .version-selector button { width: 116px; max-width: 116px; padding-inline: 7px; }
    }
  `],
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
