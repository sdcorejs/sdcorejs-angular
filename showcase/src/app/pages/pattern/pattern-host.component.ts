import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

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
export class PatternHostComponent {}
