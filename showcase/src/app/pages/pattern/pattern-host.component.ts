import { DOCUMENT } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';

/** Class on `<body>` while /pattern is open; styles.scss gives it the library's base typography. */
const PATTERN_BODY_CLASS = 'app-pattern-open';

/**
 * Mount of `@sdcorejs/angular/modules/pattern` at /pattern: the screens cover the viewport, as a portal page
 * would, instead of sitting under the showcase topbar and sidebar.
 */
@Component({
  selector: 'app-pattern-host',
  standalone: true,
  imports: [RouterOutlet],
  template: `<router-outlet></router-outlet>`,
  styles: `
    :host {
      position: fixed;
      inset: 0;
      /* why: under the backdrop (99) and the panel (999) of sd-side-drawer, above the showcase shell. */
      z-index: 98;
      display: flex;
      flex-direction: column;
      background: var(--sd-page-bg, #f9f9f9);
    }
    :host ::ng-deep > router-outlet ~ * {
      flex: 1 1 0;
      min-height: 0;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PatternHostComponent {
  constructor() {
    // why: drawers and dialogs render in the CDK overlay under <body>, outside this host. Without the library's
    // typography they inherit the docs' IBM Plex Sans 15px, and badges, titles and fields no longer match a portal.
    const body = inject(DOCUMENT).body;
    body.classList.add(PATTERN_BODY_CLASS);
    inject(DestroyRef).onDestroy(() => body.classList.remove(PATTERN_BODY_CLASS));
  }
}
