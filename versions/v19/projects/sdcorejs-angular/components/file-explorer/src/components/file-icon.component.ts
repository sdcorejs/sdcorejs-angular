import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import type { SdFileExplorerIconName } from '../file-explorer-icons.generated';
import { sdFileExplorerIconUrl } from '../file-explorer.utils';

/**
 * Built-in file-type icon (folder, PDF, spreadsheet, image, code…), drawn from the embedded SVG set.
 * Decorative: always `aria-hidden` with an empty `alt`, the item name next to it carries the meaning.
 */
@Component({
  selector: 'sd-file-explorer-file-icon',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'sd-file-explorer-file-icon',
    'aria-hidden': 'true',
    '[attr.data-icon]': 'icon()',
    '[style.--sd-file-explorer-icon-size]': 'size() + "px"',
  },
  template: `<img [src]="src()" alt="" draggable="false" />`,
  styles: `
    :host {
      display: inline-flex;
      flex: none;
      width: var(--sd-file-explorer-icon-size, 32px);
      height: var(--sd-file-explorer-icon-size, 32px);
    }
    img {
      display: block;
      width: 100%;
      height: 100%;
      pointer-events: none;
      user-select: none;
    }
  `,
})
export class SdFileExplorerFileIcon {
  /** Icon to draw. */
  readonly icon = input.required<SdFileExplorerIconName>();
  /** Rendered size in pixels (the SVGs use a 64 × 64 canvas with built-in padding). */
  readonly size = input<number>(32);

  protected readonly src = computed(() => sdFileExplorerIconUrl(this.icon()));
}
